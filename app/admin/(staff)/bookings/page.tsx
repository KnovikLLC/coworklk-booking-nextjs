import Link from "next/link";
import { BookingList } from "@/components/admin/BookingList";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Bookings | Cowork.lk Admin" };

export default function AdminBookingsPage() {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-dark">Bookings</h1>
        <Button asChild>
          <Link href="/admin/bookings/new">+ New Booking</Link>
        </Button>
      </div>
      <BookingList />
    </div>
  );
}
