import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { markBookingPaid } from "@/lib/bookings/payments";
import { createBookingInvoice } from "@/lib/zoho/create-booking-invoice";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_TEST_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!stripeSecretKey) {
    return new NextResponse("Stripe secret key not configured", { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = new Stripe(stripeSecretKey);

    if (!stripeWebhookSecret) {
      console.warn("[Stripe Webhook] Webhook secret not configured. Skipping signature verification in development.");
      // We will parse without verification ONLY if no secret is set.
      // But Stripe constructEvent is highly recommended. Let's try to verify if we have a secret, or fallback.
      // Actually, standard Stripe CLI webhook testing provides a whsec_ secret, so we should expect it.
      // If we don't have it, we can fallback to parsing body directly (only if environment is local dev).
      const isLocal = process.env.NEXT_PUBLIC_URL?.includes("localhost") || process.env.NODE_ENV === "development";
      if (isLocal) {
        event = JSON.parse(body) as Stripe.Event;
      } else {
        return new NextResponse("Webhook secret missing in production", { status: 500 });
      }
    } else {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`[Stripe Webhook] Error constructing event: ${errorMessage}`);
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.bookingId;

    if (!bookingId) {
      console.error("[Stripe Webhook] No bookingId in session metadata");
      return new NextResponse("Booking ID not found in session metadata", { status: 400 });
    }

    const admin = createAdminClient();
    const { data: booking, error } = await admin
      .from("bookings")
      .select("id, total_amount, status")
      .eq("id", bookingId)
      .single();

    if (error || !booking) {
      console.error(`[Stripe Webhook] Booking ${bookingId} not found`);
      return new NextResponse("Booking not found", { status: 404 });
    }

    // Skip if already processed to ensure idempotency
    if (booking.status === "confirmed" || booking.status === "completed") {
      console.log(`[Stripe Webhook] Booking ${bookingId} is already paid. Skipping.`);
      return new NextResponse("OK");
    }

    const paidAmount = session.amount_total ? session.amount_total / 100 : Number(booking.total_amount);

    try {
      await markBookingPaid(admin, {
        bookingId: booking.id,
        amount: paidAmount,
        method: "stripe",
        gatewayTransactionId: (session.payment_intent as string) || session.id,
        gatewayResponse: session as unknown as import("@/lib/types/database.types").Json,
      });

      await createBookingInvoice(admin, booking.id);
    } catch (paymentError: unknown) {
      const errorMessage = paymentError instanceof Error ? paymentError.message : "Unknown error";
      console.error(`[Stripe Webhook] Error marking booking paid: ${errorMessage}`);
      return new NextResponse(`Payment Error: ${errorMessage}`, { status: 500 });
    }
  }

  return new NextResponse("OK");
}
