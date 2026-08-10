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

  let discountOverride: { percent: number; reason: string | null } | undefined;
  let discountVerificationId: string | undefined;

  if (body.discount_verification_id) {
    const { data: verification, error: verificationError } = await admin
      .from("discount_verifications")
      .select("id, booking_id, discount_type, discount_value, discount_reason, verified_at")
      .eq("id", body.discount_verification_id)
      .single();

    if (verificationError || !verification || !verification.verified_at || verification.booking_id) {
      return NextResponse.json({ error: "Discount code is not valid or has already been used" }, { status: 400 });
    }

    if (verification.discount_type === "percent") {
      discountOverride = { percent: verification.discount_value, reason: verification.discount_reason };
    } else {
      const pricingIds = Array.from(new Set(body.items.map((item) => item.pricing_id)));
      const { data: pricingRows, error: pricingError } = await admin
        .from("pricing")
        .select("id, price")
        .in("id", pricingIds);

      if (pricingError || !pricingRows) {
        return NextResponse.json({ error: "Could not price the order for the discount" }, { status: 500 });
      }
      const priceById = new Map(pricingRows.map((p) => [p.id, Number(p.price)]));
      const orderBaseAmount = body.items.reduce(
        (sum, item) => sum + (priceById.get(item.pricing_id) ?? 0) * item.workspace_count,
        0
      );
      const percent = orderBaseAmount > 0 ? (verification.discount_value / orderBaseAmount) * 100 : 0;
      discountOverride = { percent, reason: verification.discount_reason };
    }
    discountVerificationId = verification.id;
  }

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
        discountOverride,
      });
      bookings.push(booking);
    }

    if (discountVerificationId && bookings[0]) {
      await admin
        .from("discount_verifications")
        .update({ booking_id: bookings[0].id })
        .eq("id", discountVerificationId);
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
