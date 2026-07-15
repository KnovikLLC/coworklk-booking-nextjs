-- Cowork.lk Flutter mobile app backend enhancement plan §3.
-- FCM device token storage for push notifications. Unlike bookings/payments,
-- this table has no business logic behind it, so (per plan) the mobile app
-- registers/removes its own token directly via RLS rather than through a
-- Next.js API route.

CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  platform VARCHAR(10) CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, fcm_token)
);

CREATE INDEX idx_user_devices_user ON user_devices(user_id);

ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own devices" ON user_devices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Raw SQL migrations don't get Supabase's dashboard default grants (see
-- supabase/migrations/20260712174446_grants.sql) — RLS alone isn't enough,
-- the base privilege is also required or queries fail with "permission
-- denied for table" regardless of policy.
GRANT SELECT, INSERT, UPDATE, DELETE ON user_devices TO authenticated;
GRANT ALL ON user_devices TO service_role;
