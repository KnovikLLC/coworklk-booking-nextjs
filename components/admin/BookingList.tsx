"use client";

import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatLKR } from "@/lib/utils";

interface AdminBooking {
  id: string;
  booking_number: string;
  customer_name: string;
  space_name: string;
  date: string;
  slot: string;
  status: string;
  total_amount: number;
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

import { toast } from "sonner";

// Doc §10.4 mockup.
export function BookingList() {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (dateFilter) params.set("date", dateFilter);
    if (statusFilter) params.set("status", statusFilter);

    fetch(`/api/admin/bookings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [dateFilter, statusFilter, page, refreshKey]);

  async function updateStatus(id: string, newStatus: string) {
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
    } catch {
      toast.error("An error occurred while updating status");
    }
  }

  async function confirmQr(id: string) {
    const note = window.prompt("Enter optional QR/bank confirmation note:");
    if (note === null) return; // User cancelled prompt
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
    } catch {
      toast.error("An error occurred while confirming payment");
    }
  }


  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => {
            setDateFilter(e.target.value);
            setPage(1);
          }}
          className="w-40"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All Status</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
        {(dateFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDateFilter("");
              setStatusFilter("");
              setPage(1);
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : bookings.length === 0 ? (
        <p className="text-sm text-muted-foreground">No bookings found.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Space</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Slot</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell className="font-mono text-xs">{b.booking_number}</TableCell>
                <TableCell>{b.customer_name}</TableCell>
                <TableCell>{b.space_name}</TableCell>
                <TableCell>{b.date}</TableCell>
                <TableCell>{b.slot.replace("_", " ")}</TableCell>
                <TableCell>{formatLKR(b.total_amount)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[b.status] ?? "outline"}>{b.status.replace("_", " ")}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1.5">
                    {b.status === "pending_payment" && (
                      <Button size="sm" variant="outline" onClick={() => confirmQr(b.id)}>
                        Confirm QR
                      </Button>
                    )}
                    {b.status === "confirmed" && (
                      <>
                        <Button size="sm" variant="default" className="bg-brand hover:bg-brand/90" onClick={() => updateStatus(b.id, "checked_in")}>
                          Check-in
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => updateStatus(b.id, "no_show")}>
                          No Show
                        </Button>
                      </>
                    )}
                    {b.status === "checked_in" && (
                      <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50" onClick={() => updateStatus(b.id, "completed")}>
                        Complete
                      </Button>
                    )}
                    {!["pending_payment", "confirmed", "checked_in"].includes(b.status) && (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {total > limit ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= Math.ceil(total / limit)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
