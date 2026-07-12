-- Doc: docs/cowork-booking-architecture.md §3.2 `bookings` (lines 390-529)
-- Admin RLS policy uses is_staff() (defined in 20260712173529_users.sql) instead
-- of the doc's self-referencing subquery, for the same recursion reason as `users`.

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number VARCHAR(20) UNIQUE NOT NULL,
  space_id UUID NOT NULL REFERENCES spaces(id),
  pricing_id UUID NOT NULL REFERENCES pricing(id),

  -- User reference (NULL for guest bookings)
  user_id UUID REFERENCES users(id),
  guest_profile_id UUID REFERENCES guest_profiles(id),
  booking_type booking_type NOT NULL DEFAULT 'guest',

  -- Booking details
  booking_date DATE NOT NULL,
  time_slot time_slot NOT NULL,
  start_time TIME,
  end_time TIME,

  -- Guest info (for non-registered bookings)
  guest_name VARCHAR(200),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),

  -- Financial
  base_amount DECIMAL(10,2) NOT NULL,
  addons_amount DECIMAL(10,2) DEFAULT 0,
  discount_percent INT DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_reason VARCHAR(100),  -- e.g., 'Member loyalty - 10%'
  total_amount DECIMAL(10,2) NOT NULL,

  -- Status
  status booking_status DEFAULT 'pending_payment',

  -- External references
  payment_reference VARCHAR(100),
  zoho_invoice_id VARCHAR(50),
  zoho_invoice_number VARCHAR(50),

  -- Metadata
  notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  refund_amount DECIMAL(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Trigger to update user stats after booking completion
CREATE OR REPLACE FUNCTION update_user_booking_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    IF NEW.user_id IS NOT NULL THEN
      UPDATE users SET
        total_bookings = total_bookings + 1,
        total_spent = total_spent + NEW.total_amount,
        last_booking_date = NEW.booking_date,
        is_member = TRUE,
        member_since = COALESCE(member_since, NOW()),
        updated_at = NOW()
      WHERE id = NEW.user_id;
    END IF;

    IF NEW.guest_profile_id IS NOT NULL THEN
      UPDATE guest_profiles SET
        total_bookings = total_bookings + 1,
        last_booking_date = NEW.booking_date,
        updated_at = NOW()
      WHERE id = NEW.guest_profile_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_user_booking_stats();

-- Generate booking number
CREATE SEQUENCE booking_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.booking_number := 'CW' || TO_CHAR(NOW(), 'YYMMDD') || '-' ||
    LPAD(NEXTVAL('booking_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION generate_booking_number();

-- Indexes for performance
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_space_date ON bookings(space_id, booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_user ON bookings(user_id);

-- Row Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid() OR guest_email = (SELECT email FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR ALL USING (is_staff());
