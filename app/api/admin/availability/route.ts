import { NextRequest, NextResponse } from "next/server";
import { format } from "date-fns";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminAvailabilityForDate } from "@/lib/bookings/availability";

// Doc §4.2 GET /api/admin/availability
export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const date = request.nextUrl.searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd");
  const admin = createAdminClient();
  const resources = await getAdminAvailabilityForDate(admin, date);

  return NextResponse.json({ date, resources });
}
