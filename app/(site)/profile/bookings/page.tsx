import { requireUser } from "@/lib/auth/require-user";
import { getUserBookings } from "@/lib/data/bookings";
import { ProfileNav } from "@/components/member/ProfileNav";
import { Badge } from "@/components/ui/badge";
import { formatLKR } from "@/lib/utils";

import { CancelBookingButton } from "@/components/member/CancelBookingButton";

export const metadata = { title: "Booking History | Cowork.lk" };

export default async function ProfileBookingsPage() {
  const { user, supabase } = await requireUser();
  const bookings = await getUserBookings(supabase, user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <ProfileNav />
      <h1 className="mb-4 text-xl font-bold text-brand-dark">Booking History</h1>

      {bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven&apos;t made any bookings yet.</p>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border bg-white p-3 text-sm">
              <div>
                <p className="font-medium text-brand-dark">{b.space_name}</p>
                <p className="text-xs text-muted-foreground">
                  #{b.booking_number} · {b.booking_date} · {b.time_slot.replace("_", " ")}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-brand-dark">{formatLKR(b.total_amount)}</p>
                  <Badge variant={b.status === "confirmed" || b.status === "completed" ? "default" : "secondary"}>
                    {b.status.replace("_", " ")}
                  </Badge>
                </div>
                <CancelBookingButton bookingId={b.id} bookingNumber={b.booking_number} status={b.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
