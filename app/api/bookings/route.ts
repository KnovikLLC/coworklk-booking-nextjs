import { NextRequest, NextResponse } from "next/server";
import { getOptionalRequestUser, getRequestUser } from "@/lib/auth/get-request-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingCreateSchema } from "@/lib/validation/booking.schema";
import { BookingError, createBooking } from "@/lib/bookings/create";
import { getUserBookingsPaginated, type BookingListGroup } from "@/lib/data/bookings";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import type { BookingCreateResponse } from "@/lib/types/domain";

// GET /api/bookings — added for the Flutter app's My Bookings screen
// (upcoming/past/cancelled tabs, paginated). Auth required, dual-mode.
// Query params: group=upcoming|past|cancelled, page, limit
export async function GET(request: NextRequest) {
  const auth = await getRequestUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = request.nextUrl.searchParams;
  const groupParam = params.get("group");
  const group: BookingListGroup | undefined =
    groupParam === "upcoming" || groupParam === "past" || groupParam === "cancelled"
      ? groupParam
      : undefined;

  const result = await getUserBookingsPaginated(auth.supabase, auth.user.id, {
    group,
    page: Number(params.get("page") ?? "1"),
    limit: Number(params.get("limit") ?? "20"),
  });

  return NextResponse.json(result);
}

// Doc: docs/cowork-booking-architecture.md §4.1 POST /api/bookings
// Uses the admin (service-role) client for the write: guest bookings have
// no session for RLS, and guest_profiles is service-role-only by design
// (see supabase/migrations/20260712173531_guest_profiles.sql).
// Auth is optional here and dual-mode (cookie session for web, Authorization:
// Bearer <supabase-jwt> for the Flutter app) via getOptionalRequestUser.
export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = bookingCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const { user } = await getOptionalRequestUser(request);

  if (!user && (!body.guest_name || !body.guest_email || !body.guest_phone)) {
    return NextResponse.json(
      { error: "guest_name, guest_email, and guest_phone are required for guest checkout" },
      { status: 400 }
    );
  }

  // 10 booking attempts/minute per caller — generous for a real customer,
  // enough to blunt scripted abuse. Keyed by user id when logged in
  // (shared devices/NAT shouldn't punish each other); IP otherwise.
  const rateLimitKey = `booking-create:${user?.id ?? getClientIp(request)}`;
  const allowed = await checkRateLimit({ key: rateLimitKey, windowSeconds: 60, maxHits: 10 });
  if (!allowed) {
    return NextResponse.json({ error: "Too many booking attempts. Please try again shortly." }, { status: 429 });
  }

  const admin = createAdminClient();

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
      guestEmail: user ? undefined : body.guest_email,
      guestPhone: user ? undefined : body.guest_phone,
      workspaceCount: body.workspace_count,
    });

    const responseBody: BookingCreateResponse = { booking };
    return NextResponse.json(responseBody, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
