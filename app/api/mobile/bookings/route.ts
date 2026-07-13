import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMobileApiKey } from "@/lib/auth/require-mobile-api-key";
import { mobileBookingCreateSchema } from "@/lib/validation/mobile-booking.schema";
import { createBooking, BookingError } from "@/lib/bookings/create";
import { createBookingInvoice } from "@/lib/zoho/create-booking-invoice";
import { sendPaymentRequestEmail } from "@/lib/email/resend";

// Cowork Admin Assist: the front-desk app's booking-submission endpoint.
// Creates an unpaid (pending_payment) booking from a phone call, then —
// if the caller's email is known — invoices it in Zoho (accounting record
// only, not emailed by Zoho itself) and emails the customer a payment link.
// If no email: booking is still created, Zoho/email steps are skipped
// gracefully, matching this app's existing "Zoho is best-effort" posture.
export async function POST(request: NextRequest) {
  const auth = requireMobileApiKey(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = mobileBookingCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const admin = createAdminClient();

  let booking;
  try {
    booking = await createBooking(admin, {
      spaceId: input.space_id,
      pricingId: input.pricing_id,
      date: input.date,
      slot: input.slot,
      addons: input.addons,
      notes: input.notes,
      guestName: input.guest_name,
      guestEmail: input.guest_email,
      guestPhone: input.guest_phone,
      agentName: input.agent_name,
      markConfirmed: false,
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Could not create booking" }, { status: 500 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;
  const paymentLink = `${process.env.NEXT_PUBLIC_URL}/pay/${booking.id}`;
  let invoiced = false;
  let stripeCheckoutUrl: string | null = null;

  if (stripeSecretKey) {
    try {
      const stripe = new Stripe(stripeSecretKey);
      const email = input.guest_email || undefined;
      
      const { data: spaceData } = await admin
        .from("spaces")
        .select("name")
        .eq("id", input.space_id)
        .single();
      const spaceName = spaceData?.name ?? "Coworking Space Booking";

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "lkr",
              product_data: {
                name: spaceName,
                description: `Booking #${booking.booking_number} on ${input.date} (${input.slot.replace("_", " ")})`,
              },
              unit_amount: Math.round(Number(booking.total_amount) * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.NEXT_PUBLIC_URL}/booking/success?id=${booking.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/booking/checkout?id=${booking.id}`,
        metadata: {
          bookingId: booking.id,
          bookingNumber: booking.booking_number,
        },
        customer_email: email,
      });
      stripeCheckoutUrl = session.url;
    } catch (err) {
      console.error("[mobile/bookings] Stripe session creation failed:", err);
    }
  }

  if (input.guest_email) {
    // createBookingInvoice never throws (swallows ZohoNotConfiguredError,
    // logs everything else) — booking creation above has already succeeded
    // regardless of what happens here.
    await createBookingInvoice(admin, booking.id, { paymentReceived: false, sendEmail: false });

    const { data: invoicedBooking } = await admin
      .from("bookings")
      .select("zoho_invoice_id")
      .eq("id", booking.id)
      .single();
    invoiced = Boolean(invoicedBooking?.zoho_invoice_id);

    try {
      await sendPaymentRequestEmail(booking.id, paymentLink);
    } catch (error) {
      console.error(`[mobile/bookings] payment request email failed for booking ${booking.id}`, error);
    }
  }

  return NextResponse.json(
    {
      booking,
      payment_link: paymentLink,
      stripe_checkout_url: stripeCheckoutUrl,
      zoho: { invoiced },
    },
    { status: 201 }
  );
}
