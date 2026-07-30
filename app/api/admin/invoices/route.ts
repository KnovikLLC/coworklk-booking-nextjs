import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { createCombinedBookingInvoice } from "@/lib/zoho/create-combined-invoice";

// Admin "create a single combined invoice for selected bookings" action —
// for corporate billing, where several already-existing bookings (picked
// via checkboxes in the admin bookings list) need to land on one Zoho
// invoice regardless of date, distinct from the automatic per-order/
// per-date invoicing wired into booking creation.
export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const body = await request.json().catch(() => null);
  const bookingIds: unknown = body?.booking_ids;
  if (!Array.isArray(bookingIds) || bookingIds.length === 0 || !bookingIds.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "booking_ids must be a non-empty array of strings" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    const result = await createCombinedBookingInvoice(admin, bookingIds, {
      paymentReceived: body?.payment_received ?? true,
      sendEmail: body?.send_email ?? true,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
