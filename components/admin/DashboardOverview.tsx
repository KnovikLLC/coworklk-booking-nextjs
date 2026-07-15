"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatLKR } from "@/lib/utils";
import {
  Calendar,
  DollarSign,
  Clock,
  XCircle,
  PlusCircle,
  Activity,
  Check,
  Zap,
  RefreshCw
} from "lucide-react";

interface DashboardBooking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_email: string | null;
  space_name: string;
  space_type: string | null;
  date: string;
  slot: string;
  status: string;
  total_amount: number;
}

interface DashboardStats {
  todayBookingsCount: number;
  todayRevenue: number;
  pendingCount: number;
}

interface DashboardActivity {
  id: string;
  type: "booking_created" | "booking_confirmed" | "booking_cancelled" | "payment_completed";
  timestamp: string;
  bookingNumber: string;
  description: string;
  metadata?: Record<string, unknown>;
}

interface DashboardOverviewProps {
  initialTodayBookings: DashboardBooking[];
  stats: DashboardStats;
  recentActivities: DashboardActivity[];
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  checked_in: "default",
  completed: "default",
  pending_payment: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
  expired: "outline",
};

const SLOT_LABEL: Record<string, string> = {
  morning: "Morning (8am-12pm)",
  afternoon: "Afternoon (12pm-4pm)",
  evening: "Evening (4pm-8pm)",
  night: "Night (8pm-12am)",
  full_day: "Full Day (8am-5pm)",
  unlimited: "Unlimited (8am-8pm)",
};

export function DashboardOverview({
  initialTodayBookings,
  stats,
  recentActivities,
}: DashboardOverviewProps) {
  const [todayBookings, setTodayBookings] = useState<DashboardBooking[]>(initialTodayBookings);
  const [currentStats, setCurrentStats] = useState<DashboardStats>(stats);
  const [refreshing, setRefreshing] = useState(false);

  // Helper to refresh page data
  async function refreshDashboard() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/bookings?limit=100");
      const data = await res.json();
      if (res.ok) {
        // Filter today's bookings
        const todayStr = new Date().toLocaleDateString("en-CA");
        const filtered = (data.bookings ?? []).filter((b: DashboardBooking) => b.date === todayStr);
        setTodayBookings(filtered);

        // Recalculate basic stats on the fly
        const pending = (data.bookings ?? []).filter((b: DashboardBooking) => b.status === "pending_payment").length;
        const confirmedToday = filtered.filter((b: DashboardBooking) =>
          ["confirmed", "completed", "checked_in"].includes(b.status)
        );
        const revenue = confirmedToday.reduce((sum: number, b: DashboardBooking) => sum + Number(b.total_amount), 0);

        setCurrentStats({
          todayBookingsCount: filtered.length,
          todayRevenue: revenue,
          pendingCount: pending,
        });
        toast.success("Dashboard data refreshed");
      }
    } catch (err) {
      console.error("Dashboard refresh error:", err);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setRefreshing(false);
    }
  }

  // Confirm QR Payment
  async function handleConfirmQr(id: string) {
    const note = window.prompt("Enter optional QR/bank confirmation note:");
    if (note === null) return;
    try {
      const res = await fetch(`/api/admin/payments/confirm-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to confirm payment");
        return;
      }
      toast.success("QR/Bank payment confirmed");
      refreshDashboard();
    } catch {
      toast.error("An error occurred while confirming payment");
    }
  }

  // Update Booking Status (e.g. Check In, Complete)
  async function handleUpdateStatus(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update status");
        return;
      }
      toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
      refreshDashboard();
    } catch {
      toast.error("An error occurred while updating status");
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome / Refresh Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-brand-dark">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Operational overview for today&apos;s co-working slots.</p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshDashboard} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Today&apos;s Bookings */}
        <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-orange-50 p-3 text-brand">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Today&apos;s Bookings</p>
            <h3 className="text-2xl font-bold text-slate-800">{currentStats.todayBookingsCount}</h3>
          </div>
        </div>

        {/* Card 2: Today&apos;s Revenue */}
        <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className="rounded-lg bg-green-50 p-3 text-emerald-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Today&apos;s Revenue</p>
            <h3 className="text-2xl font-bold text-slate-800">{formatLKR(currentStats.todayRevenue)}</h3>
          </div>
        </div>

        {/* Card 3: Pending Confirmations */}
        <div className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className={`rounded-lg p-3 ${currentStats.pendingCount > 0 ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Confirmations</p>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-bold text-slate-800">{currentStats.pendingCount}</h3>
              {currentStats.pendingCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">Needs Review</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Today&apos;s Bookings (Takes 2/3 of space) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Today&apos;s Schedule</h2>
              <Badge variant="outline">
                {new Date().toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' })}
              </Badge>
            </div>

            {todayBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground/60" />
                <h4 className="mt-2 font-medium text-slate-700">No Bookings Today</h4>
                <p className="text-xs text-muted-foreground">New co-working space bookings will show up here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref / Space</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Slot</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {todayBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-800">{b.booking_number}</div>
                          <div className="text-xs text-muted-foreground">{b.space_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-700">{b.customer_name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{formatLKR(b.total_amount)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal text-xs">
                            {SLOT_LABEL[b.slot] || b.slot.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[b.status ?? ""] ?? "outline"}>
                            {(b.status ?? "pending").replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            {b.status === "pending_payment" && (
                              <Button size="sm" onClick={() => handleConfirmQr(b.id)}>
                                Confirm QR
                              </Button>
                            )}
                            {b.status === "confirmed" && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(b.id, "checked_in")}>
                                Check In
                              </Button>
                            )}
                            {b.status === "checked_in" && (
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleUpdateStatus(b.id, "completed")}>
                                Complete
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Activities & Actions (Takes 1/3 of space) */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Quick Actions</h2>
            <div className="grid gap-2">
              <Button asChild className="w-full justify-start text-left">
                <a href="/admin/bookings">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  New Reservation
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start text-left">
                <a href="/admin/calendar">
                  <Calendar className="mr-2 h-4 w-4" />
                  View Schedule Calendar
                </a>
              </Button>
            </div>
          </div>

          {/* Recent Operations Activity */}
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-slate-800">
              <Activity className="h-5 w-5 text-brand" />
              <h2 className="text-lg font-semibold">Recent Activities</h2>
            </div>

            {recentActivities.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No recent activities logged.</p>
            ) : (
              <div className="relative border-l border-slate-100 pl-4 space-y-5">
                {recentActivities.map((act) => {
                  let Icon = Clock;
                  let iconColor = "text-slate-400 bg-slate-50";

                  if (act.type === "booking_created") {
                    Icon = Zap;
                    iconColor = "text-blue-500 bg-blue-50";
                  } else if (act.type === "booking_confirmed" || act.type === "payment_completed") {
                    Icon = Check;
                    iconColor = "text-green-500 bg-green-50";
                  } else if (act.type === "booking_cancelled") {
                    Icon = XCircle;
                    iconColor = "text-red-500 bg-red-50";
                  }

                  return (
                    <div key={act.id} className="relative text-xs">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[27px] mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-white ${iconColor}`}>
                        <Icon className="h-3 w-3" />
                      </span>
                      <div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span className="font-semibold text-slate-700">{act.bookingNumber}</span>
                          <span>
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-slate-600 leading-relaxed">{act.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
