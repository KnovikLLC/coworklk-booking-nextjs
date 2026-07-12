-- Doc: docs/cowork-booking-architecture.md §3.3 `check_availability` (lines 610-655)

CREATE OR REPLACE FUNCTION check_availability(
  p_space_id UUID,
  p_date DATE,
  p_slot time_slot
)
RETURNS TABLE (
  is_available BOOLEAN,
  booked_count INT,
  total_inventory INT
) AS $$
DECLARE
  v_total_inventory INT;
  v_booked_count INT;
  v_requires_specific_seat BOOLEAN;
BEGIN
  -- Get space details
  SELECT s.total_inventory, s.requires_specific_seat
  INTO v_total_inventory, v_requires_specific_seat
  FROM spaces s WHERE s.id = p_space_id;

  -- Count confirmed bookings for this slot
  -- Account for slot overlaps (unlimited covers morning+afternoon+evening)
  SELECT COUNT(*)
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
    v_total_inventory AS total_inventory;
END;
$$ LANGUAGE plpgsql;
