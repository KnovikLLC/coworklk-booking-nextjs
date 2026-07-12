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
