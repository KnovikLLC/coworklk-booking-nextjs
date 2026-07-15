import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth/get-request-user";
import { getProfileWithLoyalty } from "@/lib/data/profile";
import { profileUpdateSchema } from "@/lib/validation/profile.schema";

// GET/PATCH /api/profile — added for the Flutter app (profile screen,
// loyalty card); the web app previously only read this via server
// components, there was no JSON route. Dual-mode auth (cookie or Bearer).
export async function GET(request: NextRequest) {
  const auth = await getRequestUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const result = await getProfileWithLoyalty(auth.supabase, auth.user.id);
  if (!result) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const auth = await getRequestUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("users")
    .update(parsed.data)
    .eq("id", auth.user.id)
    .select("id, email, full_name, phone, company_name, is_member, member_since, total_bookings, total_spent")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
