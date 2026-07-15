import { generatePayhereHash } from "@/lib/payhere/hash";

export interface PayhereCheckoutBooking {
  id: string;
  booking_number: string;
  total_amount: number;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  space_name: string | null;
  user_full_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
}

export interface PayhereCheckoutResult {
  payhere_url: string;
  form_data: Record<string, string | number>;
}

// Extracted from app/api/payments/payhere/initiate/route.ts so both that
// route and the public /pay/[bookingId] page (Cowork Admin Assist's payment
// link destination) share one implementation instead of duplicating the
// hash/form-data-building logic.
export function buildPayhereCheckout(booking: PayhereCheckoutBooking): PayhereCheckoutResult | { notConfigured: true } {
  const merchantId = process.env.PAYHERE_MERCHANT_ID;
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
  if (!merchantId || !merchantSecret) {
    return { notConfigured: true };
  }

  const name = booking.guest_name ?? booking.user_full_name ?? "Customer";
  const email = booking.guest_email ?? booking.user_email ?? "";
  const phone = booking.guest_phone ?? booking.user_phone ?? "";
  const [firstName, ...rest] = name.split(" ");

  const amount = Number(booking.total_amount);
  const amountFormatted = amount.toFixed(2);
  const formData: Record<string, string | number> = {
    merchant_id: merchantId,
    return_url: `${process.env.NEXT_PUBLIC_URL}/booking/success?id=${booking.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/booking/cancel?id=${booking.id}`,
    notify_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/payhere`,
    order_id: booking.booking_number,
    items: booking.space_name ?? "Cowork.lk Booking",
    currency: "LKR",
    amount: amountFormatted,
    first_name: firstName || "Customer",
    last_name: rest.join(" ") || "-",
    email,
    phone,
    address: "N/A",
    city: "Colombo",
    country: "Sri Lanka",
    hash: generatePayhereHash(merchantId, booking.booking_number, amount, "LKR", merchantSecret),
  };

  return {
    payhere_url:
      process.env.PAYHERE_MODE === "live"
        ? "https://www.payhere.lk/pay/checkout"
        : "https://sandbox.payhere.lk/pay/checkout",
    form_data: formData,
  };
}
