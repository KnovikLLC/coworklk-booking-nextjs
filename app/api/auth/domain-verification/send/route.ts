import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDomainVerificationEmail } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json().catch(() => ({}));
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) {
      return NextResponse.json({ error: "Invalid email domain" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Verify that domain is preconfigured
    const { data: domainRecord, error: domainError } = await admin
      .from("preconfigured_domains")
      .select("domain")
      .eq("domain", domain)
      .single();

    if (domainError || !domainRecord) {
      return NextResponse.json(
        { error: "This email domain does not qualify for auto-confirmation" },
        { status: 400 }
      );
    }

    // 2. Generate a 6-digit numeric verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // 3. Store code in database
    const { error: insertError } = await admin
      .from("domain_verifications")
      .insert({
        email: email.toLowerCase().trim(),
        code,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Error saving 2FA code:", insertError.message);
      return NextResponse.json({ error: "Failed to generate verification code" }, { status: 500 });
    }

    // 4. Send email
    await sendDomainVerificationEmail(email, code);

    return NextResponse.json({ success: true, message: "Verification code sent successfully" });
  } catch (err: unknown) {
    console.error("Domain verification send error:", err);
    const msg = err instanceof Error ? err.message : "An unexpected error occurred";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
