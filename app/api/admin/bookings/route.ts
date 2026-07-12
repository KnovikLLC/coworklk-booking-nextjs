import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/require-staff";
import { createAdminClient } from "@/lib/supabase/admin";

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
