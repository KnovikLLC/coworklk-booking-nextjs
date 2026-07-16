"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { bookingStatusLabel } from "@/lib/bookings/status";

// Same transitions the /api/admin/bookings/[id] endpoint accepts — this
// just consolidates the previously-separate Check-in / No Show / Complete
// buttons into one menu instead of adding any new capability.
const NEXT_STATUSES: Record<string, string[]> = {
  confirmed: ["checked_in", "no_show"],
  checked_in: ["completed"],
};

// Statuses that end the booking without it ever being fulfilled — worth a
// confirmation step before applying, unlike a routine Check-in/Complete.
const DESTRUCTIVE_STATUSES = new Set(["no_show"]);

export function StatusChangeMenu({
  currentStatus,
  bookingNumber,
  onChange,
  disabled = false,
}: {
  currentStatus: string;
  bookingNumber: string;
  onChange: (newStatus: string) => void;
  disabled?: boolean;
}) {
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const options = NEXT_STATUSES[currentStatus] ?? [];
  if (options.length === 0) return null;

  function handleSelect(status: string) {
    if (DESTRUCTIVE_STATUSES.has(status)) {
      setPendingStatus(status);
    } else {
      onChange(status);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline" disabled={disabled}>
            Change status
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {options.map((status) => (
            <DropdownMenuItem key={status} onClick={() => handleSelect(status)} className="capitalize">
              {bookingStatusLabel(status)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingStatus(null);
            setSubmitting(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Mark #{bookingNumber} as {pendingStatus ? bookingStatusLabel(pendingStatus) : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This marks the booking as a no-show. The customer will not be checked in for this slot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                if (submitting || !pendingStatus) return;
                setSubmitting(true);
                onChange(pendingStatus);
              }}
            >
              {submitting ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
