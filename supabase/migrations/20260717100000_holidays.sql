-- Admin-managed whole-venue holidays that block booking site-wide.
CREATE TABLE public.holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;

-- Staff-only: check_availability (the only public-facing consumer) is
-- SECURITY DEFINER and bypasses RLS, so no public SELECT policy is needed.
CREATE POLICY "Allow full access for staff" ON public.holidays FOR ALL USING (is_staff());

-- Adds a 4th `is_holiday` output column so callers can distinguish "closed
-- for a holiday" from "fully booked" instead of both just reading as
-- is_available = false. Return row type changed, so the old signature must
-- be dropped first (CREATE OR REPLACE can't alter OUT-parameter shape).
DROP FUNCTION IF EXISTS check_availability(UUID, DATE, time_slot);

CREATE OR REPLACE FUNCTION check_availability(
  p_space_id UUID,
  p_date DATE,
  p_slot time_slot
)
RETURNS TABLE (
  is_available BOOLEAN,
  booked_count INT,
  total_inventory INT,
  is_holiday BOOLEAN
) AS $$
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
      OR (p_slot = 'unlimited' AND b.time_slot IN ('morning', 'afternoon', 'evening', 'full_day'))
    );

  RETURN QUERY SELECT
    (v_booked_count < v_total_inventory) AS is_available,
    v_booked_count AS booked_count,
    v_total_inventory AS total_inventory,
    FALSE AS is_holiday;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
