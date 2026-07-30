import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchInvoices } from "@/lib/zoho/invoices";

// Admin "match invoice to booking" flow: GET searches Zoho invoices by the
// booking's own booking_number (or an admin-supplied query), POST links a
// chosen invoice's id/number onto the booking. Covers bookings where
// createBookingInvoice/createGroupBookingInvoice failed silently, or where
// the invoice was created manually in Zoho under a different reference.
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select("booking_number")
    .eq("id", params.id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const query = request.nextUrl.searchParams.get("query") || booking.booking_number;

  let results = await searchInvoices({ reference_number: query });
  if (results.length === 0) {
    results = await searchInvoices({ invoice_number: query });
  }

  return NextResponse.json({ invoices: results });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const body = await request.json().catch(() => null);
  if (!body?.invoice_id || !body?.invoice_number) {
    return NextResponse.json({ error: "invoice_id and invoice_number are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .update({ zoho_invoice_id: body.invoice_id, zoho_invoice_number: body.invoice_number })
    .eq("id", params.id)
    .select("id, booking_number, zoho_invoice_id, zoho_invoice_number")
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: error?.message ?? "Booking not found" }, { status: error ? 500 : 404 });
  }

  return NextResponse.json({ booking });
}
