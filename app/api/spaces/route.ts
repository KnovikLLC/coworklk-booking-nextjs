import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SpaceDTO, SpacesResponse } from "@/lib/types/domain";

// Doc: docs/cowork-booking-architecture.md §4.1 GET /api/spaces
export async function GET() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("spaces")
    .select(
      `id, name, type, capacity, description, image_url, amenities, requires_specific_seat, total_inventory,
       pricing:pricing!pricing_space_id_fkey ( id, duration, slot_type, price, description, includes_data_gb, is_active )`
    )
    .eq("is_active", true)
    .order("type");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const spaces: SpaceDTO[] = (data ?? []).map((space) => ({
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

  const body: SpacesResponse = { spaces };
  return NextResponse.json(body);
}
