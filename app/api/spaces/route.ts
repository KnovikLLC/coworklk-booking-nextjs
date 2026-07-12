import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpaces } from "@/lib/data/spaces";
import type { SpacesResponse } from "@/lib/types/domain";

// Doc: docs/cowork-booking-architecture.md §4.1 GET /api/spaces
export async function GET() {
  const supabase = createClient();
  const spaces = await getActiveSpaces(supabase);
  const body: SpacesResponse = { spaces };
  return NextResponse.json(body);
}
