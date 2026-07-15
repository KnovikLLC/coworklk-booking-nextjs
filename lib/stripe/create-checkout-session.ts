import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Consolidates the Stripe Checkout Session creation previously duplicated in
// app/api/payments/stripe/initiate/route.ts and app/api/mobile/bookings/route.ts
// (flagged as a known gap in docs/mobile-backend-architecture.md §8). The
// Flutter mobile checkout is the third caller that triggered the cleanup.

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured. Use QR / bank transfer instead.");
    this.name = "StripeNotConfiguredError";
  }
}

export class StripeCheckoutError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "StripeCheckoutError";
    this.status = status;
  }
}

export interface CheckoutReturnUrls {
  success: string;
  cancel: string;
}

// Web (default): hosted pages on the site itself.
export function getWebReturnUrls(bookingId: string): CheckoutReturnUrls {
  const base = process.env.NEXT_PUBLIC_URL ?? "https://cowork.lk";
  return {
    success: `${base}/booking/success?id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${base}/booking/checkout?id=${bookingId}`,
  };
}

// Flutter (in-app WebView): deep-links back into the app via a custom
// URL scheme, e.g. "cowork" -> cowork://booking/success?...
export function getMobileReturnUrls(bookingId: string, returnScheme: string): CheckoutReturnUrls {
  return {
    success: `${returnScheme}://booking/success?id=${bookingId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${returnScheme}://booking/cancel?id=${bookingId}`,
  };
}

export async function createBookingCheckoutSession(
  admin: SupabaseClient<Database>,
  bookingId: string,
  returnUrls: CheckoutReturnUrls
): Promise<{ url: string }> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;
  if (!stripeSecretKey) throw new StripeNotConfiguredError();

  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      "id, booking_number, total_amount, status, booking_date, time_slot, guest_email, workspace_count, spaces ( name ), users!bookings_user_id_fkey ( email )"
    )
    .eq("id", bookingId)
    .single();

  if (error || !booking) throw new StripeCheckoutError("Booking not found", 404);
  if (booking.status !== "pending_payment") {
    throw new StripeCheckoutError("Booking is not awaiting payment", 409);
  }

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
          unit_amount: Math.round(Number(booking.total_amount) * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: returnUrls.success,
    cancel_url: returnUrls.cancel,
    metadata: {
      bookingId: booking.id,
      bookingNumber: booking.booking_number,
    },
    customer_email: email,
  });

  if (!session.url) throw new StripeCheckoutError("Stripe did not return a checkout URL", 500);

  return { url: session.url };
}
