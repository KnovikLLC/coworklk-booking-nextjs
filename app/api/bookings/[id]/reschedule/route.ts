import { NextRequest, NextResponse } from "next/server";
import { getOptionalRequestUser } from "@/lib/auth/get-request-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { bookingRescheduleSchema } from "@/lib/validation/booking.schema";
import { rescheduleBooking } from "@/lib/bookings/reschedule";
import { BookingError } from "@/lib/bookings/create";

// PATCH /api/bookings/:id/reschedule — Flutter app's "Booking Modification"
// (P1) feature. Dual-mode auth, same ownership rule as
// app/api/bookings/[id]/cancel/route.ts: member bookings require the
// owning session or staff; guest bookings (user_id null) are reachable by
// anyone holding the booking UUID, matching this codebase's existing
// "the ID is the access token" guest-checkout model (see
// lib/data/bookings.ts::getAuthorizedBookingSummary).
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const json = await request.json().catch(() => null);
  const parsed = bookingRescheduleSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { user, supabase } = await getOptionalRequestUser(request);
  const admin = createAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("bookings")
    .select("id, user_id")
    .eq("id", params.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (existing.user_id) {
    let isStaff = false;
    if (user) {
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
      isStaff = !!profile && ["admin", "frontdesk"].includes(profile.role ?? "");
    }

    if (!user || (user.id !== existing.user_id && !isStaff)) {
      return NextResponse.json({ error: "Not authorized to reschedule this booking" }, { status: 403 });
    }
  }

  try {
    const booking = await rescheduleBooking(admin, {
      bookingId: params.id,
      date: parsed.data.date,
      slot: parsed.data.slot,
    });
    return NextResponse.json({ booking });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
