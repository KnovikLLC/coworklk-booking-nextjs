import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminBookingCreateSchema } from "@/lib/validation/booking.schema";
import { BookingError, createBooking } from "@/lib/bookings/create";
import { markBookingPaid } from "@/lib/bookings/payments";
import { createBookingInvoice } from "@/lib/zoho/create-booking-invoice";

// Doc §4.2 GET /api/admin/bookings — list with filters.
// Query params: date, status, space_id, page, limit
export async function GET(request: NextRequest) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const params = request.nextUrl.searchParams;
  const date = params.get("date");
  const status = params.get("status");
  const spaceId = params.get("space_id");
  const page = Math.max(1, Number(params.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(params.get("limit") ?? "20")));
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const admin = createAdminClient();
  let query = admin
    .from("bookings")
    .select(
      "id, booking_number, booking_date, time_slot, status, total_amount, guest_name, guest_email, spaces ( name, type ), users!bookings_user_id_fkey ( full_name, email )",
      { count: "exact" }
    )
    .order("booking_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (date) query = query.eq("booking_date", date);
  if (status) query = query.eq("status", status as never);
  if (spaceId) query = query.eq("space_id", spaceId);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const bookings = (data ?? []).map((b) => ({
    id: b.id,
    booking_number: b.booking_number,
    customer_name: b.guest_name ?? b.users?.full_name ?? "Customer",
    customer_email: b.guest_email ?? b.users?.email ?? null,
    space_name: b.spaces?.name ?? "Space",
    space_type: b.spaces?.type ?? null,
    date: b.booking_date,
    slot: b.time_slot,
    status: b.status,
    total_amount: Number(b.total_amount),
  }));

  return NextResponse.json({
    bookings,
    page,
    limit,
    total: count ?? bookings.length,
  });
}

// Doc §4.2 POST /api/admin/bookings + §10.5's payment-handling table:
// cash/card_terminal are treated as received (confirmed immediately,
// invoice created); qr_transfer/payhere stay pending_payment, same as a
// customer-initiated booking, for front desk to confirm later via
// /api/admin/payments/confirm-qr or a sent PayHere link.
export async function POST(request: NextRequest) {
  const staff = await requireStaff();
  if ("error" in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  const parsed = adminBookingCreateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;

  const admin = createAdminClient();
  const markConfirmed =
    body.payment_received ?? (body.payment_method === "cash" || body.payment_method === "card_terminal");

  try {
    const booking = await createBooking(admin, {
      spaceId: body.space_id,
      pricingId: body.pricing_id,
      date: body.date,
      slot: body.slot,
      addons: body.addons,
      notes: body.notes,
      guestName: body.customer.name,
      guestEmail: body.customer.email,
      guestPhone: body.customer.phone,
      createdBy: staff.user.id,
      markConfirmed,
    });

    if (markConfirmed) {
      await markBookingPaid(admin, {
        bookingId: booking.id,
        amount: booking.total_amount,
        method: body.payment_method,
      });
      await createBookingInvoice(admin, booking.id);
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}
