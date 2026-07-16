import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkAndConfirmDomainBookings } from "@/lib/auth/domain-verification";

// Shared by every /profile/* page.
export async function requireUser(): Promise<{ user: User; supabase: ReturnType<typeof createClient> }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/profile");
  }

  // Staff accounts (admin/frontdesk) don't have a customer profile — send
  // them to the admin area instead of the member dashboard.
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile && ["admin", "frontdesk"].includes(profile.role ?? "")) {
    redirect("/admin/login");
  }

  // Check and auto-confirm pending bookings if user has a verified preconfigured email domain
  const isConfirmed = !!user.email_confirmed_at;
  checkAndConfirmDomainBookings(user.id, user.email ?? "", isConfirmed, supabase).catch((err) => {
    console.error("[Domain Auto-Confirm] Error in non-blocking check:", err);
  });

  return { user, supabase };
}
