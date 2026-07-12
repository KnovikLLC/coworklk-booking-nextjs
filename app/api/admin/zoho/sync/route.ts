import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncZohoItems } from "@/lib/zoho/sync-service";

// Doc §5.3 line 1217: POST /api/admin/zoho/sync — manual sync trigger.
export async function POST() {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const admin = createAdminClient();
  const result = await syncZohoItems(admin, "manual");

  return NextResponse.json(result);
}
