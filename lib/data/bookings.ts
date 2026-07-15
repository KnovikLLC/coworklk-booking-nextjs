import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingSummaryDTO } from "@/lib/types/domain";

async function getBookingRow(id: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("bookings")
    .select(
      "id, booking_number, booking_date, time_slot, base_amount, addons_amount, discount_amount, discount_reason, total_amount, status, guest_email, user_id, spaces ( name )"
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

function toSummary(
  data: NonNullable<Awaited<ReturnType<typeof getBookingRow>>>
): BookingSummaryDTO {
  return {
    id: data.id,
    booking_number: data.booking_number,
    space_name: data.spaces?.name ?? "Space",
    booking_date: data.booking_date,
    time_slot: data.time_slot,
    base_amount: Number(data.base_amount),
    addons_amount: Number(data.addons_amount),
    discount_amount: Number(data.discount_amount),
    discount_reason: data.discount_reason,
    total_amount: Number(data.total_amount),
    status: data.status ?? "pending_payment",
    guest_email: data.guest_email,
  };
}

// Doc §4.1 GET /api/bookings/:id: "requires auth or booking reference".
// Guest bookings (user_id null) are readable by anyone holding the
// (unguessable) booking UUID — the ID is the access token, matching the
// doc's guest-checkout flow. Member bookings require the owning session
// or staff. Shared by the API route and the /booking/success server
// component so both enforce the same rule instead of duplicating it.
export async function getAuthorizedBookingSummary(
  id: string,
  currentUser: User | null,
  usersClient: SupabaseClient<Database>
): Promise<{ summary: BookingSummaryDTO } | { error: string; status: number }> {
  const row = await getBookingRow(id);
  if (!row) return { error: "Booking not found", status: 404 };

  if (row.user_id) {
    let isStaff = false;
    if (currentUser) {
      const { data: profile } = await usersClient
        .from("users")
        .select("role")
        .eq("id", currentUser.id)
        .single();
      isStaff = !!profile && ["admin", "frontdesk"].includes(profile.role ?? "");
    }

    if (!currentUser || (currentUser.id !== row.user_id && !isStaff)) {
      return { error: "Not authorized", status: 403 };
    }
  }

  return { summary: toSummary(row) };
}

const BOOKING_LIST_SELECT =
  "id, booking_number, booking_date, time_slot, base_amount, addons_amount, discount_amount, discount_reason, total_amount, status, guest_email, spaces ( name )";

function toBookingSummary(row: {
  id: string;
  booking_number: string;
  booking_date: string;
  time_slot: string;
  base_amount: number | null;
  addons_amount: number | null;
  discount_amount: number | null;
  discount_reason: string | null;
  total_amount: number | null;
  status: string | null;
  guest_email: string | null;
  spaces: { name: string } | null;
}): BookingSummaryDTO {
  return {
    id: row.id,
    booking_number: row.booking_number,
    space_name: row.spaces?.name ?? "Space",
    booking_date: row.booking_date,
    time_slot: row.time_slot,
    base_amount: Number(row.base_amount ?? 0),
    addons_amount: Number(row.addons_amount ?? 0),
    discount_amount: Number(row.discount_amount ?? 0),
    discount_reason: row.discount_reason,
    total_amount: Number(row.total_amount ?? 0),
    status: row.status ?? "pending_payment",
    guest_email: row.guest_email,
  };
}

// /profile/bookings history list — uses the caller's own RLS-scoped client
// (not the admin client) since "own bookings" is exactly what the
// `Users can view own bookings` policy already grants.
export async function getUserBookings(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<BookingSummaryDTO[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_LIST_SELECT)
    .eq("user_id", userId)
    .order("booking_date", { ascending: false });

  if (error || !data) return [];

  return data.map(toBookingSummary);
}

export type BookingListGroup = "upcoming" | "past" | "cancelled";

export interface UserBookingsPage {
  bookings: BookingSummaryDTO[];
  page: number;
  limit: number;
  total: number;
}

type BookingStatus = Database["public"]["Enums"]["booking_status"];

const ACTIVE_STATUSES: BookingStatus[] = ["pending_payment", "confirmed", "checked_in"];
const CANCELLED_STATUSES: BookingStatus[] = ["cancelled", "expired", "no_show"];

// GET /api/bookings — added for the Flutter app's "My Bookings" tabs
// (upcoming/past/cancelled); the web app's /profile/bookings page renders
// everything client-side from getUserBookings() above, so this is new
// rather than a rewrite of that existing behavior.
export async function getUserBookingsPaginated(
  supabase: SupabaseClient<Database>,
  userId: string,
  options: { group?: BookingListGroup; page?: number; limit?: number } = {}
): Promise<UserBookingsPage> {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 20));
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("bookings")
    .select(BOOKING_LIST_SELECT, { count: "exact" })
    .eq("user_id", userId);

  if (options.group === "upcoming") {
    query = query.in("status", ACTIVE_STATUSES).gte("booking_date", today);
  } else if (options.group === "cancelled") {
    query = query.in("status", CANCELLED_STATUSES);
  } else if (options.group === "past") {
    query = query.or(
      `status.eq.completed,and(status.in.(${ACTIVE_STATUSES.join(",")}),booking_date.lt.${today})`
    );
  }

  const { data, error, count } = await query
    .order("booking_date", { ascending: false })
    .range(from, to);

  if (error || !data) {
    return { bookings: [], page, limit, total: 0 };
  }

  return {
    bookings: data.map(toBookingSummary),
    page,
    limit,
    total: count ?? data.length,
  };
}
