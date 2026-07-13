import { NextRequest, NextResponse } from "next/server";
import { requireMobileApiKey } from "@/lib/auth/require-mobile-api-key";
import { findOrCreateCustomer } from "@/lib/zoho/customers";

export async function POST(request: NextRequest) {
  const auth = requireMobileApiKey(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const json = await request.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, phone, email } = json;
  if (!name && !phone && !email) {
    return NextResponse.json(
      { error: "At least one of name, phone, or email is required" },
      { status: 400 }
    );
  }

  try {
    const contact = await findOrCreateCustomer(
      email || "",
      name || "Customer",
      phone || ""
    );
    return NextResponse.json({ contact }, { status: 201 });
  } catch (error: any) {
    console.error("[mobile/customers] Zoho customer creation failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Zoho customer" },
      { status: 500 }
    );
  }
}
