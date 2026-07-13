import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingCreateSchema } from "@/lib/validation/booking.schema";
import { BookingError, createBooking } from "@/lib/bookings/create";
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
