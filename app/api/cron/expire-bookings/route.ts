import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Flips bookings that are pending payment and older than 30 minutes to expired.
// Replicates the vercel.json cron auth pattern.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const cutoffTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  // Find bookings pending payment created more than 30 minutes ago
  const { data: expiredBookings, error } = await admin
    .from("bookings")
    .update({ status: "expired" })
    .eq("status", "pending_payment")
    .lt("created_at", cutoffTime)
    .select("id, booking_number, created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    expired_count: expiredBookings?.length ?? 0,
    expired_bookings: (expiredBookings ?? []).map((b) => ({
      id: b.id,
      booking_number: b.booking_number,
      created_at: b.created_at,
    })),
  });
}
