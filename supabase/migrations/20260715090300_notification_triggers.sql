-- Cowork.lk Flutter mobile app backend enhancement plan §4.
-- Wires the `on-booking-status-change` Edge Function
-- (supabase/functions/on-booking-status-change/index.ts) to fire on every
-- `bookings` UPDATE via pg_net, instead of a Dashboard-configured Database
-- Webhook, so this trigger is version-controlled like everything else here.
--
-- ONE-TIME MANUAL SETUP (per environment, not run by this migration —
-- these are project credentials and must never be committed):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service_role_key>', 'service_role_key');
-- Run once against each Supabase project (local + staging + prod) via the
-- SQL editor / `supabase db` connection before this trigger will succeed.
-- pg_net calls made before the secrets exist will simply fail silently
-- (logged in `net._http_response`), never blocking the booking write itself.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION notify_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_url TEXT;
  service_role_key TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT decrypted_secret INTO project_url FROM vault.decrypted_secrets WHERE name = 'project_url';
    SELECT decrypted_secret INTO service_role_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';

    IF project_url IS NOT NULL AND service_role_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := project_url || '/functions/v1/on-booking-status-change',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object(
          'type', 'UPDATE',
          'table', 'bookings',
          'record', to_jsonb(NEW),
          'old_record', to_jsonb(OLD)
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_status_change();
