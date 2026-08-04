import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type { AddonDTO } from "@/lib/types/domain";

// spaceId omitted: return every active addon (global + space-scoped) — used
// where the space isn't fixed yet (e.g. the admin batch-booking cart, which
// filters client-side as the user switches resources). spaceId provided:
// only global addons plus ones scoped to that exact space — used where the
// space is already fixed (customer checkout).
export async function getActiveAddons(
  supabase: SupabaseClient<Database>,
  spaceId?: string
): Promise<AddonDTO[]> {
  // is_evening_fee excluded: that one addon row is auto-applied server-side
  // by createBooking() whenever slot === "evening", not user-selectable —
  // it shouldn't appear in the normal add-on checkbox/stepper list.
  let query = supabase
    .from("addons")
    .select("id, name, description, price, category, space_id")
    .eq("is_active", true)
    .eq("is_evening_fee", false)
    .order("category");

  if (spaceId) {
    query = query.or(`space_id.is.null,space_id.eq.${spaceId}`);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    price: Number(a.price),
    category: a.category,
    space_id: a.space_id,
  }));
}

// The Evening Convenience Fee's amount, for client-side price-preview display
// before submit — createBooking() is the actual source of truth that
// attaches it server-side, this is purely for showing the total correctly
// on the checkout/admin-booking pages ahead of time.
export async function getEveningFeeAmount(supabase: SupabaseClient<Database>): Promise<number> {
  const { data } = await supabase.from("addons").select("price").eq("is_evening_fee", true).maybeSingle();
  return data ? Number(data.price) : 0;
}
