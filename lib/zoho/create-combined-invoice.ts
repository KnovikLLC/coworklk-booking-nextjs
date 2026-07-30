import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { findOrCreateCustomer } from "@/lib/zoho/customers";
import { createInvoice, type InvoiceLineItem } from "@/lib/zoho/invoices";
import { ZohoNotConfiguredError } from "@/lib/zoho/client";
import { syncUserContact } from "@/lib/zoho/sync-user-contacts";

export interface CreateCombinedBookingInvoiceOptions {
  paymentReceived?: boolean;
  sendEmail?: boolean;
}

export interface CombinedInvoiceResult {
  invoice_id: string;
  invoice_number: string;
  booking_ids: string[];
  skipped_ids: string[];
}

// Admin-triggered "create one invoice for these N existing bookings"
// action (components/admin/CreateCombinedInvoiceDialog.tsx) — distinct from
// createGroupBookingInvoice, which only runs automatically at multi-item
// order creation time and deliberately splits by calendar date. This
// combines every selected booking's pricing + addon line items into ONE
// invoice regardless of date, which is what a corporate-billing admin
// action needs.
//
// Unlike the automatic invoicing paths (createBookingInvoice,
// createGroupBookingInvoice), this THROWS on failure rather than silently
// swallowing errors — it's an explicit admin action with a UI waiting on
// the result, not a best-effort side effect of booking creation.
//
// Same simplification as createGroupBookingInvoice: bills to the first
// selected booking's customer/contact. This is a corporate-billing tool
// where the selected bookings are expected to share a customer.
export async function createCombinedBookingInvoice(
  supabase: SupabaseClient<Database>,
  bookingIds: string[],
  options: CreateCombinedBookingInvoiceOptions = {}
): Promise<CombinedInvoiceResult> {
  const { paymentReceived = true, sendEmail = true } = options;
  if (bookingIds.length === 0) {
    throw new Error("No bookings selected");
  }

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `id, booking_number, base_amount, discount_amount, total_amount, guest_name, guest_email, guest_phone, user_id, workspace_count, zoho_invoice_id,
       pricing ( zoho_item_id ),
       users!bookings_user_id_fkey ( id, full_name, email, phone, zoho_contact_id ),
       booking_addons ( quantity, unit_price, addons ( zoho_item_id ) )`
    )
    .in("id", bookingIds);

  if (error || !bookings || bookings.length === 0) {
    throw new Error(error?.message ?? "Selected bookings not found");
  }

  const invoiceable = bookings.filter((b) => !b.zoho_invoice_id);
  const skippedIds = bookings.filter((b) => b.zoho_invoice_id).map((b) => b.id);

  if (invoiceable.length === 0) {
    throw new Error("Every selected booking already has an invoice");
  }

  const first = invoiceable[0];
  const name = first.guest_name ?? first.users?.full_name ?? "Customer";
  const email = first.guest_email ?? first.users?.email ?? "";
  const phone = first.guest_phone ?? first.users?.phone ?? "";

  if (!email) {
    throw new Error("The selected bookings' customer has no email on file");
  }

  let contactId: string;
  try {
    if (first.users) {
      const outcome = await syncUserContact(supabase, first.users);
      contactId = outcome.skipped ? first.users.zoho_contact_id! : outcome.contactId;
    } else {
      const customer = await findOrCreateCustomer(email, name, phone);
      contactId = customer.contact_id;
    }
  } catch (err) {
    if (err instanceof ZohoNotConfiguredError) throw new Error("Zoho Books is not configured");
    throw err;
  }

  const lineItems: InvoiceLineItem[] = [];
  for (const booking of invoiceable) {
    if (booking.pricing?.zoho_item_id) {
      const workspaceCount = booking.workspace_count || 1;
      lineItems.push({
        item_id: booking.pricing.zoho_item_id,
        quantity: workspaceCount,
        rate: (Number(booking.base_amount) - Number(booking.discount_amount)) / workspaceCount,
      });
    }
    for (const addonLine of booking.booking_addons ?? []) {
      if (addonLine.addons?.zoho_item_id) {
        lineItems.push({
          item_id: addonLine.addons.zoho_item_id,
          quantity: addonLine.quantity ?? 1,
          rate: Number(addonLine.unit_price),
        });
      }
    }
  }

  if (lineItems.length === 0) {
    throw new Error("None of the selected bookings have Zoho-mapped line items");
  }

  const bookingNumbers = invoiceable.map((b) => b.booking_number);
  const referenceNumber = bookingNumbers[0];
  const notes =
    bookingNumbers.length > 1
      ? `Booking References: ${bookingNumbers.join(", ")}\nThank you for choosing Cowork!`
      : `Booking Reference: ${referenceNumber}\nThank you for choosing Cowork!`;

  let invoice_id: string;
  let invoice_number: string;
  try {
    const result = await createInvoice(contactId, email, referenceNumber, lineItems, paymentReceived, sendEmail, {
      notes,
    });
    invoice_id = result.invoice_id;
    invoice_number = result.invoice_number;
  } catch (err) {
    if (err instanceof ZohoNotConfiguredError) throw new Error("Zoho Books is not configured");
    throw err;
  }

  const invoicedIds = invoiceable.map((b) => b.id);
  const { error: updateError } = await supabase
    .from("bookings")
    .update({ zoho_invoice_id: invoice_id, zoho_invoice_number: invoice_number })
    .in("id", invoicedIds);

  if (updateError) {
    throw new Error(`Invoice ${invoice_number} was created in Zoho, but saving it to these bookings failed: ${updateError.message}`);
  }

  return { invoice_id, invoice_number, booking_ids: invoicedIds, skipped_ids: skippedIds };
}
