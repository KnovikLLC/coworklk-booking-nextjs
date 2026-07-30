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

// Corporate discount: any booking made with a @knovik.com or @knovik.eu
// email gets 25% off, regardless of payment method — takes priority over
// the loyalty discount below (25% beats 10%, and the two aren't meant to
// stack). Hardcoded to exactly these two domains rather than driven by
// preconfigured_domains, since that table may later hold other companies'
// domains for the unrelated domain-verification payment flow and shouldn't
// silently start granting this discount to them too.
const CORPORATE_DISCOUNT_DOMAINS = ["knovik.com", "knovik.eu"];
const CORPORATE_DISCOUNT_PERCENT = 25;

function emailDomain(email: string): string {
  return email.toLowerCase().split("@")[1] ?? "";
}

// Doc §8.4 lines 1714-1791, adapted to accept a SupabaseClient rather than
// constructing one internally (so callers can pass the admin client from a
// route handler).
export async function checkMemberDiscount(
  supabase: SupabaseClient<Database>,
  userId: string | null,
  guestEmail: string | null,
  baseAmount: number
): Promise<DiscountResult> {
  // Resolve the email to check for the corporate discount: guestEmail if
  // this is a guest booking, otherwise the logged-in user's own email —
  // fetched together with role below in one query rather than two.
  let profile: { role: string | null; email: string } | null = null;
  if (userId) {
    const { data } = await supabase.from("users").select("role, email").eq("id", userId).single();
    profile = data;
  }
  const emailToCheck = guestEmail ?? profile?.email ?? null;

  if (emailToCheck && CORPORATE_DISCOUNT_DOMAINS.includes(emailDomain(emailToCheck))) {
    return {
      eligible: true,
      discount_percent: CORPORATE_DISCOUNT_PERCENT,
      discount_amount: Math.round(baseAmount * (CORPORATE_DISCOUNT_PERCENT / 100)),
      reason: "Corporate discount (knovik.com/knovik.eu)",
      last_booking_date: null,
      days_since_last: null,
    };
  }

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

  // Staff accounts (admin/frontdesk) aren't customers — no loyalty discount.
  if (profile && ["admin", "frontdesk"].includes(profile.role ?? "")) {
    return {
      eligible: false,
      discount_percent: 0,
      discount_amount: 0,
      reason: "Staff accounts are not eligible for member discounts",
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
