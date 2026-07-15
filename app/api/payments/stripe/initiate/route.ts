import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createBookingCheckoutSession,
  getMobileReturnUrls,
  getWebReturnUrls,
  StripeCheckoutError,
  StripeNotConfiguredError,
} from "@/lib/stripe/create-checkout-session";

// Accepts an optional `returnScheme` (e.g. "cowork") so the Flutter app's
// in-app WebView checkout deep-links back into the app instead of the
// hardcoded cowork.lk web URLs used by the browser checkout flow.
export async function POST(request: NextRequest) {
  const { bookingId, returnScheme } = await request.json().catch(() => ({}));
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const returnUrls = returnScheme ? getMobileReturnUrls(bookingId, returnScheme) : getWebReturnUrls(bookingId);

  try {
    const { url } = await createBookingCheckoutSession(admin, bookingId, returnUrls);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    if (err instanceof StripeCheckoutError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[Stripe Checkout] Session creation failed:", err);
    const errorMessage = err instanceof Error ? err.message : "Could not initiate Stripe payment";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
