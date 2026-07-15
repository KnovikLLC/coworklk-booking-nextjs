-- Cowork.lk Flutter mobile app backend enhancement plan §3 / §4.
-- Tracks whether the 24h/1h push reminder has already been sent for a
-- booking, so the send-reminders Supabase Edge Function (invoked on a
-- schedule via Supabase Cron) can skip bookings it already notified.
ALTER TABLE bookings
  ADD COLUMN reminder_24h_sent_at TIMESTAMPTZ,
  ADD COLUMN reminder_1h_sent_at TIMESTAMPTZ;
