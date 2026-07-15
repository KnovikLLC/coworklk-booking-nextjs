import { createAdminClient } from "@/lib/supabase/admin";
import { formatLKR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PayNowButton } from "@/components/booking/PayNowButton";

export const metadata = { title: "Complete Payment | Cowork.lk", robots: { index: false, follow: false } };

// Cowork Admin Assist's payment link destination: the front-desk app
// creates an unpaid (pending_payment) booking over the phone and sends this
// URL to the customer via email + WhatsApp. Public, no auth — the booking id
// itself is the access token, same trust model as /booking/success.
export default async function PayBookingPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const admin = createAdminClient();
  const { data: booking, error } = await admin
    .from("bookings")
    .select(
      "id, booking_number, total_amount, status, guest_name, guest_email, guest_phone, booking_date, time_slot, spaces ( name ), users!bookings_user_id_fkey ( full_name, email, phone )"
    )
    .eq("id", params.bookingId)
    .single();

  if (error || !booking) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-xl border bg-white p-6 text-center">
          <h1 className="text-xl font-bold text-brand-dark">Booking not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This payment link is invalid or has expired.
          </p>
        </div>
      </main>
    );
  }

  if (booking.status !== "pending_payment") {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <div className="rounded-xl border bg-white p-6 text-center">
          <h1 className="text-xl font-bold text-brand-dark">
            {booking.status === "confirmed" || booking.status === "completed"
              ? "Already paid"
              : "This booking is no longer awaiting payment"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">#{booking.booking_number}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Status: <Badge variant="secondary">{(booking.status ?? "unknown").replace("_", " ")}</Badge>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-bold text-brand-dark">Complete Your Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">#{booking.booking_number}</p>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Space</dt>
            <dd>{booking.spaces?.name ?? "Coworking Space"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Date</dt>
            <dd>{booking.booking_date}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Slot / Time</dt>
            <dd>{booking.time_slot.replace("_", " ")}</dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold text-brand-dark">
            <dt>Total</dt>
            <dd>{formatLKR(Number(booking.total_amount))}</dd>
          </div>
        </dl>

        <div className="mt-6 space-y-4">
          <PayNowButton bookingId={booking.id} />
          
          <div className="rounded-md border border-blue-100 bg-blue-50/30 p-3 text-xs text-blue-800">
            <span className="font-semibold block mb-0.5">Online Payment:</span>
            Payments are securely processed in LKR via the PayHere payment gateway.
          </div>
        </div>
      </div>
    </main>
  );
}
