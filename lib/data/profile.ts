import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { checkMemberDiscount, type DiscountResult } from "@/lib/pricing/discount";

export interface ProfileDTO {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company_name: string | null;
  is_member: boolean;
  member_since: string | null;
  total_bookings: number;
  total_spent: number;
}

export interface ProfileWithLoyalty {
  profile: ProfileDTO;
  loyalty: DiscountResult;
}

// Backs GET /api/profile — used by the web /profile page's data needs and
// the Flutter app's home dashboard (loyalty card, discount countdown).
// baseAmount is 0 since this isn't priced against a specific booking; only
// discount_amount depends on it, and every other DiscountResult field
// (eligible, discount_percent, reason, last_booking_date, days_since_last)
// is unaffected.
export async function getProfileWithLoyalty(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<ProfileWithLoyalty | null> {
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, full_name, phone, company_name, is_member, member_since, total_bookings, total_spent"
    )
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  const loyalty = await checkMemberDiscount(supabase, userId, null, 0);

  return {
    profile: {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
      phone: data.phone,
      company_name: data.company_name,
      is_member: data.is_member ?? false,
      member_since: data.member_since,
      total_bookings: data.total_bookings ?? 0,
      total_spent: Number(data.total_spent ?? 0),
    },
    loyalty,
  };
}
