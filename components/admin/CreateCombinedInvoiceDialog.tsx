"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatLKR } from "@/lib/utils";

interface SelectedBookingSummary {
  id: string;
  booking_number: string;
  total_amount: number;
  zoho_invoice_number: string | null;
}

export function CreateCombinedInvoiceDialog({
  bookings,
  onCreated,
}: {
  bookings: SelectedBookingSummary[];
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const alreadyInvoiced = bookings.filter((b) => b.zoho_invoice_number);
  const invoiceable = bookings.filter((b) => !b.zoho_invoice_number);
  const total = invoiceable.reduce((sum, b) => sum + b.total_amount, 0);

  async function handleCreate() {
    if (submitting || invoiceable.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_ids: bookings.map((b) => b.id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create invoice");
        return;
      }
      toast.success(`Invoice ${data.invoice_number} created for ${data.booking_ids.length} booking(s)`);
      setOpen(false);
      onCreated();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={bookings.length === 0}>
          {bookings.length} selected — Create Combined Invoice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create combined Zoho invoice</DialogTitle>
          <DialogDescription>
            Combines the selected bookings into a single invoice, billed to the first booking&apos;s
            customer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {invoiceable.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
              <span className="font-mono text-xs">{b.booking_number}</span>
              <span>{formatLKR(b.total_amount)}</span>
            </div>
          ))}
          {alreadyInvoiced.length > 0 ? (
            <p className="text-xs text-amber-600">
              {alreadyInvoiced.length} of the selected booking(s) already have an invoice and will be
              skipped: {alreadyInvoiced.map((b) => b.booking_number).join(", ")}.
            </p>
          ) : null}
          {invoiceable.length > 0 ? (
            <div className="flex items-center justify-between border-t pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>{formatLKR(total)}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Every selected booking already has an invoice — nothing to create.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button disabled={submitting || invoiceable.length === 0} onClick={handleCreate}>
            {submitting ? "Creating..." : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
