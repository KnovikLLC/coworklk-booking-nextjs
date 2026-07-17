import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";

// Doc §5.3 line 1218: GET /api/admin/zoho/sync/status — last sync status +
// mapping counts, backing the admin sync dashboard mockup (§5.3).
export async function GET() {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const admin = createAdminClient();

  const [{ data: lastSync }, { data: mappings }, { data: lastUserSync }, { count: totalUsers }, { count: syncedUsers }] =
    await Promise.all([
      admin
        .from("zoho_sync_log")
        .select("*")
        .eq("sync_type", "items")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin.from("zoho_item_mapping").select("zoho_status, local_entity_type"),
      admin
        .from("zoho_sync_log")
        .select("*")
        .eq("sync_type", "user_contacts")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      // Staff (admin/frontdesk) aren't customers and are never synced — see
      // lib/zoho/sync-user-contacts.ts — so they're excluded here too,
      // otherwise "unsynced" would never reach 0.
      admin.from("users").select("id", { count: "exact", head: true }).eq("role", "customer"),
      admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "customer")
        .not("zoho_contact_id", "is", null),
    ]);

  const active = (mappings ?? []).filter((m) => m.zoho_status === "active").length;
  const inactive = (mappings ?? []).filter((m) => m.zoho_status === "inactive").length;
  const mapped = (mappings ?? []).filter((m) => m.local_entity_type !== "unmapped").length;
  const unmapped = (mappings ?? []).filter((m) => m.local_entity_type === "unmapped").length;

  const configured = Boolean(
    process.env.ZOHO_CLIENT_ID &&
      process.env.ZOHO_CLIENT_SECRET &&
      process.env.ZOHO_REFRESH_TOKEN &&
      process.env.ZOHO_ORGANIZATION_ID
  );

  return NextResponse.json({
    configured,
    last_sync: lastSync ?? null,
    mapping_status: { active, inactive, mapped, unmapped },
    last_user_sync: lastUserSync ?? null,
    user_contact_status: {
      total: totalUsers ?? 0,
      synced: syncedUsers ?? 0,
      unsynced: (totalUsers ?? 0) - (syncedUsers ?? 0),
    },
  });
}
