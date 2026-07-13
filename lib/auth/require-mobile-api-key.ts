import { NextRequest } from "next/server";

// Mirrors require-staff.ts's discriminated-union return shape, but for the
// Cowork Admin Assist mobile app: a shared API key (Bearer token), not a
// staff session — same trust model as the cron routes' CRON_SECRET check
// (app/api/cron/expire-bookings/route.ts), company-managed devices with one
// shared token rather than per-agent login.
export function requireMobileApiKey(request: NextRequest): { ok: true } | { error: string; status: number } {
  const apiKey = process.env.ADMIN_ASSIST_API_KEY;
  if (!apiKey) {
    return { error: "Mobile API is not configured", status: 503 };
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${apiKey}`) {
    return { error: "Unauthorized", status: 401 };
  }

  return { ok: true };
}
