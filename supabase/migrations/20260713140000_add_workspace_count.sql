-- Add workspace_count to bookings table
ALTER TABLE bookings ADD COLUMN workspace_count INT NOT NULL DEFAULT 1;

-- Update check_availability function to sum workspace_count instead of counting rows
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

  -- Count confirmed bookings for this slot (sum workspace_count instead of COUNT(*))
  -- Account for slot overlaps (unlimited covers morning+afternoon+evening)
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
    v_total_inventory AS total_inventory;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
