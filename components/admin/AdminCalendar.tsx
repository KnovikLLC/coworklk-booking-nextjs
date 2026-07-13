"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  startOfWeek,
  addDays,
  format,
  subWeeks,
  addWeeks,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatLKR } from "@/lib/utils";
import { toast } from "sonner";

interface Space {
  id: string;
  name: string;
  type: string;
  total_inventory: number;
  requires_specific_seat: boolean;
}

interface Booking {
  id: string;
  booking_number: string;
  space_id: string;
  space_name: string;
  space_type: string;
  date: string;
  slot: string;
  start_time: string | null;
  end_time: string | null;
  customer_name: string;
  customer_email: string | null;
  status: string;
  total_amount: number;
}

const STATUS_CLASSES: Record<string, string> = {
  confirmed: "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100",
  checked_in: "bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100",
  completed: "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200",
  pending_payment: "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100",
  cancelled: "bg-red-50 border-red-200 text-red-800 line-through hover:bg-red-100",
  no_show: "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100",
  expired: "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100",
};

const SLOT_LABELS: Record<string, string> = {
  morning: "Morning (8am-12pm)",
  afternoon: "Afternoon (12pm-4pm)",
  evening: "Evening (4pm-8pm)",
  night: "Night (8pm-12am)",
  full_day: "Full Day (8am-5pm)",
  unlimited: "Unlimited (8am-8pm)",
  "1hr": "1 Hour",
  "2hr": "2 Hours",
};

