import { NextRequest, NextResponse } from "next/server";
import { getOptionalRequestUser } from "@/lib/auth/get-request-user";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInvoicePdf } from "@/lib/zoho/invoices";
import { ZohoNotConfiguredError } from "@/lib/zoho/client";

// GET /api/bookings/:id/invoice — Flutter app's "Invoice Download" (P1).
// Streams the Zoho-hosted invoice PDF through this route (rather than
// redirecting to a Zoho URL) since Zoho invoice PDFs require an OAuth
// bearer token the client doesn't have. Same ownership rule as the
// cancel/reschedule routes.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { user, supabase } = await getOptionalRequestUser(request);
  const admin = createAdminClient();

  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select("id, user_id, zoho_invoice_id, zoho_invoice_number")
    .eq("id", params.id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.user_id) {
    let isStaff = false;
    if (user) {
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
      isStaff = !!profile && ["admin", "frontdesk"].includes(profile.role ?? "");
    }

    if (!user || (user.id !== booking.user_id && !isStaff)) {
      return NextResponse.json({ error: "Not authorized to view this invoice" }, { status: 403 });
    }
  }

  if (!booking.zoho_invoice_id) {
    return NextResponse.json({ error: "Invoice not yet available for this booking" }, { status: 404 });
  }

  try {
    const pdf = await getInvoicePdf(booking.zoho_invoice_id);
    return new NextResponse(pdf, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${booking.zoho_invoice_number ?? booking.id}.pdf"`,
      },
    });
  } catch (err) {
    if (err instanceof ZohoNotConfiguredError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error(`[bookings/${params.id}/invoice] Zoho PDF fetch failed:`, err);
    return NextResponse.json({ error: "Could not retrieve invoice" }, { status: 502 });
  }
}
