import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { markBookingPaid } from "@/lib/bookings/payments";

const confirmQrSchema = z.object({
  booking_id: z.string().uuid(),
  note: z.string().max(500).optional(),
});

// Doc §4.2 POST /api/admin/payments/confirm-qr — front desk staff manually
// confirms a bank transfer / QR payment for a pending_payment booking.
export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const parsed = confirmQrSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select("id, total_amount, status")
    .eq("id", parsed.data.booking_id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ error: "Booking is not awaiting payment" }, { status: 409 });
  }

  await markBookingPaid(admin, {
    bookingId: booking.id,
    amount: Number(booking.total_amount),
    method: "qr_transfer",
    qrConfirmedBy: staff.user.id,
    qrConfirmationNote: parsed.data.note ?? null,
  });

  return NextResponse.json({ success: true });
}
