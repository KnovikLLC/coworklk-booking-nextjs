import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpaceById } from "@/lib/data/spaces";
import type { SpaceResponse } from "@/lib/types/domain";

// Space detail (photos/amenities/pricing) — added for the Flutter app's
// space detail screen; reuses getActiveSpaceById, which already existed
// but had no route calling it.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const space = await getActiveSpaceById(supabase, params.id);

  if (!space) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  const body: SpaceResponse = { space };
  return NextResponse.json(body);
}
