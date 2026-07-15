// Invoked by a Supabase Database Webhook on `bookings` UPDATE (configured in
// supabase/migrations/20260715090300_notification_triggers.sql). Fires
// identically no matter which code path changed the status — Stripe
// webhook, admin QR-confirm, or a staff admin-panel edit — so Next.js never
// needs to remember to call a notification helper.
import { sendPushToUser } from "../_shared/push.ts";

interface BookingRow {
  id: string;
  booking_number: string;
  user_id: string | null;
  status: string | null;
  refund_amount: number | string | null;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: BookingRow;
  old_record: BookingRow | null;
}

Deno.serve(async (req) => {
  const payload = (await req.json().catch(() => null)) as WebhookPayload | null;

  if (!payload || payload.type !== "UPDATE" || payload.table !== "bookings") {
    return new Response("ignored", { status: 200 });
  }

  const { record, old_record } = payload;
  if (!record.user_id || record.status === old_record?.status) {
    return new Response("ignored", { status: 200 });
  }

  if (record.status === "confirmed") {
    await sendPushToUser(record.user_id, {
      title: "Booking Confirmed",
      body: `Your booking ${record.booking_number} is confirmed!`,
      data: { booking_id: record.id, type: "booking_confirmed" },
    });
  } else if (record.status === "cancelled") {
    const refund = record.refund_amount ? ` Refund: LKR ${record.refund_amount}.` : "";
    await sendPushToUser(record.user_id, {
      title: "Booking Cancelled",
      body: `Your booking ${record.booking_number} has been cancelled.${refund}`,
      data: { booking_id: record.id, type: "booking_cancelled" },
    });
  }

  return new Response("ok", { status: 200 });
});
