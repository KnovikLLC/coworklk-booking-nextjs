-- Cowork.lk Flutter mobile app backend enhancement plan §7 (Phase 2).
-- Lightweight fixed-window rate limiter, Postgres-backed rather than a new
-- paid Upstash/Redis dependency — this site's write volume doesn't justify
-- that cost yet. Scoped in application code (lib/rate-limit.ts) to
-- POST /api/bookings and other write/auth-sensitive endpoints.

CREATE TABLE rate_limit_hits (
  key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (key, window_start)
);

-- No RLS/grants needed for client roles: only ever touched via
-- check_rate_limit(), which is SECURITY DEFINER and called by the
-- service-role admin client from route handlers, never directly by a
-- client SDK.
ALTER TABLE rate_limit_hits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_window_seconds INT, p_max_hits INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INT;
BEGIN
  v_window_start := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);

  INSERT INTO rate_limit_hits (key, window_start, count)
  VALUES (p_key, v_window_start, 1)
  ON CONFLICT (key, window_start)
  DO UPDATE SET count = rate_limit_hits.count + 1
  RETURNING count INTO v_count;

  -- Best-effort cleanup of stale buckets in the same call, rather than a
  -- separate cron job just for housekeeping.
  DELETE FROM rate_limit_hits WHERE window_start < now() - INTERVAL '1 hour';

  RETURN v_count <= p_max_hits;
END;
$$;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, INT, INT) TO service_role;
GRANT ALL ON rate_limit_hits TO service_role;
