import { redirect } from "next/navigation";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { markBookingPaid } from "@/lib/bookings/payments";
import { createBookingInvoice } from "@/lib/zoho/create-booking-invoice";
import { getAuthorizedBookingSummary } from "@/lib/data/bookings";
import { formatLKR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BANK_DETAILS } from "@/lib/payhere/config";
import { ConvertGuestPrompt } from "@/components/auth/ConvertGuestPrompt";

export const metadata = { title: "Booking Confirmed | Cowork.lk" };

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { id?: string; session_id?: string };
}) {
  if (!searchParams.id) redirect("/booking");

  const { id, session_id } = searchParams;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (id && session_id) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_SECRET_KEY;
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey);
        const session = await stripe.checkout.sessions.retrieve(session_id);
        
        if (session.payment_status === "paid" && session.metadata?.bookingId === id) {
          const admin = createAdminClient();
          const { data: booking } = await admin
            .from("bookings")
            .select("id, total_amount, status")
            .eq("id", id)
            .single();
            
          if (booking && booking.status === "pending_payment") {
            const paidAmount = session.amount_total ? session.amount_total / 100 : Number(booking.total_amount);
            
            await markBookingPaid(admin, {
              bookingId: booking.id,
              amount: paidAmount,
              method: "stripe",
              gatewayTransactionId: (session.payment_intent as string) || session.id,
              gatewayResponse: session as unknown as import("@/lib/types/database.types").Json,
            });
            await createBookingInvoice(admin, booking.id);
          }
        }
      } catch (err) {
        console.error("[Stripe Session Verification failed]", err);
      }
    }
  }

  const result = await getAuthorizedBookingSummary(id, user, supabase);
  if ("error" in result) redirect("/booking");

  const { summary } = result;

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-xl border bg-white p-6">
        <h1 className="text-2xl font-bold text-brand-dark">
          {summary.status === "confirmed" ? "Booking Confirmed!" : "Booking Received"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">#{summary.booking_number}</p>

        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Space</dt>
            <dd>{summary.space_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Date</dt>
            <dd>{summary.booking_date}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              <Badge variant={summary.status === "confirmed" ? "default" : "secondary"}>
                {summary.status.replace("_", " ")}
              </Badge>
            </dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold text-brand-dark">
            <dt>Total</dt>
            <dd>{formatLKR(summary.total_amount)}</dd>
          </div>
        </dl>

        {summary.status === "pending_payment" ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Your booking is reserved pending payment confirmation. Please complete the bank transfer using the
              details below, and then **send a screenshot of the payment receipt via WhatsApp to +94 77 488 4040** along with your Booking Reference to confirm. We&apos;ll confirm your booking once verified.
            </p>
            
            <div className="rounded-md border p-3 text-sm">
              <h2 className="font-semibold text-brand-dark">Bank Transfer Details</h2>
              <dl className="mt-2 space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Bank</dt>
                  <dd>{BANK_DETAILS.bank_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Account Name</dt>
                  <dd>{BANK_DETAILS.account_name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Account Number</dt>
                  <dd>{BANK_DETAILS.account_number}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Branch</dt>
                  <dd>{BANK_DETAILS.branch}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="font-semibold">{summary.booking_number}</dd>
                </div>
              </dl>
            </div>

            <a
              href={`https://wa.me/94774884040?text=${encodeURIComponent(
                `Hi, here is the bank transfer payment receipt for my coworking booking.\n\nBooking Reference: ${summary.booking_number}\nSpace: ${summary.space_name}\nDate: ${summary.booking_date}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.451 5.463 0 9.909-4.444 9.912-9.91.002-2.65-1.02-5.139-2.877-6.998C16.643 1.838 14.156 1.8 11.514 1.8c-5.469 0-9.915 4.444-9.919 9.91-.001 1.745.459 3.447 1.336 4.965l-.982 3.582 3.698-.973zm12.67-5.761c-.322-.162-1.91-.942-2.206-1.05-.297-.109-.513-.162-.73.162-.216.324-.838 1.05-1.028 1.267-.19.216-.379.243-.702.08-.323-.162-1.362-.502-2.596-1.602-.96-.856-1.607-1.912-1.796-2.236-.19-.324-.02-.5-.181-.661-.146-.145-.323-.379-.485-.568-.162-.189-.216-.324-.324-.54-.108-.217-.054-.405-.027-.567.027-.162.216-.513.324-.676.108-.162.146-.27.217-.459.072-.189.036-.351-.018-.513-.054-.162-.513-1.242-.703-1.702-.186-.447-.372-.387-.513-.394-.132-.007-.284-.008-.436-.008s-.401.057-.61.286c-.21.229-.798.784-.798 1.91 0 1.127.818 2.217.932 2.37.114.153 1.61 2.458 3.901 3.45.545.235.97.375 1.302.48.548.174 1.047.15 1.442.09.44-.067 1.91-.78 2.18-1.536.27-.756.27-1.405.19-1.536-.082-.136-.298-.217-.62-.379z"/>
              </svg>
              Send Receipt via WhatsApp
            </a>
          </div>
        ) : null}

        {!user && summary.guest_email ? (
          <ConvertGuestPrompt email={summary.guest_email} bookingId={summary.id} />
        ) : null}
      </div>
    </main>
  );
}
