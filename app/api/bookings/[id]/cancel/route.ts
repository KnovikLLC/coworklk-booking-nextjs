import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateRefund } from "@/lib/bookings/cancellation";

// Doc: docs/cowork-booking-architecture.md §7.3 POST /api/bookings/:id/cancel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const body = await request.json().catch(() => null);
  const userReason = body?.reason ?? "Cancelled by user";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  // Retrieve the booking row using admin privileges to inspect details
  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select("id, booking_number, booking_date, time_slot, start_time, end_time, user_id, status, total_amount, guest_email")
    .eq("id", id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Authorization check
  if (booking.user_id) {
    let isStaff = false;
    if (user) {
      const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();
      isStaff = !!profile && ["admin", "frontdesk"].includes(profile.role ?? "");
    }

    if (!user || (user.id !== booking.user_id && !isStaff)) {
      return NextResponse.json({ error: "Not authorized to cancel this booking" }, { status: 403 });
    }
  }

  // Check if booking is in a cancellable state
  if (!["pending_payment", "confirmed"].includes(booking.status ?? "")) {
    return NextResponse.json(
      { error: `Cannot cancel a booking with status '${booking.status}'` },
      { status: 400 }
    );
  }

  // Compute refund parameters
  let refundAmount = 0;
  let refundPercentage = 0;
  let refundReason = "Unpaid booking cancellation";

  if (booking.status === "confirmed") {
    const calc = calculateRefund(
      {
        total_amount: Number(booking.total_amount),
        booking_date: booking.booking_date,
        start_time: booking.start_time,
      },
      new Date()
    );
    refundAmount = calc.refund_amount;
    refundPercentage = calc.refund_percentage;
    refundReason = calc.reason;
  }

  // Persist cancellation details in Supabase
  const { data: updatedBooking, error: updateError } = await admin
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: `${userReason} (${refundReason})`,
      refund_amount: refundAmount,
    })
    .eq("id", id)
    .select("id, booking_number, status, refund_amount")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    booking: updatedBooking,
    refund: {
      amount: refundAmount,
      percentage: refundPercentage,
      reason: refundReason,
    },
  });
}
