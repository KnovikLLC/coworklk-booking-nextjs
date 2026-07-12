import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAvailabilityForRange } from "@/lib/bookings/availability";
import type { AvailabilityResponse } from "@/lib/types/domain";

const DEFAULT_RANGE_DAYS = 14;

// Doc: docs/cowork-booking-architecture.md §4.1 GET /api/availability
// Query params: space_id (required), date (single day) or start_date (range
// start, defaults to today). Range length defaults to 14 days.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const spaceId = params.get("space_id");
  const dateParam = params.get("date");
  const startDateParam = params.get("start_date");

  if (!spaceId) {
    return NextResponse.json({ error: "space_id is required" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: space, error: spaceError } = await supabase
    .from("spaces")
    .select("id, type")
    .eq("id", spaceId)
    .eq("is_active", true)
    .single();

  if (spaceError || !space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const startDate = dateParam
    ? new Date(`${dateParam}T00:00:00`)
    : startDateParam
      ? new Date(`${startDateParam}T00:00:00`)
      : new Date();
  const days = dateParam ? 1 : DEFAULT_RANGE_DAYS;

  const availability = await getAvailabilityForRange(
    supabase,
    space.id,
    space.type,
    startDate,
    days
  );

  const body: AvailabilityResponse = { space_id: space.id, availability };
  return NextResponse.json(body);
}
