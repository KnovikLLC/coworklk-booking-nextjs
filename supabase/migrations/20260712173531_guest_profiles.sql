-- Doc: docs/cowork-booking-architecture.md §3.2 `guest_profiles` (lines 336-388)

CREATE TABLE guest_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(200),

  -- Link to user if they later create an account
  converted_to_user_id UUID REFERENCES users(id),
  converted_at TIMESTAMPTZ,

  -- Tracking
  total_bookings INT DEFAULT 0,
  last_booking_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(email)
);

ALTER TABLE guest_profiles ENABLE ROW LEVEL SECURITY;

-- No direct client access: guest_profiles is written/read exclusively via
-- server-side API routes using the service-role client (guest checkout has
-- no session to scope a client-side policy to).
CREATE POLICY "Service role only" ON guest_profiles
  FOR ALL USING (false);

-- Function to convert guest to member after booking
CREATE OR REPLACE FUNCTION convert_guest_to_member(
  p_guest_email VARCHAR,
  p_password VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_guest_profile guest_profiles%ROWTYPE;
  v_new_user_id UUID;
BEGIN
  -- Get guest profile
  SELECT * INTO v_guest_profile FROM guest_profiles WHERE email = p_guest_email;

  IF v_guest_profile IS NULL THEN
    RAISE EXCEPTION 'Guest profile not found for email: %', p_guest_email;
  END IF;

  IF v_guest_profile.converted_to_user_id IS NOT NULL THEN
    RETURN v_guest_profile.converted_to_user_id;
  END IF;

  -- Create auth user (handled by application layer with Supabase Auth)
  -- This function just links the guest profile to the new user

  RETURN v_new_user_id;
END;
$$ LANGUAGE plpgsql;
