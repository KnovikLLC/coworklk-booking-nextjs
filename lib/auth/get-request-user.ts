import { createClient as createSupabaseClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

// Bridges the web app's cookie session and the Flutter app's
// `Authorization: Bearer <supabase-access-token>` onto the same JSON API
// routes. Returns an RLS-scoped client either way (never the admin client),
// matching the existing `authenticated` grants in
// supabase/migrations/20260712174446_grants.sql.
async function resolveRequestUser(
  request: NextRequest
): Promise<{ user: User; supabase: SupabaseClient<Database> } | null> {
  const cookieClient = createClient();
  const {
    data: { user: cookieUser },
  } = await cookieClient.auth.getUser();

  if (cookieUser) {
    return { user: cookieUser, supabase: cookieClient };
  }

  const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization");
  const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return null;

  const bearerClient = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );

  const {
    data: { user: bearerUser },
  } = await bearerClient.auth.getUser(token);

  if (!bearerUser) return null;

  return { user: bearerUser, supabase: bearerClient };
}

// Required-auth JSON routes (profile, my-bookings list, device registration).
export async function getRequestUser(
  request: NextRequest
): Promise<{ user: User; supabase: SupabaseClient<Database> } | { error: string; status: number }> {
  const result = await resolveRequestUser(request);
  if (!result) return { error: "Not authenticated", status: 401 };
  return result;
}

// Optional-auth JSON routes (guest checkout, guest-email-match lookups) —
// never errors, resolves to a user-or-null plus a client usable for reads
// (falls back to a plain anon client when there's no session at all).
export async function getOptionalRequestUser(
  request: NextRequest
): Promise<{ user: User | null; supabase: SupabaseClient<Database> }> {
  const result = await resolveRequestUser(request);
  if (result) return result;

  return {
    user: null,
    supabase: createSupabaseClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    ),
  };
}
