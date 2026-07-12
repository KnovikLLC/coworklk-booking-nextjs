-- Doc: docs/cowork-booking-architecture.md §3.2 `users` (lines 264-334)
--
-- Deviation from doc: the doc's "Admins can view all users" policy does a
-- self-referencing subquery on `users` inside a `users` policy, which
-- triggers Postgres's "infinite recursion detected in policy" error. Fixed
-- here with a SECURITY DEFINER helper (is_staff()) that bypasses RLS for
-- the internal role lookup, per Supabase's documented pattern for this.

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  full_name VARCHAR(200),
  company_name VARCHAR(200),
  zoho_contact_id VARCHAR(50),
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'frontdesk')),

  -- Membership & Loyalty
  is_member BOOLEAN DEFAULT FALSE,
  member_since TIMESTAMPTZ,
  last_booking_date DATE,
  total_bookings INT DEFAULT 0,
  total_spent DECIMAL(12,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'frontdesk')
  );
$$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_staff());

CREATE POLICY "Admins can update all users" ON users
  FOR UPDATE USING (is_staff());

-- Function to check if user qualifies for member discount (booked within last 30 days)
CREATE OR REPLACE FUNCTION check_member_discount(p_user_id UUID)
RETURNS TABLE (
  eligible BOOLEAN,
  discount_percent INT,
  last_booking DATE,
  days_since_last_booking INT
) AS $$
DECLARE
  v_last_booking DATE;
  v_days_since INT;
BEGIN
  -- Get last completed booking date for this user
  SELECT MAX(booking_date) INTO v_last_booking
  FROM bookings
  WHERE user_id = p_user_id
    AND status IN ('completed', 'confirmed', 'checked_in');

  IF v_last_booking IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, NULL::DATE, NULL::INT;
    RETURN;
  END IF;

  v_days_since := CURRENT_DATE - v_last_booking;

  -- Eligible for 10% discount if last booking was within 30 days
  IF v_days_since <= 30 THEN
    RETURN QUERY SELECT TRUE, 10, v_last_booking, v_days_since;
  ELSE
    RETURN QUERY SELECT FALSE, 0, v_last_booking, v_days_since;
  END IF;
END;
$$ LANGUAGE plpgsql;
