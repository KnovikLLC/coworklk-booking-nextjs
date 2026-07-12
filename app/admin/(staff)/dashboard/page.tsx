import { AvailabilityGrid } from "@/components/admin/AvailabilityGrid";

export const metadata = { title: "Admin Dashboard | Cowork.lk" };

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-brand-dark">Availability</h1>
      <AvailabilityGrid />
    </div>
  );
}
