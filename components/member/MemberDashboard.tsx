import Link from "next/link";
import { format, parseISO } from "date-fns";
import { formatLKR } from "@/lib/utils";
import type { BookingSummaryDTO } from "@/lib/types/domain";
import type { DiscountResult } from "@/lib/pricing/discount";

// Doc §8.8 mockup.
export function MemberDashboard({
  fullName,
  memberSince,
  totalBookings,
  totalSpent,
  discount,
  bookings,
}: {
  fullName: string | null;
  memberSince: string | null;
  totalBookings: number;
  totalSpent: number;
  discount: DiscountResult;
  bookings: BookingSummaryDTO[];
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const upcoming = bookings.filter(
    (b) => b.booking_date >= today && b.status !== "cancelled" && b.status !== "no_show"
  );
  const recent = bookings.filter((b) => b.booking_date < today || b.status === "completed").slice(0, 5);
  const daysRemaining =
    discount.eligible && discount.days_since_last !== null ? 30 - discount.days_since_last : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">👋 Welcome back{fullName ? `, ${fullName}` : ""}!</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase text-muted-foreground">Member Since</p>
          <p className="mt-1 font-semibold text-brand-dark">
            {memberSince ? format(parseISO(memberSince), "MMMM yyyy") : "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase text-muted-foreground">Total Bookings</p>
          <p className="mt-1 font-semibold text-brand-dark">{totalBookings}</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-xs uppercase text-muted-foreground">Total Spent</p>
          <p className="mt-1 font-semibold text-brand-dark">{formatLKR(totalSpent)}</p>
        </div>
      </div>

      {discount.eligible ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="font-semibold text-emerald-800">🎁 You have a 10% discount available!</p>
          <p className="mt-1 text-sm text-emerald-700">
            Your last booking was {discount.days_since_last} days ago. Book within the next{" "}
            {daysRemaining} days to keep your member discount.
          </p>
          <Link
            href="/booking"
            className="mt-3 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
          >
            Book Now &amp; Save 10%
          </Link>
        </div>
      ) : null}

      <div>
        <h2 className="mb-2 font-semibold text-brand-dark">Upcoming Bookings</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming bookings.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {upcoming.map((b) => (
              <li key={b.id} className="flex justify-between rounded-md border bg-white p-2">
                <span>
                  📅 {b.booking_date} | {b.space_name}
                </span>
                <span>{formatLKR(b.total_amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-brand-dark">Recent Bookings</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past bookings yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {recent.map((b) => (
              <li key={b.id} className="flex justify-between rounded-md border bg-white p-2">
                <span>
                  📅 {b.booking_date} | {b.space_name}
                </span>
                <span>
                  {formatLKR(b.total_amount)} · {b.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
