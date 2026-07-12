-- Doc: docs/cowork-booking-architecture.md §3.2 `pricing` (lines 214-226). Seed rows live in supabase/seed.sql.

CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
  duration VARCHAR(20) NOT NULL CHECK (duration IN ('half_day', 'full_day', 'unlimited', '1hr', '2hr', '30min')),
  slot_type VARCHAR(20) DEFAULT 'any' CHECK (slot_type IN ('morning', 'afternoon', 'evening', 'night', 'any')),
  price DECIMAL(10,2) NOT NULL,
  zoho_item_id VARCHAR(50) NOT NULL,
  zoho_item_name VARCHAR(200),
  description TEXT,
  includes_data_gb INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pricing_space ON pricing(space_id);

ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active pricing" ON pricing
  FOR SELECT USING (is_active = TRUE);
