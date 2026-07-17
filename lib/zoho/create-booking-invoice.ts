import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { findOrCreateCustomer } from "@/lib/zoho/customers";
import { createInvoice, recordInvoicePayment, type InvoiceLineItem } from "@/lib/zoho/invoices";
import { ZohoNotConfiguredError } from "@/lib/zoho/client";
import { syncUserContact } from "@/lib/zoho/sync-user-contacts";

export interface CreateBookingInvoiceOptions {
  /** Zoho records the invoice as already paid. Default true (payment-confirmation callers). */
  paymentReceived?: boolean;
  /** Whether Zoho itself emails the invoice to the customer. Default true.
   *  Cowork Admin Assist passes false: its own Resend email already carries
   *  the payment link, so a separate Zoho email would be a third redundant
   *  message alongside email + WhatsApp. */
  sendEmail?: boolean;
}

// Orchestrates a Zoho invoice for a booking: fetches the booking's
// pricing/addon zoho_item_ids, finds-or-creates the Zoho contact, creates the
// invoice, and stamps zoho_invoice_id/number back onto the booking. Shared
// by every booking-creation path (web/mobile/admin, invoiced unpaid up
// front) and every payment-confirmation path (PayHere/Stripe webhooks, QR
// confirm, admin walk-in — paymentReceived: true). Idempotent: if the
// booking already has a zoho_invoice_id (invoiced at creation, now being
// paid), this records payment against that same invoice instead of
// creating a second one for the same charge. Never throws — every caller in
// this codebase treats Zoho as best-effort, so this swallows and logs
// instead, matching the doc's own framing of Zoho as a high-but-not-
// critical-priority integration (§2.3).
export async function createBookingInvoice(
  supabase: SupabaseClient<Database>,
  bookingId: string,
  options: CreateBookingInvoiceOptions = {}
): Promise<void> {
  const { paymentReceived = true, sendEmail = true } = options;
  try {
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(
        `id, booking_number, base_amount, discount_amount, total_amount, guest_name, guest_email, guest_phone, user_id, workspace_count, zoho_invoice_id,
         pricing ( zoho_item_id ),
         users!bookings_user_id_fkey ( id, full_name, email, phone, zoho_contact_id ),
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

    // Registered members get their zoho_contact_id persisted for reuse
    // (profile page, future invoices) — guests just get a one-off
    // find-or-create with no row to persist onto.
    let contactId: string;
    if (booking.users) {
      const outcome = await syncUserContact(supabase, booking.users);
      contactId = outcome.skipped ? booking.users.zoho_contact_id! : outcome.contactId;
    } else {
      const customer = await findOrCreateCustomer(email, name, phone);
      contactId = customer.contact_id;
    }

    // Already invoiced (e.g. invoiced unpaid at booking-creation time) —
    // don't create a duplicate invoice for the same charge, just record the
    // payment now that it's arrived.
    if (booking.zoho_invoice_id) {
      if (paymentReceived) {
        await recordInvoicePayment(contactId, booking.zoho_invoice_id, Number(booking.total_amount));
      }
      return;
    }

    const lineItems: InvoiceLineItem[] = [];
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

    if (lineItems.length === 0) {
      console.error(`[zoho] booking ${bookingId} has no Zoho-mapped line items, skipping invoice`);
      return;
    }

    const { invoice_id, invoice_number } = await createInvoice(
      contactId,
      email,
      booking.booking_number,
      lineItems,
      paymentReceived,
      sendEmail
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
