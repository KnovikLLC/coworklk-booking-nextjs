import { BookingList } from "@/components/admin/BookingList";

export const metadata = { title: "Bookings | Cowork.lk Admin" };

export default function AdminBookingsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-brand-dark">Bookings</h1>
      <BookingList />
    </div>
  );
}
