import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";

const confirmDiscountSchema = z.object({
  verification_id: z.string().uuid(),
  code: z.string().length(6),
});

export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = confirmDiscountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { verification_id, code } = parsed.data;
  const admin = createAdminClient();

  const { data: verification, error: verificationError } = await admin
    .from("discount_verifications")
    .select("id, booking_id, discount_type, discount_value, discount_reason, code, expires_at, verified_at")
    .eq("id", verification_id)
    .is("verified_at", null)
    .single();

  if (verificationError || !verification) {
    return NextResponse.json({ error: "No pending discount request found for this code" }, { status: 400 });
  }

  if (new Date(verification.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This code has expired. Please request a new one." }, { status: 400 });
  }

  if (verification.code !== code) {
    return NextResponse.json({ error: "Incorrect code" }, { status: 400 });
  }

  const { error: markVerifiedError } = await admin
    .from("discount_verifications")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", verification_id);

  if (markVerifiedError) {
    return NextResponse.json({ error: "Failed to confirm verification code" }, { status: 500 });
  }

  // Pre-creation discount (admin "New Booking" flow): no booking exists yet,
  // so there's nothing to update — the discount gets applied when the order
  // is submitted, via discount_verification_id on POST /api/admin/bookings/batch.
  if (!verification.booking_id) {
    return NextResponse.json({
      success: true,
      discount: {
        type: verification.discount_type,
        value: verification.discount_value,
        reason: verification.discount_reason,
      },
    });
  }

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select("id, base_amount, addons_amount")
    .eq("id", verification.booking_id)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const baseAmount = Number(booking.base_amount);
  const addonsAmount = Number(booking.addons_amount ?? 0);
  const discountPercent = verification.discount_type === "percent" ? verification.discount_value : 0;
  const discountAmount =
    verification.discount_type === "percent"
      ? Math.round(baseAmount * (verification.discount_value / 100))
      : verification.discount_value;
  const totalAmount = baseAmount - discountAmount + addonsAmount;

  const { data: updatedBooking, error: updateError } = await admin
    .from("bookings")
    .update({
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      discount_reason: verification.discount_reason,
      total_amount: totalAmount,
    })
    .eq("id", verification.booking_id)
    .select("id, booking_number, discount_percent, discount_amount, discount_reason, total_amount")
    .single();

  if (updateError || !updatedBooking) {
    return NextResponse.json({ error: "Failed to apply discount to booking" }, { status: 500 });
  }

  return NextResponse.json({ success: true, booking: updatedBooking });
}
