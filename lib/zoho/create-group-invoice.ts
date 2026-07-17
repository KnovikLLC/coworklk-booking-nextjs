import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { findOrCreateCustomer } from "@/lib/zoho/customers";
import { createInvoice, recordInvoicePayment, type InvoiceLineItem } from "@/lib/zoho/invoices";
import { ZohoNotConfiguredError } from "@/lib/zoho/client";
import { syncUserContact } from "@/lib/zoho/sync-user-contacts";

export interface CreateGroupBookingInvoiceOptions {
  paymentReceived?: boolean;
  sendEmail?: boolean;
}

// Multi-item admin "order" analogue of createBookingInvoice: one admin
// submission can create several bookings sharing a booking_group_id (see
// app/api/admin/bookings/batch). Zoho gets one invoice PER CALENDAR DATE in
// that group (confirmed product decision — a client booking 3 spaces on
// Wednesday and 2 on Thursday gets exactly 2 invoices), each combining every
// booking's pricing + addon line items for that date. Every booking row in a
// date group gets the same zoho_invoice_id/number stamped on it, so the
// existing per-row idempotency check in createBookingInvoice (used by every
// payment-confirmation path — PayHere/Stripe webhooks, QR confirm) keeps
// working unmodified if one of these rows is touched again later.
export async function createGroupBookingInvoice(
  supabase: SupabaseClient<Database>,
  bookingIds: string[],
  options: CreateGroupBookingInvoiceOptions = {}
): Promise<void> {
  const { paymentReceived = true, sendEmail = true } = options;
  if (bookingIds.length === 0) return;

  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(
        `id, booking_number, booking_date, base_amount, discount_amount, total_amount, guest_name, guest_email, guest_phone, user_id, workspace_count, zoho_invoice_id,
         pricing ( zoho_item_id ),
         users!bookings_user_id_fkey ( id, full_name, email, phone, zoho_contact_id ),
         booking_addons ( quantity, unit_price, addons ( zoho_item_id ) )`
      )
      .in("id", bookingIds);

    if (error || !bookings || bookings.length === 0) {
      console.error(`[zoho] group booking lookup failed for ${bookingIds.join(",")}`, error);
      return;
    }

    // All bookings in one admin order share the same customer.
    const first = bookings[0];
    const name = first.guest_name ?? first.users?.full_name ?? "Customer";
    const email = first.guest_email ?? first.users?.email ?? "";
    const phone = first.guest_phone ?? first.users?.phone ?? "";

    if (!email) {
      console.error(`[zoho] booking group ${bookingIds.join(",")} has no customer email, skipping invoice`);
      return;
    }

    let contactId: string;
    if (first.users) {
      const outcome = await syncUserContact(supabase, first.users);
      contactId = outcome.skipped ? first.users.zoho_contact_id! : outcome.contactId;
    } else {
      const customer = await findOrCreateCustomer(email, name, phone);
      contactId = customer.contact_id;
    }

    const byDate = new Map<string, typeof bookings>();
    for (const booking of bookings) {
      if (booking.zoho_invoice_id) continue; // already invoiced, skip (idempotency)
      const list = byDate.get(booking.booking_date) ?? [];
      list.push(booking);
      byDate.set(booking.booking_date, list);
    }

    for (const [date, dateBookings] of Array.from(byDate.entries())) {
      const lineItems: InvoiceLineItem[] = [];
      for (const booking of dateBookings) {
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
        console.error(`[zoho] booking group ${bookingIds.join(",")} date ${date} has no Zoho-mapped line items, skipping`);
        continue;
      }

      const bookingNumbers = dateBookings.map((b) => b.booking_number);
      const referenceNumber = bookingNumbers[0];
      const notes =
        bookingNumbers.length > 1
          ? `Booking References: ${bookingNumbers.join(", ")}\nThank you for choosing Cowork!`
          : `Booking Reference: ${referenceNumber}\nThank you for choosing Cowork!`;

      const { invoice_id, invoice_number } = await createInvoice(
        contactId,
        email,
        referenceNumber,
        lineItems,
        paymentReceived,
        sendEmail,
        { invoiceDate: date, notes }
      );

      const idsForDate = dateBookings.map((b) => b.id);
      await supabase
        .from("bookings")
        .update({ zoho_invoice_id: invoice_id, zoho_invoice_number: invoice_number })
        .in("id", idsForDate);
    }

    // Any bookings that already had a zoho_invoice_id (shouldn't normally
    // happen for a fresh batch, but mirrors createBookingInvoice's
    // idempotency guard) just get their payment recorded if needed.
    if (paymentReceived) {
      for (const booking of bookings) {
        if (!booking.zoho_invoice_id) continue;
        await recordInvoicePayment(contactId, booking.zoho_invoice_id, Number(booking.total_amount));
      }
    }
  } catch (error) {
    if (error instanceof ZohoNotConfiguredError) {
      return;
    }
    console.error(`[zoho] group invoice creation failed for bookings ${bookingIds.join(",")}`, error);
  }
}
