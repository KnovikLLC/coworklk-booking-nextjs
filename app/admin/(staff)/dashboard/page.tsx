import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaff } from "@/lib/auth/require-staff";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin Dashboard | Cowork.lk" };

interface DashboardActivity {
  id: string;
  type: "booking_created" | "booking_confirmed" | "booking_cancelled" | "payment_completed";
  timestamp: string;
  bookingNumber: string;
  description: string;
}

export default async function AdminDashboardPage() {
  const staff = await requireStaff();
  if ("error" in staff) {
    redirect("/admin/login");
  }

  const admin = createAdminClient();
  const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

  // 1. Fetch today's bookings
  const { data: todayBookingsRaw } = await admin
    .from("bookings")
    .select("id, booking_number, booking_date, time_slot, status, total_amount, guest_name, guest_email, spaces ( name, type ), users!bookings_user_id_fkey ( full_name, email )")
    .eq("booking_date", todayStr)
    .order("created_at", { ascending: false });

  const todayBookings = (todayBookingsRaw ?? []).map((b) => ({
    id: b.id,
    booking_number: b.booking_number,
    customer_name: b.guest_name ?? b.users?.full_name ?? "Customer",
    customer_email: b.guest_email ?? b.users?.email ?? null,
    space_name: b.spaces?.name ?? "Space",
    space_type: b.spaces?.type ?? null,
    date: b.booking_date,
    slot: b.time_slot,
    status: b.status ?? "pending_payment",
    total_amount: Number(b.total_amount),
  }));

  // 2. Fetch stats
  // Pending confirmations count across all bookings
  const { count: pendingCount } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_payment");

  // Today's revenue calculation
  const confirmedToday = todayBookings.filter((b) =>
    ["confirmed", "completed", "checked_in"].includes(b.status)
  );
  const todayRevenue = confirmedToday.reduce((sum, b) => sum + b.total_amount, 0);

  const stats = {
    todayBookingsCount: todayBookings.length,
    todayRevenue,
    pendingCount: pendingCount ?? 0,
  };

  // 3. Fetch Recent Activities (bookings created, and payments completed)
  const [recentBookingsRes, recentPaymentsRes] = await Promise.all([
    admin
      .from("bookings")
      .select("id, booking_number, created_at, status, total_amount, guest_name, users!bookings_user_id_fkey ( full_name )")
      .order("created_at", { ascending: false })
      .limit(5),
    admin
      .from("payments")
      .select("id, amount, method, paid_at, bookings ( booking_number, guest_name, users!bookings_user_id_fkey ( full_name ) )")
      .eq("status", "completed")
      .order("paid_at", { ascending: false })
      .limit(5),
  ]);

  const activities: DashboardActivity[] = [];

  if (recentBookingsRes.data) {
    recentBookingsRes.data.forEach((b) => {
      activities.push({
        id: `booking-${b.id}`,
        type: "booking_created",
        timestamp: b.created_at || new Date().toISOString(),
        bookingNumber: b.booking_number,
        description: `Booking submitted for ${b.guest_name ?? b.users?.full_name ?? "Guest"} (${Number(b.total_amount)} LKR)`,
      });
    });
  }

  if (recentPaymentsRes.data) {
    recentPaymentsRes.data.forEach((p) => {
      activities.push({
        id: `payment-${p.id}`,
        type: "payment_completed",
        timestamp: p.paid_at || new Date().toISOString(),
        bookingNumber: p.bookings?.booking_number ?? "N/A",
        description: `Payment of ${Number(p.amount)} LKR confirmed via ${p.method.replace("_", " ")}`,
      });
    });
  }

  // Sort activities by timestamp descending
  const recentActivities = activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="py-2">
      <DashboardOverview
        initialTodayBookings={todayBookings}
        stats={stats}
        recentActivities={recentActivities}
      />
    </div>
  );
}
