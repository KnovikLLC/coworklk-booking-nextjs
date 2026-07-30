"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatLKR } from "@/lib/utils";

interface InvoiceCandidate {
  invoice_id: string;
  invoice_number: string;
  status: string;
  total: number;
  date: string;
  reference_number: string | null;
}

export function MatchInvoiceDialog({
  bookingId,
  bookingNumber,
  onMatched,
  trigger,
}: {
  bookingId: string;
  bookingNumber: string;
  onMatched: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [results, setResults] = useState<InvoiceCandidate[]>([]);
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);

  async function runSearch(searchQuery?: string) {
    setLoading(true);
    setSearched(true);
    try {
      const params = searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : "";
      const res = await fetch(`/api/admin/bookings/${bookingId}/zoho-invoices${params}`);
      const data = await res.json();
      setResults(data.invoices ?? []);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setQuery("");
      setResults([]);
      setSearched(false);
      runSearch();
    }
  }

  async function handleLink(candidate: InvoiceCandidate) {
    if (linking) return;
    setLinking(candidate.invoice_id);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}/zoho-invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: candidate.invoice_id, invoice_number: candidate.invoice_number }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to link invoice");
        return;
      }
      toast.success(`Linked invoice ${candidate.invoice_number} to booking #${bookingNumber}`);
      setOpen(false);
      onMatched();
    } finally {
      setLinking(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Match invoice — #{bookingNumber}</DialogTitle>
          <DialogDescription>
            Search Zoho invoices by booking number or invoice number, then link the correct one.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="Search by booking or invoice number"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch(query || undefined);
            }}
          />
          <Button variant="outline" size="icon" onClick={() => runSearch(query || undefined)} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Searching...</p>
          ) : results.length === 0 && searched ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No matching invoices found. Try a different search term.
            </p>
          ) : (
            results.map((invoice) => (
              <div
                key={invoice.invoice_id}
                className="flex items-center justify-between rounded-md border p-3 text-sm"
              >
                <div>
                  <p className="font-medium text-brand-dark">{invoice.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {invoice.date} · {formatLKR(invoice.total)}
                    {invoice.reference_number ? ` · Ref: ${invoice.reference_number}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {invoice.status}
                  </Badge>
                  <Button size="sm" disabled={linking !== null} onClick={() => handleLink(invoice)}>
                    {linking === invoice.invoice_id ? "Linking..." : "Link"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
