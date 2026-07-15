-- Cowork.lk Flutter mobile app backend enhancement plan §3 / §4.
-- Tracks the last time a "loyalty discount expiring soon" push was sent for
-- a member, so the loyalty-reminders Supabase Edge Function (daily Supabase
-- Cron) doesn't re-notify every run — see lib/pricing/discount.ts's 30-day
-- cutoff for the discount this reminder is about.
ALTER TABLE users ADD COLUMN loyalty_reminder_sent_at TIMESTAMPTZ;
