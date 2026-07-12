import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { convertGuestSchema } from "@/lib/validation/auth.schema";
import { createOrUpdateZohoContact } from "@/lib/zoho/customers";
import { ZohoNotConfiguredError } from "@/lib/zoho/client";

// Doc §8.6 lines 1829-1893, adapted:
// - Uses lib/supabase/server's cookie-aware client for signUp() so the
//   resulting session is set on the response (the guest is logged in
//   immediately after converting) — the doc's createServerClient() is the
//   same idea, just via the deprecated auth-helpers-nextjs package.
// - Doesn't INSERT into `users` after signUp: migration 0013's
//   handle_new_user trigger already created that row. UPDATEs it instead
//   with the guest profile's details plus membership fields, or the doc's
//   version would fail on a duplicate primary key.
// - createOrUpdateZohoContact is wrapped in try/catch below so a missing/
//   failed Zoho call never blocks account creation.
export async function POST(request: NextRequest) {
  const parsed = convertGuestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const admin = createAdminClient();
  const { data: guestProfile } = await admin
    .from("guest_profiles")
    .select("*")
    .eq("email", email)
    .single();

  if (guestProfile?.converted_to_user_id) {
    return NextResponse.json({ error: "This email already has an account" }, { status: 409 });
  }

  const supabase = createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        source: "guest_conversion",
        full_name: guestProfile?.full_name ?? undefined,
        phone: guestProfile?.phone ?? undefined,
      },
    },
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? "Could not create account" }, { status: 400 });
  }

  const userId = authData.user.id;

  await admin
    .from("users")
    .update({
      full_name: guestProfile?.full_name ?? undefined,
      phone: guestProfile?.phone ?? undefined,
      is_member: true,
      member_since: new Date().toISOString(),
      total_bookings: guestProfile?.total_bookings ?? 0,
    })
    .eq("id", userId);

  await admin
    .from("bookings")
    .update({ user_id: userId, booking_type: "member" })
    .eq("guest_email", email);

  if (guestProfile) {
    await admin
      .from("guest_profiles")
      .update({ converted_to_user_id: userId, converted_at: new Date().toISOString() })
      .eq("id", guestProfile.id);
  }

  try {
    await createOrUpdateZohoContact(email, guestProfile?.full_name, guestProfile?.phone);
  } catch (error) {
    if (!(error instanceof ZohoNotConfiguredError)) {
      console.error(`[zoho] contact sync failed for ${email}`, error);
    }
  }

  return NextResponse.json({
    success: true,
    user_id: userId,
    message: "Account created! You now qualify for member discounts.",
  });
}
