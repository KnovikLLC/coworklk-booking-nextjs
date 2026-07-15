import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { SLOT_TIMES } from "@/lib/bookings/slot-times";
import { BookingError } from "@/lib/bookings/create";

export interface RescheduleBookingParams {
  bookingId: string;
  date: string;
  slot: string;
}

export interface RescheduledBooking {
  id: string;
  booking_number: string;
  booking_date: string;
  time_slot: string;
  status: string;
}

// PATCH /api/bookings/:id/reschedule — changes date/slot only (space,
// pricing, addons, and total_amount are untouched, so there's no refund/
// upcharge delta to compute). Re-validates availability for the new slot
// the same way createBooking() does, and — mirroring the 4-hour cutoff in
// calculateRefund() (lib/bookings/cancellation.ts) — refuses to move a
// booking that's about to start; too late to safely reshuffle inventory,
// the customer should cancel instead.
export async function rescheduleBooking(
  supabase: SupabaseClient<Database>,
  params: RescheduleBookingParams
): Promise<RescheduledBooking> {
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, booking_number, space_id, status, booking_date, time_slot, start_time, workspace_count")
    .eq("id", params.bookingId)
    .single();

  if (fetchError || !booking) {
    throw new BookingError("Booking not found", 404);
  }

  if (!["pending_payment", "confirmed"].includes(booking.status ?? "")) {
    throw new BookingError(`Cannot reschedule a booking with status '${booking.status}'`, 400);
  }

  if (booking.booking_date === params.date && booking.time_slot === params.slot) {
    throw new BookingError("New date/slot is the same as the current booking", 400);
  }

  const currentStart = new Date(`${booking.booking_date}T00:00:00`);
  if (booking.start_time) {
    const [hours, minutes] = booking.start_time.split(":");
    currentStart.setHours(Number(hours), Number(minutes), 0, 0);
  }
  const hoursUntilStart = (currentStart.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntilStart < 4) {
    throw new BookingError("Too close to the booking start time to reschedule — cancel instead", 400);
  }

  const { data: availability } = await supabase.rpc("check_availability", {
    p_space_id: booking.space_id,
    p_date: params.date,
    p_slot: params.slot as Database["public"]["Enums"]["time_slot"],
  });

  const row = availability && availability.length > 0 ? availability[0] : null;
  const remaining = (row?.total_inventory ?? 0) - (row?.booked_count ?? 0);
  if (remaining < (booking.workspace_count ?? 1)) {
    throw new BookingError(
      remaining > 0 ? `Only ${remaining} seat(s) are available for this slot` : "This slot is no longer available",
      409
    );
  }

  const slotTimes = SLOT_TIMES[params.slot] ?? null;

  const { data: updated, error: updateError } = await supabase
    .from("bookings")
    .update({
      booking_date: params.date,
      time_slot: params.slot as Database["public"]["Enums"]["time_slot"],
      start_time: slotTimes?.start ?? null,
      end_time: slotTimes?.end ?? null,
    })
    .eq("id", booking.id)
    .select("id, booking_number, booking_date, time_slot, status")
    .single();

  if (updateError || !updated) {
    throw new BookingError(updateError?.message ?? "Could not reschedule booking", 500);
  }

  return { ...updated, status: updated.status ?? "pending_payment" };
}
