import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Shared by every /profile/* page.
export async function requireUser(): Promise<{ user: User; supabase: ReturnType<typeof createClient> }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile");
  }

  return { user, supabase };
}
