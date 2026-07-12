import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const STAFF_ROLES = ["admin", "frontdesk"];

// Shared by every /api/admin/* route (middleware.ts only guards page
// navigations, not API routes hit directly, so each admin API route
// re-checks the role server-side).
export async function requireStaff(): Promise<
  { user: User; role: string } | { error: string; status: number }
> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated", status: 401 };
  }

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!profile || !STAFF_ROLES.includes(profile.role ?? "")) {
    return { error: "Not authorized", status: 403 };
  }

  return { user, role: profile.role! };
}
