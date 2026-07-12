import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePayhereHash } from "@/lib/payhere/hash";

// Doc §6.1 lines 1451-1494, adapted: fetches the booking (+ customer contact
// info, from either the guest fields or the linked user row) via the admin
// client instead of an undefined getBookingById, and builds the sandbox/live
// URL from PAYHERE_MODE.
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

  const name = booking.guest_name ?? booking.users?.full_name ?? "Customer";
  const email = booking.guest_email ?? booking.users?.email ?? "";
  const phone = booking.guest_phone ?? booking.users?.phone ?? "";
  const [firstName, ...rest] = name.split(" ");

  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !merchantSecret) {
    return NextResponse.json(
      { error: "PayHere is not configured. Use QR / bank transfer instead." },
      { status: 503 }
    );
  }

  const amount = Number(booking.total_amount);
  const paymentData = {
    merchant_id: merchantId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/booking/success?id=${booking.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/booking/cancel?id=${booking.id}`,
    notify_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/payhere`,
    order_id: booking.booking_number,
    items: booking.spaces?.name ?? "Cowork.lk Booking",
    currency: "LKR",
    amount,
    first_name: firstName || "Customer",
    last_name: rest.join(" ") || "-",
    email,
    phone,
    address: "N/A",
    city: "Colombo",
    country: "Sri Lanka",
    hash: generatePayhereHash(merchantId, booking.booking_number, amount, "LKR", merchantSecret),
  };

  return NextResponse.json({
    payhere_url:
      process.env.PAYHERE_MODE === "live"
        ? "https://www.payhere.lk/pay/checkout"
        : "https://sandbox.payhere.lk/pay/checkout",
    form_data: paymentData,
  });
}
