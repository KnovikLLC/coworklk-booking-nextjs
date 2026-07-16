import { Inbox } from "lucide-react";
import { requireUser } from "@/lib/auth/require-user";
import { getUserBookings } from "@/lib/data/bookings";
import { BookingRow } from "@/components/member/BookingRow";
import { EmptyState } from "@/components/member/EmptyState";
import { CancelBookingButton } from "@/components/member/CancelBookingButton";

export const metadata = { title: "Booking History | Cowork.lk", robots: { index: false, follow: false } };

export default async function ProfileBookingsPage() {
  const { user, supabase } = await requireUser();
  const bookings = await getUserBookings(supabase, user.id);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">Booking History</h1>
      <p className="mb-6 text-sm text-brand-dark/50">
        {bookings.length} {bookings.length === 1 ? "booking" : "bookings"} in total
      </p>

      {bookings.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="You haven't made any bookings yet"
          description="Book a workspace, meeting room, or desk to see it here."
          ctaHref="/booking"
          ctaLabel="Book a Space"
        />
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <BookingRow
              key={b.id}
              booking={b}
              action={<CancelBookingButton bookingId={b.id} bookingNumber={b.booking_number} status={b.status} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
