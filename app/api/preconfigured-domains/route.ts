import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("preconfigured_domains")
    .select("domain");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const domains = data?.map((d) => d.domain) ?? [];
  return NextResponse.json({ domains });
}
