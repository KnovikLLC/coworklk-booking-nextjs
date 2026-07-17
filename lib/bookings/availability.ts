import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, format } from "date-fns";
import type { Database } from "@/lib/types/database.types";
import type { AvailabilityDay } from "@/lib/types/domain";

// Doc §3.3 `check_availability` only checks one (space, date, slot) combo at
// a time. The doc's /api/availability response (§4.1) is generic
// morning/afternoon/full_day/unlimited for most space types, but lobby's
// pricing (§3.2 seed) only has 1hr/2hr — there's no "half day" or
// "unlimited" lobby product, so lobby needs its own slot set.
const DEFAULT_SLOT_KEYS = ["morning", "afternoon", "full_day", "unlimited"] as const;
const LOBBY_SLOT_KEYS = ["1hr", "2hr"] as const;

export function slotKeysForSpaceType(spaceType: string): readonly string[] {
  return spaceType === "lobby" ? LOBBY_SLOT_KEYS : DEFAULT_SLOT_KEYS;
}

export async function getAvailabilityForRange(
  supabase: SupabaseClient<Database>,
  spaceId: string,
  spaceType: string,
  startDate: Date,
  days: number
): Promise<AvailabilityDay[]> {
  const slotKeys = slotKeysForSpaceType(spaceType);
  const dates = Array.from({ length: days }, (_, i) => addDays(startDate, i));

  const results = await Promise.all(
    dates.flatMap((date) =>
      slotKeys.map(async (slot) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const { data, error } = await supabase.rpc("check_availability", {
          p_space_id: spaceId,
          p_date: dateStr,
          p_slot: slot as Database["public"]["Enums"]["time_slot"],
        });
        const row = !error && data && data.length > 0 ? data[0] : null;
        return {
          dateStr,
          slot,
          available: row?.is_available ?? false,
          remaining: row ? row.total_inventory - row.booked_count : 0,
          isHoliday: row?.is_holiday ?? false,
        };
      })
    )
  );

  const byDate = new Map<string, AvailabilityDay>();
  for (const date of dates) {
    const dateStr = format(date, "yyyy-MM-dd");
    byDate.set(dateStr, { date: dateStr, slots: {}, is_holiday: false });
  }
  for (const r of results) {
    const day = byDate.get(r.dateStr)!;
    day.slots[r.slot] = { available: r.available, remaining: Math.max(0, r.remaining) };
    if (r.isHoliday) day.is_holiday = true;
  }

  return dates.map((date) => byDate.get(format(date, "yyyy-MM-dd"))!);
}

// Mirrors check_availability's overlap WHERE clause (supabase/migrations/
// ...check_availability_function.sql) so the admin grid can attach the
// actual occupying booking to a slot cell without re-deriving the RPC's
// count logic — one bookings query per space/date, matched in JS.
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

export interface AdminSlotInfo {
  available: number;
  booked: number;
  booking: { id: string; customer: string; status: string } | null;
}

export interface AdminResource {
  space_id: string;
  space_name: string;
  space_type: string;
  total_inventory: number;
  slots: Record<string, AdminSlotInfo>;
  is_holiday: boolean;
}

// Doc §4.2 GET /api/admin/availability response shape.
export async function getAdminAvailabilityForDate(
  supabase: SupabaseClient<Database>,
  date: string
): Promise<AdminResource[]> {
  const { data: spaces } = await supabase
    .from("spaces")
    .select("id, name, type, total_inventory")
    .eq("is_active", true)
    .order("type");

  if (!spaces) return [];

  return Promise.all(
    spaces.map(async (space) => {
      const slotKeys = slotKeysForSpaceType(space.type);

      const [availabilityRows, { data: bookings }] = await Promise.all([
        Promise.all(
          slotKeys.map((slot) =>
            supabase
              .rpc("check_availability", {
                p_space_id: space.id,
                p_date: date,
                p_slot: slot as Database["public"]["Enums"]["time_slot"],
              })
              .then(({ data }) => ({ slot, row: data?.[0] ?? null }))
          )
        ),
        supabase
          .from("bookings")
          .select("id, time_slot, status, guest_name, users!bookings_user_id_fkey ( full_name )")
          .eq("space_id", space.id)
          .eq("booking_date", date)
          .in("status", ["pending_payment", "confirmed", "checked_in"]),
      ]);

      const slots: Record<string, AdminSlotInfo> = {};
      let isHoliday = false;
      for (const { slot, row } of availabilityRows) {
        if (row?.is_holiday) isHoliday = true;
        const matchingBooking = (bookings ?? []).find((b) => slotOverlaps(b.time_slot, slot));
        slots[slot] = {
          available: row ? row.total_inventory - row.booked_count : space.total_inventory,
          booked: row?.booked_count ?? 0,
          booking: matchingBooking
            ? {
                id: matchingBooking.id,
                customer: matchingBooking.guest_name ?? matchingBooking.users?.full_name ?? "Customer",
                status: matchingBooking.status ?? "pending_payment",
              }
            : null,
        };
      }

      return {
        space_id: space.id,
        space_name: space.name,
        space_type: space.type,
        total_inventory: space.total_inventory,
        slots,
        is_holiday: isHoliday,
      };
    })
  );
}
