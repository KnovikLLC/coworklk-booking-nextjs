import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncUserContactById } from "@/lib/zoho/sync-user-contacts";
import { ZohoNotConfiguredError } from "@/lib/zoho/client";

// Called by SignupForm right after supabase.auth.signUp() succeeds, so
// every new member gets a Zoho contact created (and users.zoho_contact_id
// populated) without the signup flow itself depending on Zoho being up.
// Fire-and-forget from the client — never blocks the redirect to /profile.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const admin = createAdminClient();
  try {
    await syncUserContactById(admin, user.id);
  } catch (error) {
    if (!(error instanceof ZohoNotConfiguredError)) {
      console.error(`[zoho] contact sync failed for user ${user.id}`, error);
    }
  }

  return NextResponse.json({ success: true });
}
