-- Cowork.lk Flutter mobile app backend enhancement plan §4 / §8 (Phase 1.5).
-- Schedules the send-reminders and loyalty-reminders Edge Functions via
-- Supabase Cron (pg_cron + pg_net) instead of adding a third GitHub Actions
-- workflow step — keeps all mobile-notification scheduling inside the same
-- Supabase Cloud project already used for Postgres/Auth.
--
-- Requires the same one-time Vault setup as
-- supabase/migrations/20260715090300_notification_triggers.sql
-- (`project_url`, `service_role_key` secrets), plus, optionally, an
-- `edge_cron_secret` Vault secret matching the EDGE_CRON_SECRET function
-- secret (`supabase secrets set EDGE_CRON_SECRET=...`) if the functions'
-- own bearer check is enabled.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'send-booking-reminders',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    )
  )
  WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url');
  $$
);

SELECT cron.schedule(
  'send-loyalty-reminders',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url') || '/functions/v1/loyalty-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    )
  )
  WHERE EXISTS (SELECT 1 FROM vault.decrypted_secrets WHERE name = 'project_url');
  $$
);
