import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizedBookingSummary } from "@/lib/data/bookings";

// Doc: docs/cowork-booking-architecture.md §4.1 GET /api/bookings/:id
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await getAuthorizedBookingSummary(params.id, user, supabase);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ booking: result.summary });
}
