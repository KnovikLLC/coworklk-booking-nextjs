"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { redirectToPayhereCheckout } from "@/lib/payhere/redirect";

interface PayNowButtonProps {
  bookingId: string;
}

// Explicit tap, not an auto-submit-on-load: the /pay/[bookingId] link is
// typically opened from WhatsApp's in-app browser, where auto-submitting
// forms on load is unreliable across devices.
export function PayNowButton({ bookingId }: PayNowButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments/payhere/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to initiate PayHere payment");
      }
      redirectToPayhereCheckout(data.payhere_url, data.form_data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Could not initiate payment";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={loading}
      onClick={handlePay}
    >
      {loading ? "Redirecting to PayHere..." : "Pay Now with Card (PayHere)"}
    </Button>
  );
}
