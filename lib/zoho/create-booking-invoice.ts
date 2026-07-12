import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { findOrCreateCustomer } from "@/lib/zoho/customers";
import { createInvoice, type InvoiceLineItem } from "@/lib/zoho/invoices";
import { ZohoNotConfiguredError } from "@/lib/zoho/client";

// Orchestrates a Zoho invoice for a just-paid booking: fetches the booking's
// pricing/addon zoho_item_ids, finds-or-creates the Zoho contact, creates the
// invoice, and stamps zoho_invoice_id/number back onto the booking. Shared
// by every payment-confirmation path (PayHere webhook, QR confirm, admin
// walk-in). Never throws — every caller in this codebase treats Zoho as
// best-effort, so this swallows and logs instead, matching the doc's own
// framing of Zoho as a high-but-not-critical-priority integration (§2.3).
export async function createBookingInvoice(
  supabase: SupabaseClient<Database>,
  bookingId: string
): Promise<void> {
  try {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `id, booking_number, base_amount, discount_amount, guest_name, guest_email, guest_phone, user_id,
         pricing ( zoho_item_id ),
         users!bookings_user_id_fkey ( full_name, email, phone ),
         booking_addons ( quantity, unit_price, addons ( zoho_item_id ) )`
      )
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      console.error(`[zoho] booking ${bookingId} not found for invoicing`, error);
      return;
    }

    const name = booking.guest_name ?? booking.users?.full_name ?? "Customer";
    const email = booking.guest_email ?? booking.users?.email ?? "";
    const phone = booking.guest_phone ?? booking.users?.phone ?? "";

    if (!email) {
      console.error(`[zoho] booking ${bookingId} has no customer email, skipping invoice`);
      return;
    }

    const lineItems: InvoiceLineItem[] = [];
    if (booking.pricing?.zoho_item_id) {
      lineItems.push({
        item_id: booking.pricing.zoho_item_id,
        quantity: 1,
        rate: Number(booking.base_amount) - Number(booking.discount_amount),
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

    if (lineItems.length === 0) {
      console.error(`[zoho] booking ${bookingId} has no Zoho-mapped line items, skipping invoice`);
      return;
    }

    const customer = await findOrCreateCustomer(email, name, phone);
    const { invoice_id, invoice_number } = await createInvoice(
      customer.contact_id,
      email,
      booking.booking_number,
      lineItems,
      true
    );

    await supabase
      .from("bookings")
      .update({ zoho_invoice_id: invoice_id, zoho_invoice_number: invoice_number })
      .eq("id", bookingId);
  } catch (error) {
    if (error instanceof ZohoNotConfiguredError) {
      // Expected in this environment — no real Zoho credentials yet.
      return;
    }
    console.error(`[zoho] invoice creation failed for booking ${bookingId}`, error);
  }
}
