import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type { AddonDTO } from "@/lib/types/domain";

export async function getActiveAddons(
  supabase: SupabaseClient<Database>
): Promise<AddonDTO[]> {
  const { data, error } = await supabase
    .from("addons")
    .select("id, name, description, price, category")
    .eq("is_active", true)
    .order("category");

  if (error || !data) return [];

  return data.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    price: Number(a.price),
    category: a.category,
  }));
}
