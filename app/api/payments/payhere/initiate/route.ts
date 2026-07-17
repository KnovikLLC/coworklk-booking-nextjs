import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildPayhereCheckout } from "@/lib/payhere/build-checkout";

// Doc §6.1 lines 1451-1494, adapted: fetches the booking (+ customer contact
// info, from either the guest fields or the linked user row) via the admin
// client instead of an undefined getBookingById. Hash/form-data building
// itself lives in lib/payhere/build-checkout.ts, shared with the public
// /pay/[bookingId] page.
export async function POST(request: NextRequest) {
  const { bookingId } = await request.json().catch(() => ({}));
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      "id, booking_number, total_amount, status, guest_name, guest_email, guest_phone, user_id, spaces ( name ), users!bookings_user_id_fkey ( full_name, email, phone )"
    )
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ error: "Booking is not awaiting payment" }, { status: 409 });
  }

  const checkout = buildPayhereCheckout({
    id: booking.id,
    booking_number: booking.booking_number,
    total_amount: booking.total_amount,
    guest_name: booking.guest_name,
    guest_email: booking.guest_email,
    guest_phone: booking.guest_phone,
    space_name: booking.spaces?.name ?? null,
    user_full_name: booking.users?.full_name,
    user_email: booking.users?.email,
    user_phone: booking.users?.phone,
  });

  if ("notConfigured" in checkout) {
    return NextResponse.json(
      { error: "PayHere is not configured. Use bank transfer instead." },
      { status: 503 }
    );
  }

  return NextResponse.json(checkout);
}
