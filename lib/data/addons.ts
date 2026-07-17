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
  let query = supabase
    .from("addons")
    .select("id, name, description, price, category, space_id")
    .eq("is_active", true)
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
