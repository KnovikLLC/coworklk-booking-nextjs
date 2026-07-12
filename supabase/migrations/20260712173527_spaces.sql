-- Doc: docs/cowork-booking-architecture.md §3.2 `spaces` (lines 186-199). Seed rows live in supabase/seed.sql.

CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('hot_desk', 'workspace', 'meeting_room_4', 'meeting_room_4_black', 'meeting_room_5', 'lobby', 'creative_studio', 'classroom')),
  capacity INT NOT NULL DEFAULT 1,
  description TEXT,
  image_url VARCHAR(500),
  amenities JSONB DEFAULT '[]',
  requires_specific_seat BOOLEAN DEFAULT FALSE,
  total_inventory INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active spaces" ON spaces
  FOR SELECT USING (is_active = TRUE);
