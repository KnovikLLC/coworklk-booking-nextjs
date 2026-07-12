import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

// Service-role client. Bypasses RLS — server-only, never import from
// client components. Used for guest checkout, admin writes, webhooks,
// and cron jobs where there's no user session to scope RLS to.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
