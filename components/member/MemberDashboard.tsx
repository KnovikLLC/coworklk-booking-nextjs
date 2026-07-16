import Link from "next/link";
import { format, parseISO } from "date-fns";
import { CalendarDays, History, Wallet, Gift, CalendarX, Inbox, ArrowRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { BookingRow } from "@/components/member/BookingRow";
import { EmptyState } from "@/components/member/EmptyState";
import { formatLKR } from "@/lib/utils";
import type { BookingSummaryDTO } from "@/lib/types/domain";
import type { DiscountResult } from "@/lib/pricing/discount";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MemberDashboard({
  email,
  fullName,
  memberSince,
  totalBookings,
  totalSpent,
  discount,
  bookings,
}: {
  email: string;
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

  const displayName = fullName || email.split("@")[0] || "there";

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14 border border-brand-dark/10">
          <AvatarFallback className="bg-brand text-lg font-bold text-white">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Welcome back, {displayName}</h1>
          <p className="text-sm text-brand-dark/50">
            {memberSince ? `Member since ${format(parseISO(memberSince), "MMMM yyyy")}` : email}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-dark/50">Member Since</p>
              <p className="mt-0.5 font-semibold text-brand-dark">
                {memberSince ? format(parseISO(memberSince), "MMMM yyyy") : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <History className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-dark/50">Total Bookings</p>
              <p className="mt-0.5 font-semibold text-brand-dark">{totalBookings}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-dark/50">Total Spent</p>
              <p className="mt-0.5 font-semibold text-brand-dark">{formatLKR(totalSpent)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {discount.eligible ? (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Gift className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
              <div>
                <p className="font-semibold text-emerald-800">You have a 10% discount available!</p>
                <p className="mt-0.5 text-sm text-emerald-700">
                  Your last booking was {discount.days_since_last} days ago. Book within the next{" "}
                  {daysRemaining} days to keep your member discount.
                </p>
              </div>
            </div>
            <Link
              href="/booking"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
            >
              Book Now &amp; Save 10%
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-brand-dark">Upcoming Bookings</h2>
          {upcoming.length > 0 && (
            <Link href="/profile/bookings" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          )}
        </div>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="No upcoming bookings"
            description="When you book a space, it'll show up here."
            ctaHref="/booking"
            ctaLabel="Book a Space"
          />
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-brand-dark">Recent Bookings</h2>
          {recent.length > 0 && (
            <Link href="/profile/bookings" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState icon={Inbox} title="No past bookings yet" description="Your booking history will appear here." />
        ) : (
          <div className="space-y-2">
            {recent.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
