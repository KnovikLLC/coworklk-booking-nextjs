import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;

export async function POST(request: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "Stripe is not configured. Use bank transfer instead." },
      { status: 503 }
    );
  }

  const { bookingId } = await request.json().catch(() => ({}));
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      "id, booking_number, total_amount, status, booking_date, time_slot, guest_name, guest_email, guest_phone, user_id, workspace_count, spaces ( name ), users!bookings_user_id_fkey ( full_name, email, phone )"
    )
    .eq("id", bookingId)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "pending_payment") {
    return NextResponse.json({ error: "Booking is not awaiting payment" }, { status: 409 });
  }

  try {
    const stripe = new Stripe(stripeSecretKey);

    const email = booking.guest_email ?? booking.users?.email ?? undefined;
    const spaceName = booking.spaces?.name ?? "Coworking Space Booking";
    const seatsLabel = booking.workspace_count > 1 ? ` (${booking.workspace_count} seats)` : "";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "lkr",
            product_data: {
              name: `${spaceName}${seatsLabel}`,
              description: `Booking #${booking.booking_number} on ${booking.booking_date} (${booking.time_slot.replace("_", " ")})`,
            },
            unit_amount: Math.round(Number(booking.total_amount) * 100), // Standard standard decimal LKR expects cents (multiplied by 100)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `https://cowork.lk/booking/success?id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://cowork.lk/booking/checkout?id=${booking.id}`, // fallback url
      metadata: {
        bookingId: booking.id,
        bookingNumber: booking.booking_number,
      },
      customer_email: email,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error("[Stripe Checkout] Session creation failed:", err);
    const errorMessage = err instanceof Error ? err.message : "Could not initiate Stripe payment";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
