import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { eachDayOfInterval, format, parseISO } from "date-fns";
import { slotKeysForSpaceType } from "@/lib/bookings/availability";

function slotOverlaps(bookingSlot: string, cellSlot: string): boolean {
  if (bookingSlot === cellSlot) return true;
  if ((cellSlot === "morning" || cellSlot === "afternoon") && (bookingSlot === "full_day" || bookingSlot === "unlimited"))
    return true;
  if (cellSlot === "full_day" && (bookingSlot === "morning" || bookingSlot === "afternoon" || bookingSlot === "unlimited"))
    return true;
  if (
    cellSlot === "unlimited" &&
    (bookingSlot === "morning" || bookingSlot === "afternoon" || bookingSlot === "evening" || bookingSlot === "full_day")
  )
    return true;
  return false;
}

// Doc §4.2 GET /api/admin/calendar — calendar view data for week/month.
export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const params = request.nextUrl.searchParams;
  const startDateStr = params.get("start_date");
  const endDateStr = params.get("end_date");
  const spaceIdFilter = params.get("space_id");

  if (!startDateStr || !endDateStr) {
    return NextResponse.json({ error: "start_date and end_date are required" }, { status: 400 });
  }

  let startDate: Date;
  let endDate: Date;
  try {
    startDate = parseISO(startDateStr);
    endDate = parseISO(endDateStr);
  } catch {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch all spaces to check their inventories and requirements
  const { data: spaces, error: spacesError } = await admin
    .from("spaces")
    .select("id, name, type, total_inventory, requires_specific_seat")
    .eq("is_active", true);

  if (spacesError || !spaces) {
    return NextResponse.json({ error: spacesError?.message || "Failed to fetch spaces" }, { status: 500 });
  }

  // Query bookings in the range
  let bookingsQuery = admin
    .from("bookings")
    .select("id, booking_number, space_id, booking_date, time_slot, start_time, end_time, guest_name, guest_email, status, total_amount, workspace_count, spaces ( name, type ), users!bookings_user_id_fkey ( full_name, email )")
    .gte("booking_date", startDateStr)
    .lte("booking_date", endDateStr);

  if (spaceIdFilter) {
    bookingsQuery = bookingsQuery.eq("space_id", spaceIdFilter);
  }

  const { data: rawBookings, error: bookingsError } = await bookingsQuery;

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  // Format bookings list to match response spec
  const bookings = (rawBookings ?? []).map((b) => ({
    id: b.id,
    booking_number: b.booking_number,
    space_id: b.space_id,
    space_name: b.spaces?.name ?? "Space",
    space_type: b.spaces?.type ?? "unknown",
    date: b.booking_date,
    slot: b.time_slot,
    start_time: b.start_time ? b.start_time.substring(0, 5) : null,
    end_time: b.end_time ? b.end_time.substring(0, 5) : null,
    customer_name: b.guest_name ?? b.users?.full_name ?? "Customer",
    customer_email: b.guest_email ?? b.users?.email ?? null,
    status: b.status,
    total_amount: Number(b.total_amount),
  }));

  // Build availability summary
  const availabilitySummary: Record<string, Record<string, { used: number; total: number } | { booked: boolean }>> = {};

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  for (const day of days) {
    const dateStr = format(day, "yyyy-MM-dd");
    availabilitySummary[dateStr] = {};

    // Filter active bookings for this day
    const dayBookings = (rawBookings ?? []).filter(
      (b) =>
        b.booking_date === dateStr &&
        ["pending_payment", "confirmed", "checked_in"].includes(b.status ?? "")
    );

    // Calculate availability per space type
    const spaceTypes = Array.from(new Set(spaces.map((s) => s.type)));
    for (const spaceType of spaceTypes) {
      const typeSpaces = spaces.filter((s) => s.type === spaceType);
      const isSingleInventory = typeSpaces.some((s) => s.requires_specific_seat);

      // Bookings for this space type on this day
      const typeBookings = dayBookings.filter((b) =>
        typeSpaces.some((s) => s.id === b.space_id)
      );

      if (isSingleInventory) {
        availabilitySummary[dateStr][spaceType] = {
          booked: typeBookings.length > 0,
        };
      } else {
        const total = typeSpaces.reduce((sum, s) => sum + s.total_inventory, 0);

        // Find max simultaneous seats used in any slot. Sums workspace_count
        // rather than counting rows — a single booking can cover multiple
        // seats/desks (e.g. a full-office buyout), and .length undercounts
        // that exactly like check_availability's booked_count would if it
        // didn't SUM() too (see check_availability_function.sql).
        const slots = slotKeysForSpaceType(spaceType);
        let maxUsed = 0;
        for (const slot of slots) {
          const usedInSlot = typeBookings
            .filter((b) => slotOverlaps(b.time_slot, slot))
            .reduce((sum, b) => sum + (b.workspace_count ?? 1), 0);
          if (usedInSlot > maxUsed) {
            maxUsed = usedInSlot;
          }
        }

        availabilitySummary[dateStr][spaceType] = {
          used: maxUsed,
          total,
        };
      }
    }
  }

  return NextResponse.json({
    start_date: startDateStr,
    end_date: endDateStr,
    bookings,
    spaces: spaces.map((s) => ({
      id: s.id,
      name: s.name,
      type: s.type,
      total_inventory: s.total_inventory,
      requires_specific_seat: s.requires_specific_seat,
    })),
    availability_summary: availabilitySummary,
  });
}
