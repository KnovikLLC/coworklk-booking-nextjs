"use client";

import { useEffect, useState } from "react";
import { Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmBankTransferButton } from "@/components/admin/ConfirmBankTransferButton";
import { StatusChangeMenu } from "@/components/admin/StatusChangeMenu";
import { formatLKR } from "@/lib/utils";
import { BOOKING_STATUS_VARIANT, bookingStatusLabel } from "@/lib/bookings/status";
import { toast } from "sonner";

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

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pending_payment", label: "Pending Payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No Show" },
];

// Doc §10.4 mockup.
export function BookingList() {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (dateFilter) params.set("date", dateFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);

    fetch(`/api/admin/bookings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setBookings(data.bookings ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => {
        setLoading(false);
        // Only clear once the refetched (post-update) rows have actually
        // landed, not just when the PATCH/POST itself resolves — otherwise
        // there's a window where the still-stale row re-enables its old
        // action buttons right before the refresh swaps them out, which is
        // exactly what let a fast double-tap fire two different actions.
        setUpdatingId(null);
      });
  }, [dateFilter, statusFilter, page, refreshKey]);

  async function updateStatus(id: string, newStatus: string) {
    if (updatingId) return; // already processing an action on some row
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update status");
        setUpdatingId(null);
        return;
      }
      toast.success(`Booking status updated to ${bookingStatusLabel(newStatus)}`);
      setRefreshKey((k) => k + 1); // clears updatingId once the refetch above lands
    } catch {
      toast.error("An error occurred while updating status");
      setUpdatingId(null);
    }
  }

  async function confirmQr(id: string, note: string) {
    if (updatingId) return;
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/payments/confirm-qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: id, note }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to confirm payment");
        setUpdatingId(null);
        return;
      }
      toast.success("Bank transfer payment confirmed");
      setRefreshKey((k) => k + 1); // clears updatingId once the refetch above lands
    } catch {
      toast.error("An error occurred while confirming payment");
      setUpdatingId(null);
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
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
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(dateFilter || statusFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFilter("");
                setStatusFilter("all");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/40" />
            <p className="font-medium text-brand-dark">No bookings found</p>
            <p className="text-sm text-muted-foreground">Try adjusting the date or status filters.</p>
          </div>
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
                  <TableCell className="capitalize">{b.slot.replace("_", " ")}</TableCell>
                  <TableCell>{formatLKR(b.total_amount)}</TableCell>
                  <TableCell>
                    <Badge variant={BOOKING_STATUS_VARIANT[b.status] ?? "outline"} className="capitalize">
                      {bookingStatusLabel(b.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {b.status === "pending_payment" && (
                        <ConfirmBankTransferButton
                          disabled={updatingId !== null}
                          onConfirm={(note) => confirmQr(b.id, note)}
                        />
                      )}
                      {(b.status === "confirmed" || b.status === "checked_in") && (
                        <StatusChangeMenu
                          currentStatus={b.status}
                          bookingNumber={b.booking_number}
                          disabled={updatingId !== null}
                          onChange={(newStatus) => updateStatus(b.id, newStatus)}
                        />
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
      </CardContent>
    </Card>
  );
}
