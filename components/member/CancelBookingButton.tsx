"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CancelBookingButtonProps {
  bookingId: string;
  bookingNumber: string;
  status: string;
}

export function CancelBookingButton({
  bookingId,
  bookingNumber,
  status,
}: CancelBookingButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Cancellations are only allowed for confirmed or pending_payment bookings
  const canCancel = ["confirmed", "pending_payment"].includes(status);

  if (!canCancel) return null;

  async function handleCancel() {
    const confirmed = window.confirm(
      `Are you sure you want to cancel booking #${bookingNumber}? Depending on when the booking starts, a cancellation charge may apply.`
    );
    if (!confirmed) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "User cancelled via profile dashboard" }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to cancel booking");
        return;
      }

      if (data.refund && data.refund.amount > 0) {
        toast.success(
          `Booking cancelled. Refund of LKR ${data.refund.amount} calculated (${data.refund.percentage}% refund).`
        );
      } else {
        toast.success("Booking cancelled successfully.");
      }

      router.refresh();
    } catch {
      toast.error("An error occurred while trying to cancel the booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
      disabled={submitting}
      onClick={handleCancel}
    >
      {submitting ? "Cancelling..." : "Cancel"}
    </Button>
  );
}
