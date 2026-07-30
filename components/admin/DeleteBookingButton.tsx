"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function DeleteBookingButton({
  bookingNumber,
  onConfirm,
  disabled = false,
}: {
  bookingNumber: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-label={`Delete booking ${bookingNumber}`}
      >
        <Trash2 className="h-4 w-4 text-red-600" />
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) {
            setOpen(false);
            setSubmitting(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete booking #{bookingNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the booking and cannot be undone. Any existing Zoho invoice
              is left untouched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitting}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
              onClick={() => {
                if (submitting) return;
                setSubmitting(true);
                onConfirm();
              }}
            >
              {submitting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
