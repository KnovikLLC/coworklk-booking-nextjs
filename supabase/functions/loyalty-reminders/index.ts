// Scheduled via Supabase Cron (supabase/migrations/20260715090400_notification_cron.sql),
// daily. Reminds members 5 days before lib/pricing/discount.ts::checkMemberDiscount's
// 30-day loyalty-discount cutoff, using loyalty_reminder_sent_at
// (supabase/migrations/20260715090200_loyalty_reminder_tracking.sql) to avoid
// re-notifying every run.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendPushToUser } from "../_shared/push.ts";

const CRON_SECRET = Deno.env.get("EDGE_CRON_SECRET");
const REMINDER_WINDOW_START_DAYS = 25;
const DISCOUNT_CUTOFF_DAYS = 30;

interface UserRow {
  id: string;
  last_booking_date: string | null;
  loyalty_reminder_sent_at: string | null;
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get("Authorization") !== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: users, error } = await supabase
    .from("users")
    .select("id, last_booking_date, loyalty_reminder_sent_at")
    .eq("is_member", true)
    .not("last_booking_date", "is", null)
    .returns<UserRow[]>();

  if (error || !users) {
    return new Response(JSON.stringify({ error: error?.message ?? "query failed" }), { status: 500 });
  }

  const now = new Date();
  let sent = 0;

  for (const user of users) {
    const lastBooking = new Date(`${user.last_booking_date}T00:00:00`);
    const daysSince = Math.floor((now.getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24));
    const alreadyReminded =
      user.loyalty_reminder_sent_at && new Date(user.loyalty_reminder_sent_at) > lastBooking;

    if (daysSince >= REMINDER_WINDOW_START_DAYS && daysSince < DISCOUNT_CUTOFF_DAYS && !alreadyReminded) {
      const daysLeft = DISCOUNT_CUTOFF_DAYS - daysSince;
      await sendPushToUser(user.id, {
        title: "Keep Your Member Discount",
        body: `Book within ${daysLeft} day${daysLeft === 1 ? "" : "s"} to keep your 10% loyalty discount.`,
        data: { type: "loyalty_expiring" },
      });
      await supabase.from("users").update({ loyalty_reminder_sent_at: now.toISOString() }).eq("id", user.id);
      sent++;
    }
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
