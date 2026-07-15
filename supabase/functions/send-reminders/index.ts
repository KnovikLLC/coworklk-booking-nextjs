// Scheduled via Supabase Cron (supabase/migrations/20260715090400_notification_cron.sql),
// every 15 minutes. Sends the 24h and 1h booking-reminder pushes, using the
// reminder_24h_sent_at/reminder_1h_sent_at columns
// (supabase/migrations/20260715090100_booking_reminder_tracking.sql) to stay
// idempotent across runs.
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendPushToUser } from "../_shared/push.ts";

const CRON_SECRET = Deno.env.get("EDGE_CRON_SECRET");

interface BookingRow {
  id: string;
  booking_number: string;
  booking_date: string;
  start_time: string;
  user_id: string | null;
  reminder_24h_sent_at: string | null;
  reminder_1h_sent_at: string | null;
  spaces: { name: string } | null;
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get("Authorization") !== `Bearer ${CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const windowEndStr = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      "id, booking_number, booking_date, start_time, user_id, reminder_24h_sent_at, reminder_1h_sent_at, spaces ( name )"
    )
    .in("status", ["confirmed", "checked_in"])
    .gte("booking_date", todayStr)
    .lte("booking_date", windowEndStr)
    .not("user_id", "is", null)
    .returns<BookingRow[]>();

  if (error || !bookings) {
    return new Response(JSON.stringify({ error: error?.message ?? "query failed" }), { status: 500 });
  }

  let sent24h = 0;
  let sent1h = 0;

  for (const booking of bookings) {
    const startAt = new Date(`${booking.booking_date}T${booking.start_time}`);
    const hoursUntilStart = (startAt.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (!booking.reminder_24h_sent_at && hoursUntilStart > 1 && hoursUntilStart <= 24) {
      await sendPushToUser(booking.user_id!, {
        title: "Booking Reminder",
        body: `Your booking at ${booking.spaces?.name ?? "Cowork.lk"} (${booking.booking_number}) is coming up tomorrow.`,
        data: { booking_id: booking.id, type: "reminder_24h" },
      });
      await supabase.from("bookings").update({ reminder_24h_sent_at: now.toISOString() }).eq("id", booking.id);
      sent24h++;
    }

    if (!booking.reminder_1h_sent_at && hoursUntilStart > 0 && hoursUntilStart <= 1) {
      await sendPushToUser(booking.user_id!, {
        title: "Booking Starting Soon",
        body: `Your booking (${booking.booking_number}) starts in about 1 hour. See you soon!`,
        data: { booking_id: booking.id, type: "reminder_1h" },
      });
      await supabase.from("bookings").update({ reminder_1h_sent_at: now.toISOString() }).eq("id", booking.id);
      sent1h++;
    }
  }

  return new Response(JSON.stringify({ sent24h, sent1h }), { status: 200 });
});
