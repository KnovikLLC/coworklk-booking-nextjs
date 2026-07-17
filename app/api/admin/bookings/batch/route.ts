import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminBookingBatchCreateSchema } from "@/lib/validation/booking.schema";
import { BookingError, createBooking } from "@/lib/bookings/create";
import { markBookingPaid } from "@/lib/bookings/payments";
import { createGroupBookingInvoice } from "@/lib/zoho/create-group-invoice";

// Multi-space and/or multi-day admin "order": one submission creates several
// bookings (one per item) sharing a booking_group_id, then Zoho gets one
// invoice per calendar date across the whole order. Additive alongside the
// existing single-item POST /api/admin/bookings, which stays for the mobile
// agent and any other single-booking caller.
export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const parsed = adminBookingBatchCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const admin = createAdminClient();
  const markConfirmed =
    body.payment_received ?? (body.payment_method === "cash" || body.payment_method === "card_terminal");
  const bookingGroupId = crypto.randomUUID();

  try {
    const bookings = [];
    for (const item of body.items) {
      const booking = await createBooking(admin, {
        spaceId: item.space_id,
        pricingId: item.pricing_id,
        date: item.date,
        slot: item.slot,
        addons: item.addons,
        notes: item.notes,
        guestName: body.customer.name,
        guestEmail: body.customer.email,
        guestPhone: body.customer.phone,
        createdBy: staff.user.id,
        markConfirmed,
        workspaceCount: item.workspace_count,
        bookingGroupId,
      });
      bookings.push(booking);
    }

    if (markConfirmed) {
      for (const booking of bookings) {
        await markBookingPaid(admin, {
          bookingId: booking.id,
          amount: booking.total_amount,
          method: body.payment_method,
        });
      }
    }

    await createGroupBookingInvoice(
      admin,
      bookings.map((b) => b.id),
      { paymentReceived: markConfirmed }
    );

    return NextResponse.json({ bookings, booking_group_id: bookingGroupId }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
