-- Doc: docs/cowork-booking-architecture.md §3.2 `addons` + `booking_addons` (lines 575-607)
-- Seed rows for addons live in supabase/seed.sql.

CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  zoho_item_id VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active addons" ON addons
  FOR SELECT USING (is_active = TRUE);

CREATE TABLE booking_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id),
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL
);

CREATE INDEX idx_booking_addons_booking ON booking_addons(booking_id);

ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own booking addons" ON booking_addons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM bookings b WHERE b.id = booking_addons.booking_id AND b.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all booking addons" ON booking_addons
  FOR ALL USING (is_staff());