export function AdminCalendar() {
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [loading, setLoading] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availabilitySummary, setAvailabilitySummary] = useState<
    Record<string, Record<string, { used: number; total: number } | { booked: boolean }>>
  >({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  const startDateStr = format(weekDays[0], "yyyy-MM-dd");
  const endDateStr = format(weekDays[6], "yyyy-MM-dd");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/calendar?start_date=${startDateStr}&end_date=${endDateStr}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load calendar data");
        return res.json();
      })
      .then((data) => {
        setSpaces(data.spaces ?? []);
        setBookings(data.bookings ?? []);
        setAvailabilitySummary(data.availability_summary ?? {});
      })
      .catch((err) => {
        toast.error(err.message || "Failed to fetch calendar data");
      })
      .finally(() => setLoading(false));
  }, [startDateStr, endDateStr, refreshKey]);

  const handlePrevWeek = () => setCurrentWeekStart((d) => subWeeks(d, 1));
  const handleNextWeek = () => setCurrentWeekStart((d) => addWeeks(d, 1));
  const handleToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  async function updateBookingStatus(id: string, newStatus: string) {
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
      toast.success(`Booking status updated to ${newStatus.replace("_", " ")}`);
      setRefreshKey((k) => k + 1);
      // Update selected booking context
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status: newStatus });
      }
    } catch {
      toast.error("An error occurred");
    }
  }

  async function confirmQrPayment(id: string) {
    const note = window.prompt("Enter optional QR/bank confirmation note:");
    if (note === null) return; // User cancelled
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
      setRefreshKey((k) => k + 1);
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking({ ...selectedBooking, status: "confirmed" });
      }
    } catch {
      toast.error("An error occurred");
    }
  }

  return (
    <div className="space-y-6">
      {/* Calendar Controls */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrevWeek}>
            ← Prev Week
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextWeek}>
            Next Week →
          </Button>
        </div>
        <h2 className="text-lg font-semibold text-brand-dark">
          {format(weekDays[0], "MMMM d")} – {format(weekDays[6], "MMMM d, yyyy")}
        </h2>
        <div className="flex gap-2 text-xs">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border border-emerald-300 bg-emerald-100" /> Confirmed
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border border-blue-300 bg-blue-100" /> Checked-in
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border border-amber-300 bg-amber-100" /> Pending
          </span>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="w-48 border-r p-3 font-semibold text-brand-dark">Space</th>
                {weekDays.map((day) => (
                  <th key={day.toISOString()} className="border-r p-3 font-semibold text-brand-dark last:border-r-0">
                    <div className="text-xs text-muted-foreground">{format(day, "EEEE")}</div>
                    <div>{format(day, "MMM d")}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {spaces.map((space) => {
                return (
                  <tr key={space.id} className="border-b hover:bg-muted/5 last:border-b-0">
                    <td className="border-r p-3 font-medium text-brand-dark bg-muted/10">
                      <div>{space.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {space.requires_specific_seat ? "Single Inventory" : `Multi-Inventory (${space.total_inventory})`}
                      </div>
                    </td>

                    {weekDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const summary = availabilitySummary[dateStr]?.[space.type];

                      if (!space.requires_specific_seat) {
                        // Multi-inventory (used/total)
                        const multiSummary = summary as { used: number; total: number } | undefined;
                        const used = multiSummary?.used ?? 0;
                        const total = multiSummary?.total ?? space.total_inventory;
                        const percent = Math.min(100, (used / total) * 100);

                        return (
                          <td
                            key={dateStr}
                            className="relative border-r p-3 last:border-r-0 cursor-pointer hover:bg-brand/5 group"
                            onClick={() => router.push(`/admin/bookings/new?space_id=${space.id}&date=${dateStr}`)}
                            title="Click to create booking for this date"
                          >
                            <div className="flex items-center justify-between font-mono text-xs">
                              <span>{used} / {total} used</span>
                              <span className="hidden group-hover:inline text-[10px] text-brand font-sans font-medium">
                                + Book
                              </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  percent >= 100
                                    ? "bg-red-500"
                                    : percent >= 75
                                    ? "bg-amber-500"
                                    : "bg-brand"
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </td>
                        );
                      } else {
                        // Single inventory (meeting rooms, lobby)
                        const dayBookings = bookings.filter(
                          (b) => b.space_id === space.id && b.date === dateStr
                        );

                        return (
                          <td key={dateStr} className="border-r p-2 last:border-r-0 align-top min-h-[90px]">
                            <div className="space-y-1.5">
                              {dayBookings.map((b) => (
                                <div
                                  key={b.id}
                                  onClick={() => {
                                    setSelectedBooking(b);
                                    setDialogOpen(true);
                                  }}
                                  className={`cursor-pointer rounded border p-1.5 text-xs transition-colors shadow-sm ${
                                    STATUS_CLASSES[b.status] ?? "bg-gray-50 border-gray-200"
                                  }`}
                                >
                                  <div className="font-semibold truncate">{b.customer_name}</div>
                                  <div className="text-[10px] text-muted-foreground flex justify-between items-center mt-0.5">
                                    <span>
                                      {b.start_time && b.end_time
                                        ? `${b.start_time} - ${b.end_time}`
                                        : b.slot.replace("_", " ")}
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {dayBookings.length === 0 && (
                                <button
                                  onClick={() =>
                                    router.push(
                                      `/admin/bookings/new?space_id=${space.id}&date=${dateStr}`
                                    )
                                  }
                                  className="w-full text-left rounded border border-dashed border-emerald-300 bg-emerald-50/20 px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors flex items-center justify-between"
                                >
                                  <span>✅ FREE</span>
                                  <span className="text-[10px] opacity-60 font-semibold">+ Book</span>
                                </button>
                              )}
                            </div>
                          </td>
                        );
                      }
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between pr-6 text-brand-dark">
                  <span>Booking details</span>
                  <Badge className={
                    selectedBooking.status === "confirmed" ? "bg-emerald-600" :
                    selectedBooking.status === "checked_in" ? "bg-blue-600" :
                    selectedBooking.status === "pending_payment" ? "bg-amber-600" : "bg-gray-600"
                  }>
                    {selectedBooking.status.replace("_", " ")}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4 text-sm">
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-muted-foreground">Booking ID:</span>
                  <span className="col-span-2 font-mono">{selectedBooking.booking_number}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-muted-foreground">Customer:</span>
                  <span className="col-span-2">{selectedBooking.customer_name}</span>
                </div>
                {selectedBooking.customer_email && (
                  <div className="grid grid-cols-3 gap-1">
                    <span className="font-medium text-muted-foreground">Email:</span>
                    <span className="col-span-2 break-all">{selectedBooking.customer_email}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-muted-foreground">Space:</span>
                  <span className="col-span-2">{selectedBooking.space_name}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-muted-foreground">Date:</span>
                  <span className="col-span-2">{selectedBooking.date}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-muted-foreground">Slot / Hours:</span>
                  <span className="col-span-2">
                    {selectedBooking.start_time && selectedBooking.end_time
                      ? `${selectedBooking.start_time} - ${selectedBooking.end_time}`
                      : SLOT_LABELS[selectedBooking.slot] || selectedBooking.slot.replace("_", " ")}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <span className="font-medium text-muted-foreground">Total Paid:</span>
                  <span className="col-span-2 font-semibold text-brand-dark">
                    {formatLKR(selectedBooking.total_amount)}
                  </span>
                </div>
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-end">
                {selectedBooking.status === "pending_payment" && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => confirmQrPayment(selectedBooking.id)}
                  >
                    Confirm QR Payment
                  </Button>
                )}
                {selectedBooking.status === "confirmed" && (
                  <>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto"
                      onClick={() => updateBookingStatus(selectedBooking.id, "no_show")}
                    >
                      Mark No Show
                    </Button>
                    <Button
                      variant="default"
                      className="bg-brand hover:bg-brand/90 w-full sm:w-auto"
                      onClick={() => updateBookingStatus(selectedBooking.id, "checked_in")}
                    >
                      Check-in
                    </Button>
                  </>
                )}
                {selectedBooking.status === "checked_in" && (
                  <Button
                    variant="outline"
                    className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 w-full sm:w-auto"
                    onClick={() => updateBookingStatus(selectedBooking.id, "completed")}
                  >
                    Complete
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
