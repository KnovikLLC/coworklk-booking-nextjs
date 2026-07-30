import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const updateBookingStatusSchema = z.object({
  status: z.enum(["checked_in", "completed", "no_show"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateBookingStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { status } = parsed.data;
  const admin = createAdminClient();

  // Get current booking status
  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const currentStatus = booking.status;

  // Validate state transitions
  if (status === "checked_in" && currentStatus !== "confirmed") {
    return NextResponse.json(
      { error: `Cannot transition from '${currentStatus}' to 'checked_in'. Booking must be 'confirmed'.` },
      { status: 400 }
    );
  }

  if (status === "completed" && currentStatus !== "checked_in") {
    return NextResponse.json(
      { error: `Cannot transition from '${currentStatus}' to 'completed'. Booking must be 'checked_in'.` },
      { status: 400 }
    );
  }

  if (status === "no_show" && currentStatus !== "confirmed") {
    return NextResponse.json(
      { error: `Cannot transition from '${currentStatus}' to 'no_show'. Booking must be 'confirmed'.` },
      { status: 400 }
    );
  }

  // Update status in database
  const { data: updatedBooking, error: updateError } = await admin
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select("id, booking_number, status")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, booking: updatedBooking });
}

// Doc: admin cleanup for mistaken/duplicate bookings. Restricted to
// pending_payment/cancelled — confirmed/checked_in/completed bookings have
// real payments and/or Zoho invoices tied to them and must be cancelled
// through the normal flow instead of removed outright. booking_addons and
// payments rows cascade automatically (ON DELETE CASCADE, see
// supabase/migrations/20260712173536_addons.sql and .../20260712173535_payments.sql).
// Any existing zoho_invoice_id is left untouched — this never calls Zoho.
const DELETABLE_STATUSES = new Set(["pending_payment", "cancelled"]);

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "Booking ID is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: booking, error: fetchError } = await admin
    .from("bookings")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!DELETABLE_STATUSES.has(booking.status ?? "")) {
    return NextResponse.json(
      { error: "Only pending or cancelled bookings can be deleted" },
      { status: 409 }
    );
  }

  const { error: deleteError } = await admin.from("bookings").delete().eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
