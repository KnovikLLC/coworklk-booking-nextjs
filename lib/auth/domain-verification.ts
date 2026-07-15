import { createAdminClient } from "@/lib/supabase/admin";
import { markBookingPaid } from "@/lib/bookings/payments";
import { createBookingInvoice } from "@/lib/zoho/create-booking-invoice";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";

/**
 * Checks if a user's verified email domain is preconfigured for automatic booking confirmation.
 * If verified and matches, automatically marks any pending bookings as paid/confirmed.
 */
export async function checkAndConfirmDomainBookings(
  userId: string,
  email: string,
  isConfirmed: boolean,
  supabase: SupabaseClient<Database>
): Promise<void> {
  if (!isConfirmed) return;

  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return;

  // 1. Check if the domain is in the preconfigured list
  const { data: domainRecord, error: domainError } = await supabase
    .from("preconfigured_domains")
    .select("domain")
    .eq("domain", domain)
    .single();

  if (domainError || !domainRecord) {
    return; // Domain is not preconfigured
  }

  // 2. Find any pending payment bookings for this user
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("id, total_amount")
    .eq("user_id", userId)
    .eq("status", "pending_payment");

  if (bookingsError || !bookings || bookings.length === 0) {
    return;
  }

  // 3. Automatically confirm all pending bookings using the Supabase Admin client
  const admin = createAdminClient();
  for (const booking of bookings) {
    try {
      console.log(`[Domain Auto-Confirm] Auto-confirming booking ${booking.id} for verified domain user (${email})`);
      
      await markBookingPaid(admin, {
        bookingId: booking.id,
        amount: Number(booking.total_amount),
        method: "domain_verification",
      });

      await createBookingInvoice(admin, booking.id);
    } catch (err) {
      console.error(`[Domain Auto-Confirm] Error confirming booking ${booking.id}:`, err);
    }
  }
}
