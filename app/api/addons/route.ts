import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveAddons } from "@/lib/data/addons";
import type { AddonDTO } from "@/lib/types/domain";

// Public, mirrors GET /api/spaces. addons has an "Anyone can view active
// addons" RLS policy, so the regular (non-admin) client is enough.
// Added for the booking form (web admin's + Cowork Admin Assist's) which
// needs add-on data; getActiveAddons() already existed but had no route.
export async function GET() {
  const supabase = createClient();
  const addons = await getActiveAddons(supabase);
  const body: { addons: AddonDTO[] } = { addons };
  return NextResponse.json(body);
}
