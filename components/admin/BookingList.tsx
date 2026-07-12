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

// Doc §10.4 mockup.
export function BookingList() {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
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
  }, [dateFilter, statusFilter, page]);

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
