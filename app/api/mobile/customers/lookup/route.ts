import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireMobileApiKey } from "@/lib/auth/require-mobile-api-key";

// Cowork Admin Assist: lets the front-desk app skip asking a repeat caller
// for their email again. Neither guest_profiles.phone nor users.phone is
// unique, so this applies a resolution policy: a registered member (users)
// match wins over a guest-checkout (guest_profiles) match, since it's the
// more authoritative record; within each table, most-recently-updated wins.
// guest_profiles has service-role-only RLS, so this must use the admin client.
export async function GET(request: NextRequest) {
  const auth = requireMobileApiKey(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const phone = request.nextUrl.searchParams.get("phone");
  if (!phone) {
    return NextResponse.json({ error: "phone is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: userMatch } = await admin
    .from("users")
    .select("full_name, email")
    .eq("phone", phone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (userMatch?.email) {
    return NextResponse.json({ name: userMatch.full_name, email: userMatch.email });
  }

  const { data: guestMatch } = await admin
    .from("guest_profiles")
    .select("full_name, email")
    .eq("phone", phone)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (guestMatch?.email) {
    return NextResponse.json({ name: guestMatch.full_name, email: guestMatch.email });
  }

  return NextResponse.json(null);
}
