import { AdminCalendar } from "@/components/admin/AdminCalendar";

export const metadata = { title: "Calendar | Cowork.lk Admin" };

export default function AdminCalendarPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-brand-dark">Calendar Scheduler</h1>
      <AdminCalendar />
    </div>
  );
}
