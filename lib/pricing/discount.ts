import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

export interface DiscountResult {
  eligible: boolean;
  discount_percent: number;
  discount_amount: number;
  reason: string | null;
  last_booking_date: string | null;
  days_since_last: number | null;
}

// Doc §8.4 lines 1714-1791, adapted to accept a SupabaseClient rather than
// constructing one internally (so callers can pass the admin client from a
// route handler). guestEmail is accepted to match the doc's signature but
// unused — guest bookings never get a discount (§8.3), so there's nothing
// to look up for them.
export async function checkMemberDiscount(
  supabase: SupabaseClient<Database>,
  userId: string | null,
  _guestEmail: string | null,
  baseAmount: number
): Promise<DiscountResult> {
  if (!userId) {
    return {
      eligible: false,
      discount_percent: 0,
      discount_amount: 0,
      reason: null,
      last_booking_date: null,
      days_since_last: null,
    };
  }

  const { data: lastBooking } = await supabase
    .from("bookings")
    .select("booking_date")
    .eq("user_id", userId)
    .in("status", ["completed", "confirmed", "checked_in"])
    .order("booking_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastBooking) {
    return {
      eligible: false,
      discount_percent: 0,
      discount_amount: 0,
      reason: "First booking - no loyalty discount yet",
      last_booking_date: null,
      days_since_last: null,
    };
  }

  const lastDate = new Date(`${lastBooking.booking_date}T00:00:00`);
  const today = new Date();
  const daysSince = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSince <= 30) {
    const discountAmount = Math.round(baseAmount * 0.1);
    return {
      eligible: true,
      discount_percent: 10,
      discount_amount: discountAmount,
      reason: `Member loyalty discount (booked ${daysSince} days ago)`,
      last_booking_date: lastBooking.booking_date,
      days_since_last: daysSince,
    };
  }

  return {
    eligible: false,
    discount_percent: 0,
    discount_amount: 0,
    reason: `Last booking was ${daysSince} days ago (over 30 day limit)`,
    last_booking_date: lastBooking.booking_date,
    days_since_last: daysSince,
  };
}
