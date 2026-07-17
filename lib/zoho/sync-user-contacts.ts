import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { findOrCreateCustomer } from "@/lib/zoho/customers";
import { ZohoNotConfiguredError } from "@/lib/zoho/client";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  zoho_contact_id: string | null;
};

/**
 * Ensures a single user has a Zoho contact, creating one (or matching an
 * existing Zoho contact by email/phone) if `zoho_contact_id` isn't already
 * set, and persisting the contact_id back onto the row. No-ops if already
 * synced. Callers decide how to handle ZohoNotConfiguredError/other errors
 * (matching the non-blocking idiom used everywhere else Zoho is called).
 */
export async function syncUserContact(
  supabase: SupabaseClient<Database>,
  user: UserRow
): Promise<{ skipped: true } | { skipped: false; contactId: string }> {
  if (user.zoho_contact_id) {
    return { skipped: true };
  }

  const contact = await findOrCreateCustomer(user.email, user.full_name ?? "Customer", user.phone ?? "");

  await supabase.from("users").update({ zoho_contact_id: contact.contact_id }).eq("id", user.id);

  return { skipped: false, contactId: contact.contact_id };
}

/** Fetches the user row by id, then delegates to syncUserContact. */
export async function syncUserContactById(supabase: SupabaseClient<Database>, userId: string): Promise<void> {
  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name, phone, zoho_contact_id")
    .eq("id", userId)
    .single();

  if (!user) return;
  await syncUserContact(supabase, user);
}

export interface UserContactSyncResult {
  success: boolean;
  skipped: boolean;
  users_checked: number;
  contacts_created: number;
  errors: string[];
}

/**
 * Backfill: every user row without a zoho_contact_id gets one. Mirrors
 * syncZohoItems' zoho_sync_log bookkeeping and graceful-degradation
 * (ZohoNotConfiguredError -> skipped, not failed) so the admin sync
 * dashboard can show this alongside the item sync.
 */
export async function syncAllUserContacts(
  supabase: SupabaseClient<Database>,
  triggeredBy: string = "manual"
): Promise<UserContactSyncResult> {
  const { data: syncLog } = await supabase
    .from("zoho_sync_log")
    .insert({ sync_type: "user_contacts", status: "running", triggered_by: triggeredBy })
    .select()
    .single();

  const result: UserContactSyncResult = {
    success: true,
    skipped: false,
    users_checked: 0,
    contacts_created: 0,
    errors: [],
  };

  try {
    // Staff (admin/frontdesk) aren't customers — only sync real members.
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, full_name, phone, zoho_contact_id")
      .is("zoho_contact_id", null)
      .eq("role", "customer");

    if (error) throw error;

    for (const user of users ?? []) {
      result.users_checked++;
      try {
        const outcome = await syncUserContact(supabase, user);
        if (!outcome.skipped) result.contacts_created++;
      } catch (err) {
        if (err instanceof ZohoNotConfiguredError) throw err; // stop the whole run, not just this user
        result.errors.push(`${user.email}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }
  } catch (error) {
    if (error instanceof ZohoNotConfiguredError) {
      result.skipped = true;
      result.errors.push(error.message);
    } else {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : "Unknown error");
    }
  }

  if (syncLog?.id) {
    await supabase
      .from("zoho_sync_log")
      .update({
        status: result.skipped ? "skipped" : result.success && result.errors.length === 0 ? "completed" : "failed",
        completed_at: new Date().toISOString(),
        items_synced: result.users_checked,
        items_created: result.contacts_created,
        error_message: result.errors.join("; ") || null,
      })
      .eq("id", syncLog.id);
  }

  return result;
}
