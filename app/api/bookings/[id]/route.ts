import { NextRequest, NextResponse } from "next/server";
import { getOptionalRequestUser } from "@/lib/auth/get-request-user";
import { getAuthorizedBookingSummary } from "@/lib/data/bookings";

// Doc: docs/cowork-booking-architecture.md §4.1 GET /api/bookings/:id
// Dual-mode auth (cookie session or Bearer token) via getOptionalRequestUser
// — guest bookings stay readable by anyone holding the booking UUID.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase } = await getOptionalRequestUser(request);

  const result = await getAuthorizedBookingSummary(params.id, user, supabase);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ booking: result.summary });
}
