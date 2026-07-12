import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncZohoItems } from "@/lib/zoho/sync-service";

// Doc §5.3 line 1219 + vercel.json cron config (line 1222-1232): runs every
// 15 minutes. Vercel sends `Authorization: Bearer $CRON_SECRET` on
// cron-triggered requests when CRON_SECRET is set — gap-fill, not in the
// doc, but without it this URL would be a public, unauthenticated trigger.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const result = await syncZohoItems(admin, "cron");

  return NextResponse.json(result);
}
