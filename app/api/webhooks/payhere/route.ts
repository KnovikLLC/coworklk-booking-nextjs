import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePayhereNotifyHash } from "@/lib/payhere/hash";
import { markBookingPaid } from "@/lib/bookings/payments";

// Doc §6.1 lines 1498-1541, adapted: looks the booking up by booking_number
// (order_id) via the admin client, and uses markBookingPaid instead of an
// undefined confirmBookingPayment. Zoho invoice creation and the
// confirmation email are wired in by their own milestones (both wrapped so
// a missing/failed integration never blocks the payment confirmation
// itself — see lib/zoho/client.ts's graceful-degradation pattern).
export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const merchantId = formData.get("merchant_id") as string;
  const orderId = formData.get("order_id") as string;
  const paymentId = formData.get("payment_id") as string;
  const amount = formData.get("payhere_amount") as string;
  const currency = formData.get("payhere_currency") as string;
  const statusCode = formData.get("status_code") as string;
  const md5sig = formData.get("md5sig") as string;

  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !orderId || !statusCode || !md5sig || !merchantSecret) {
    return new NextResponse("Missing fields", { status: 400 });
  }

  const localSig = generatePayhereNotifyHash(merchantId, orderId, amount, currency, statusCode, merchantSecret);

  if (localSig !== md5sig) {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  // Status codes: 2 = success, 0 = pending, -1 = canceled, -2 = failed, -3 = chargedback
  if (statusCode === "2") {
    const admin = createAdminClient();
    const { data: booking, error } = await admin
      .from("bookings")
      .select("id, total_amount")
      .eq("booking_number", orderId)
      .single();

    if (error || !booking) {
      return new NextResponse("Booking not found", { status: 404 });
    }

    await markBookingPaid(admin, {
      bookingId: booking.id,
      amount: Number(amount),
      method: "payhere",
      gatewayTransactionId: paymentId,
      gatewayResponse: Object.fromEntries(
        Array.from(formData.entries()).map(([k, v]) => [k, String(v)])
      ),
    });

    // TODO(zoho-milestone): createZohoInvoice(booking) — wrapped, non-blocking.
    // TODO(email-milestone): sendBookingConfirmationEmail(booking) — wrapped, non-blocking.
  }

  return new NextResponse("OK");
}
