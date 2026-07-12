import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthorizedBookingSummary } from "@/lib/data/bookings";
import { formatLKR } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { BANK_DETAILS } from "@/lib/payhere/config";
import { ConvertGuestPrompt } from "@/components/auth/ConvertGuestPrompt";

export const metadata = { title: "Booking Confirmed | Cowork.lk" };

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: { id?: string };
}) {
  if (!searchParams.id) redirect("/booking");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const result = await getAuthorizedBookingSummary(searchParams.id, user, supabase);
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
          <div className="mt-6 space-y-3">
            <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
              Your booking is reserved pending payment confirmation. Pay via bank transfer using the
              details below, or complete payment via PayHere from the checkout page. We&apos;ll email you
              once it&apos;s confirmed.
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
          </div>
        ) : null}

        {!user && summary.guest_email ? (
          <ConvertGuestPrompt email={summary.guest_email} bookingId={summary.id} />
        ) : null}
      </div>
    </main>
  );
}
