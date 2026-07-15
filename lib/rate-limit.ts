import { createAdminClient } from "@/lib/supabase/admin";

export interface RateLimitOptions {
  key: string;
  windowSeconds: number;
  maxHits: number;
}

// Postgres-backed fixed-window rate limiter (see
// supabase/migrations/20260715090500_rate_limit.sql) — avoids adding a paid
// Upstash/Redis dependency for what's currently a low-volume booking site.
// Fails open (allows the request) if the check itself errors, so a
// rate-limit bug never takes down booking creation.
export async function checkRateLimit(options: RateLimitOptions): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("check_rate_limit", {
    p_key: options.key,
    p_window_seconds: options.windowSeconds,
    p_max_hits: options.maxHits,
  });

  if (error) {
    console.error("[rate-limit] check failed, failing open:", error);
    return true;
  }

  return data === true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
