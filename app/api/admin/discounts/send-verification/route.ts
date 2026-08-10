import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDiscountApprovalCode } from "@/lib/email/resend";

const sendVerificationSchema = z
  .object({
    booking_id: z.string().uuid().optional(),
    // Required instead of booking_id when requesting a discount for an order
    // that hasn't been created yet (admin "New Booking" flow) — the sum of
    // the order's item base prices, used to bound-check a fixed-amount
    // discount the same way booking.base_amount does for an existing booking.
    order_base_amount: z.number().positive().optional(),
    discount_type: z.enum(["percent", "amount"]),
    discount_value: z.number().positive(),
    discount_reason: z.string().max(100).optional(),
  })
  .refine((data) => !!data.booking_id || !!data.order_base_amount, {
    message: "Either booking_id or order_base_amount is required",
  });

export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const body = await request.json().catch(() => null);
  const parsed = sendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { booking_id, order_base_amount, discount_type, discount_value, discount_reason } = parsed.data;
  const admin = createAdminClient();

  let bookingNumber = "new order";
  let baseAmount = order_base_amount ?? 0;

  if (booking_id) {
    const { data: booking, error: bookingError } = await admin
      .from("bookings")
      .select("id, booking_number, base_amount")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    bookingNumber = booking.booking_number;
    baseAmount = Number(booking.base_amount);
  }

  if (discount_type === "percent" && discount_value > 100) {
    return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
  }
  if (discount_type === "amount" && discount_value > baseAmount) {
    return NextResponse.json({ error: "Discount amount cannot exceed the base amount" }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

  const { data: verification, error: insertError } = await admin
    .from("discount_verifications")
    .insert({
      booking_id: booking_id ?? null,
      discount_type,
      discount_value,
      discount_reason: discount_reason ?? null,
      requested_by: staff.user.id,
      code,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (insertError || !verification) {
    return NextResponse.json({ error: "Failed to generate verification code" }, { status: 500 });
  }

  await sendDiscountApprovalCode(code, bookingNumber, staff.user.email ?? "unknown");

  return NextResponse.json({ success: true, verification_id: verification.id });
}
