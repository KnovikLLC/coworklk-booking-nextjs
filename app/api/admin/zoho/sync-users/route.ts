import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncAllUserContacts } from "@/lib/zoho/sync-user-contacts";

// Manual trigger for backfilling users.zoho_contact_id — mirrors
// POST /api/admin/zoho/sync (items).
export async function POST() {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const admin = createAdminClient();
  const result = await syncAllUserContacts(admin, "manual");

  return NextResponse.json(result);
}
