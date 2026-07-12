-- Doc: docs/cowork-booking-architecture.md §5.3 `zoho_item_mapping` (lines 987-1012)

CREATE TABLE zoho_item_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zoho_item_id VARCHAR(50) NOT NULL UNIQUE,
  zoho_item_name VARCHAR(200) NOT NULL,
  zoho_item_type VARCHAR(50),        -- 'service', 'goods'
  zoho_status VARCHAR(20),           -- 'active', 'inactive'
  zoho_rate DECIMAL(10,2),
  zoho_description TEXT,

  -- Local mapping
  local_entity_type VARCHAR(50),     -- 'space_pricing', 'addon', 'unmapped'
  local_entity_id UUID,              -- FK to pricing or addons table

  -- Categorization (set manually or via naming convention)
  category VARCHAR(50),              -- 'hot_desk', 'workspace', 'meeting_room', 'lobby', 'addon'
  duration VARCHAR(20),              -- 'half_day', 'full_day', 'unlimited', '1hr', etc.

  -- Sync metadata
  last_synced_at TIMESTAMPTZ,
  sync_hash VARCHAR(64),             -- Hash of Zoho data to detect changes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_zoho_mapping_item_id ON zoho_item_mapping(zoho_item_id);
CREATE INDEX idx_zoho_mapping_local ON zoho_item_mapping(local_entity_type, local_entity_id);

ALTER TABLE zoho_item_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view item mapping" ON zoho_item_mapping
  FOR SELECT USING (is_staff());
