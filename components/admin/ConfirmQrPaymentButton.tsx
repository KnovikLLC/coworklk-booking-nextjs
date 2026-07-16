"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Replaces window.prompt() for the QR/bank payment confirmation note. */
export function ConfirmQrPaymentButton({
  onConfirm,
  variant = "outline",
  className,
  label = "Confirm QR Payment",
  disabled = false,
}: {
  onConfirm: (note: string) => void;
  variant?: ButtonProps["variant"];
  className?: string;
  label?: string;
  /** Disables the trigger, e.g. while another action on the same row is in flight. */
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSubmitting(false);
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant={variant} className={className} disabled={disabled}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm QR / Bank Payment</DialogTitle>
          <DialogDescription>
            Optionally add a note (e.g. a reference number) for this confirmation.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Confirmation note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          disabled={submitting}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            disabled={submitting}
            onClick={() => {
              if (submitting) return;
              setSubmitting(true);
              onConfirm(note);
              setOpen(false);
              setNote("");
            }}
          >
            {submitting ? "Confirming..." : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
