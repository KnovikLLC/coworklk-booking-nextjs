-- Doc: docs/cowork-booking-architecture.md §5.3 `zoho_sync_log` (lines 970-984)

CREATE TABLE zoho_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type VARCHAR(50) NOT NULL,  -- 'items', 'contacts', 'full'
  status VARCHAR(20) NOT NULL,      -- 'running', 'completed', 'failed', 'skipped'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  items_synced INT DEFAULT 0,
  items_created INT DEFAULT 0,
  items_updated INT DEFAULT 0,
  items_deactivated INT DEFAULT 0,
  error_message TEXT,
  triggered_by VARCHAR(50)          -- 'cron', 'manual', 'webhook'
);

ALTER TABLE zoho_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sync log" ON zoho_sync_log
  FOR SELECT USING (is_staff());
