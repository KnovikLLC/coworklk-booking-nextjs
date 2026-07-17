import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingCreateSchema } from "@/lib/validation/booking.schema";
import { BookingError, createBooking } from "@/lib/bookings/create";
import { markBookingPaid } from "@/lib/bookings/payments";
import { createBookingInvoice } from "@/lib/zoho/create-booking-invoice";
import type { BookingCreateResponse } from "@/lib/types/domain";

// Doc: docs/cowork-booking-architecture.md §4.1 POST /api/bookings
// Uses the admin (service-role) client for the write: guest bookings have
// no session for RLS, and guest_profiles is service-role-only by design
// (see supabase/migrations/20260712173531_guest_profiles.sql).
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bookingCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const authClient = createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user && (!body.guest_name || !body.guest_email || !body.guest_phone)) {
    return NextResponse.json(
      { error: "guest_name, guest_email, and guest_phone are required for guest checkout" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const isDomainVerification = body.payment_method === "domain_verification";
  if (isDomainVerification) {
    const email = body.verification_email;
    const code = body.verification_code;

    if (!email || !code) {
      return NextResponse.json(
        { error: "Verification email and code are required for domain verification" },
        { status: 400 }
      );
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) {
      return NextResponse.json({ error: "Invalid verification email domain" }, { status: 400 });
    }

    // A. Check domain is preconfigured
    const { data: domainRecord, error: domainError } = await admin
      .from("preconfigured_domains")
      .select("domain")
      .eq("domain", domain)
      .single();

    if (domainError || !domainRecord) {
      return NextResponse.json(
        { error: "Your email domain does not qualify for auto-confirmation" },
        { status: 403 }
      );
    }

    // B. Validate 2FA code matches and is active
    const { data: verification, error: verificationError } = await admin
      .from("domain_verifications")
      .select("id, expires_at, verified_at")
      .eq("email", email.toLowerCase().trim())
      .eq("code", code.trim())
      .is("verified_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    const hasExpired = new Date(verification.expires_at).getTime() < Date.now();
    if (hasExpired) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    // C. Mark verification as verified
    await admin
      .from("domain_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verification.id);
  }

  try {
    const booking = await createBooking(admin, {
      spaceId: body.space_id,
      pricingId: body.pricing_id,
      date: body.date,
      slot: body.slot,
      addons: body.addons,
      notes: body.notes,
      userId: user?.id ?? null,
      guestName: user ? undefined : body.guest_name,
      guestEmail: isDomainVerification ? body.verification_email : (user ? undefined : body.guest_email),
      guestPhone: user ? undefined : body.guest_phone,
      workspaceCount: body.workspace_count,
    });

    if (isDomainVerification) {
      await markBookingPaid(admin, {
        bookingId: booking.id,
        amount: Number(booking.total_amount),
        method: "domain_verification",
      });

      // Update status locally in reference so 201 returns confirmed status
      booking.status = "confirmed";
    }

    // Invoice every booking at creation time, paid or not — a still-pending
    // booking gets an unpaid invoice now (createBookingInvoice never
    // throws); when payment later confirms via a webhook/QR-confirm, that
    // same call records payment against this invoice instead of creating a
    // second one (see createBookingInvoice's zoho_invoice_id check).
    await createBookingInvoice(admin, booking.id, { paymentReceived: booking.status === "confirmed" });

    const responseBody: BookingCreateResponse = { booking };
    return NextResponse.json(responseBody, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
