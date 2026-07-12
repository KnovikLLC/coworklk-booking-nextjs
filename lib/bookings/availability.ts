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
        };
      })
    )
  );

  const byDate = new Map<string, AvailabilityDay>();
  for (const date of dates) {
    const dateStr = format(date, "yyyy-MM-dd");
    byDate.set(dateStr, { date: dateStr, slots: {} });
  }
  for (const r of results) {
    const day = byDate.get(r.dateStr)!;
    day.slots[r.slot] = { available: r.available, remaining: Math.max(0, r.remaining) };
  }

  return dates.map((date) => byDate.get(format(date, "yyyy-MM-dd"))!);
}
