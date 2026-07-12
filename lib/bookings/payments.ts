import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/types/database.types";

export interface MarkBookingPaidParams {
  bookingId: string;
  amount: number;
  method: Database["public"]["Enums"]["payment_method"];
  gatewayTransactionId?: string | null;
  gatewayResponse?: Json | null;
  qrConfirmedBy?: string | null;
  qrConfirmationNote?: string | null;
}

// Shared by the PayHere webhook (payhere method, signature-verified) and the
// admin QR/bank-transfer confirmation endpoint (qr_transfer method,
// staff-verified) — both flip a booking from pending_payment to confirmed
// and record a payments row the same way.
export async function markBookingPaid(
  supabase: SupabaseClient<Database>,
  params: MarkBookingPaidParams
): Promise<void> {
  const { error: bookingUpdateError } = await supabase
    .from("bookings")
    .update({ status: "confirmed" })
    .eq("id", params.bookingId)
    .eq("status", "pending_payment");

  if (bookingUpdateError) {
    throw new Error(bookingUpdateError.message);
  }

  const { error: paymentError } = await supabase.from("payments").insert({
    booking_id: params.bookingId,
    amount: params.amount,
    method: params.method,
    status: "completed",
    gateway_transaction_id: params.gatewayTransactionId ?? null,
    gateway_response: params.gatewayResponse ?? null,
    qr_confirmed_by: params.qrConfirmedBy ?? null,
    qr_confirmation_note: params.qrConfirmationNote ?? null,
    paid_at: new Date().toISOString(),
  });

  if (paymentError) {
    throw new Error(paymentError.message);
  }
}
