import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type { SpaceDTO } from "@/lib/types/domain";

const SPACES_SELECT = `id, name, type, capacity, description, image_url, amenities, requires_specific_seat, total_inventory,
  pricing:pricing!pricing_space_id_fkey ( id, duration, slot_type, price, description, includes_data_gb, is_active )`;

export async function getActiveSpaces(
  supabase: SupabaseClient<Database>
): Promise<SpaceDTO[]> {
  const { data, error } = await supabase
    .from("spaces")
    .select(SPACES_SELECT)
    .eq("is_active", true)
    .order("type");

  if (error || !data) return [];

  return data.map((space) => ({
    id: space.id,
    name: space.name,
    type: space.type,
    capacity: space.capacity,
    description: space.description,
    image_url: space.image_url,
    amenities: Array.isArray(space.amenities) ? (space.amenities as string[]) : [],
    requires_specific_seat: space.requires_specific_seat ?? false,
    total_inventory: space.total_inventory,
    pricing: (space.pricing ?? [])
      .filter((p) => p.is_active)
      .map((p) => ({
        id: p.id,
        duration: p.duration,
        slot_type: p.slot_type ?? "any",
        price: Number(p.price),
        description: p.description,
        includes_data_gb: p.includes_data_gb ?? 0,
      })),
  }));
}

export async function getActiveSpaceById(
  supabase: SupabaseClient<Database>,
  spaceId: string
): Promise<SpaceDTO | null> {
  const { data, error } = await supabase
    .from("spaces")
    .select(SPACES_SELECT)
    .eq("is_active", true)
    .eq("id", spaceId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    type: data.type,
    capacity: data.capacity,
    description: data.description,
    image_url: data.image_url,
    amenities: Array.isArray(data.amenities) ? (data.amenities as string[]) : [],
    requires_specific_seat: data.requires_specific_seat ?? false,
    total_inventory: data.total_inventory,
    pricing: (data.pricing ?? [])
      .filter((p) => p.is_active)
      .map((p) => ({
        id: p.id,
        duration: p.duration,
        slot_type: p.slot_type ?? "any",
        price: Number(p.price),
        description: p.description,
        includes_data_gb: p.includes_data_gb ?? 0,
      })),
  };
}
