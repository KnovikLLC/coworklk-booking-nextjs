"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Holiday {
  id: string;
  date: string;
  reason: string | null;
  created_at: string | null;
}

export function HolidaysPanel() {
  const [holidays, setHolidays] = useState<Holiday[] | null>(null);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Holiday | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/holidays");
    const data = await res.json();
    setHolidays(data.holidays ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd() {
    if (!date) {
      toast.error("Please select a date.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, reason: reason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not add holiday");
        return;
      }
      toast.success(`${date} marked as a holiday`);
      setDate("");
      setReason("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/holidays/${pendingDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Could not remove holiday");
        return;
      }
      toast.success(`${pendingDelete.date} is bookable again`);
      setPendingDelete(null);
      load();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-brand-dark">Holidays</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-sm text-muted-foreground">
          Dates marked here block bookings for every space, site-wide.
        </p>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label htmlFor="holidayDate">Date</Label>
            <Input id="holidayDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <Label htmlFor="holidayReason">Reason (optional)</Label>
            <Input
              id="holidayReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Public holiday"
            />
          </div>
          <Button onClick={handleAdd} disabled={submitting}>
            {submitting ? "Adding..." : "Add Holiday"}
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {holidays === null ? (
            <>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </>
          ) : holidays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No holidays scheduled.</p>
          ) : (
            holidays.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                <div>
                  <span className="font-medium text-brand-dark">{h.date}</span>
                  {h.reason ? <span className="ml-2 text-muted-foreground">{h.reason}</span> : null}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPendingDelete(h)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove holiday on {pendingDelete?.date}?</AlertDialogTitle>
            <AlertDialogDescription>
              This date becomes bookable again immediately for all spaces.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              onClick={handleDelete}
            >
              {deleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
