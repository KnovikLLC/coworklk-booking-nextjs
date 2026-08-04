-- New duration options: "evening" (already a valid time_slot value, just
-- never sold before) for 5 spaces, and "4hr"/"8hr" block rates for Lobby
-- Area (its existing "unlimited" full-day rate is reused for the "8+" rate
-- rather than inventing a new duration).
--
-- Run as plain sequential (autocommit) statements, not a single transaction
-- — ALTER TYPE ... ADD VALUE must commit before later statements in this
-- file can reference the new enum values.

ALTER TYPE time_slot ADD VALUE IF NOT EXISTS '4hr';
ALTER TYPE time_slot ADD VALUE IF NOT EXISTS '8hr';

-- Widen pricing.duration's CHECK constraint to allow the new durations.
ALTER TABLE pricing DROP CONSTRAINT pricing_duration_check;
ALTER TABLE pricing ADD CONSTRAINT pricing_duration_check
  CHECK (duration IN ('half_day', 'full_day', 'unlimited', '1hr', '2hr', '30min', 'evening', '4hr', '8hr'));

-- Extend the unlimited-vs-hourly overlap logic to also cover Lobby's new
-- block durations (4hr/8hr) and its existing hourly ones (1hr/2hr), now
-- that Lobby is getting a real full-day "unlimited" option for the first
-- time — without this, an unlimited Lobby booking and an hourly Lobby
-- booking wouldn't correctly block each other.
CREATE OR REPLACE FUNCTION public.check_availability(p_space_id uuid, p_date date, p_slot time_slot)
 RETURNS TABLE(is_available boolean, booked_count integer, total_inventory integer, is_holiday boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_inventory INT;
  v_booked_count INT;
  v_requires_specific_seat BOOLEAN;
  v_is_holiday BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM holidays h WHERE h.date = p_date) INTO v_is_holiday;

  SELECT s.total_inventory, s.requires_specific_seat
  INTO v_total_inventory, v_requires_specific_seat
  FROM spaces s WHERE s.id = p_space_id;

  IF v_is_holiday THEN
    RETURN QUERY SELECT FALSE, v_total_inventory, v_total_inventory, TRUE;
    RETURN;
  END IF;

  SELECT COALESCE(SUM(b.workspace_count), 0)
  INTO v_booked_count
  FROM bookings b
  WHERE b.space_id = p_space_id
    AND b.booking_date = p_date
    AND b.status IN ('pending_payment', 'confirmed', 'checked_in')
    AND (
      b.time_slot = p_slot
      OR (p_slot IN ('morning', 'afternoon') AND b.time_slot IN ('full_day', 'unlimited'))
      OR (p_slot = 'full_day' AND b.time_slot IN ('morning', 'afternoon', 'unlimited'))
      OR (p_slot = 'unlimited' AND b.time_slot IN ('morning', 'afternoon', 'evening', 'full_day', '1hr', '2hr', '4hr', '8hr'))
      OR (p_slot IN ('1hr', '2hr', '4hr', '8hr') AND b.time_slot = 'unlimited')
    );

  RETURN QUERY SELECT
    (v_booked_count < v_total_inventory) AS is_available,
    v_booked_count AS booked_count,
    v_total_inventory AS total_inventory,
    FALSE AS is_holiday;
END;
$function$;
