"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ApplyDiscountDialog({
  bookingId,
  bookingNumber,
  onApplied,
  trigger,
}: {
  bookingId: string;
  bookingNumber: string;
  onApplied: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"details" | "code">("details");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setStep("details");
      setDiscountType("percent");
      setDiscountValue("");
      setDiscountReason("");
      setVerificationId(null);
      setCode("");
    }
  }

  async function handleRequestCode() {
    const value = Number(discountValue);
    if (!discountValue || Number.isNaN(value) || value <= 0) {
      toast.error("Enter a valid discount value");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/discounts/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_id: bookingId,
          discount_type: discountType,
          discount_value: value,
          discount_reason: discountReason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not request a discount code");
        return;
      }
      setVerificationId(data.verification_id);
      setStep("code");
      toast.success("A verification code was emailed for approval");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmCode() {
    if (!verificationId || code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification_id: verificationId, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not apply discount");
        return;
      }
      toast.success(`Discount applied to booking #${bookingNumber}`);
      setOpen(false);
      handleOpenChange(false);
      onApplied();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply discount — #{bookingNumber}</DialogTitle>
          <DialogDescription>
            {step === "details"
              ? "A verification code will be emailed for approval before the discount is applied."
              : "Enter the 6-digit code that was emailed for approval. It is valid for 30 minutes."}
          </DialogDescription>
        </DialogHeader>

        {step === "details" ? (
          <div className="space-y-3">
            <div>
              <Label htmlFor="discountType">Discount type</Label>
              <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percent" | "amount")}>
                <SelectTrigger id="discountType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage</SelectItem>
                  <SelectItem value="amount">Fixed amount (LKR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="discountValue">{discountType === "percent" ? "Percent off" : "Amount off (LKR)"}</Label>
              <Input
                id="discountValue"
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="discountReason">Reason (optional)</Label>
              <Input
                id="discountReason"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder="e.g. Goodwill gesture"
              />
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="verificationCode">Verification code</Label>
            <Input
              id="verificationCode"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              className="text-center text-lg tracking-[0.5em]"
              maxLength={6}
            />
          </div>
        )}

        <DialogFooter>
          {step === "details" ? (
            <Button onClick={handleRequestCode} disabled={submitting}>
              {submitting ? "Sending..." : "Send code"}
            </Button>
          ) : (
            <Button onClick={handleConfirmCode} disabled={submitting}>
              {submitting ? "Applying..." : "Confirm & apply"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
