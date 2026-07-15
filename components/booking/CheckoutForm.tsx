"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatLKR } from "@/lib/utils";
import { durationLabel } from "@/lib/spaces";
import { redirectToPayhereCheckout } from "@/lib/payhere/redirect";
import type { AddonDTO, SpaceDTO, SpacePricingDTO } from "@/lib/types/domain";

const SLOT_LABELS: Record<string, string> = {
  morning: "Morning (8am - 12pm)",
  afternoon: "Afternoon (12pm - 4pm)",
  full_day: "Full Day (8am - 5pm)",
  unlimited: "Unlimited (8am - 8pm)",
  "1hr": "1 Hour",
  "2hr": "2 Hours",
  "30min": "30 Minutes",
};

export function CheckoutForm({
  space,
  pricing,
  date,
  slot,
  addons,
  userEmail,
  discount,
}: {
  space: SpaceDTO;
  pricing: SpacePricingDTO;
  date: string;
  slot: string;
  addons: AddonDTO[];
  userEmail: string | null;
  discount: { percent: number; amount: number; reason: string | null } | null;
}) {
  const router = useRouter();
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"qr_transfer" | "payhere" | "domain_verification">("payhere");
  const [submitting, setSubmitting] = useState(false);
  const [workspaceCount, setWorkspaceCount] = useState(1);

  // Corporate Domain Verification 2FA states
  const [verificationEmail, setVerificationEmail] = useState(userEmail ?? "");
  const [verificationCode, setVerificationCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  async function handleSendVerificationCode() {
    if (!verificationEmail || !verificationEmail.includes("@")) {
      toast.error("Please enter a valid corporate email address.");
      return;
    }
    setSendingCode(true);
    try {
      const res = await fetch("/api/auth/domain-verification/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verificationEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send verification code.");
        return;
      }
      setCodeSent(true);
      toast.success("Verification code sent! Please check your corporate email inbox.");
    } catch {
      toast.error("An error occurred while sending verification code.");
    } finally {
      setSendingCode(false);
    }
  }

  // Read remaining count from URL if present
  const remaining = useMemo(() => {
    if (typeof window === "undefined") return space.total_inventory;
    const params = new URLSearchParams(window.location.search);
    const rem = params.get("remaining");
    return rem ? Number(rem) : space.total_inventory;
  }, [space.total_inventory]);

  const maxAllowed = Math.min(space.total_inventory, remaining);

  const selectedAddons = useMemo(
    () => addons.filter((a) => selectedAddonIds.has(a.id)),
    [addons, selectedAddonIds]
  );
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const discountPercent = discount?.percent ?? 0;
  const discountAmount = Math.round((pricing.price * workspaceCount) * (discountPercent / 100));
  const total = (pricing.price * workspaceCount) - discountAmount + addonsTotal;

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!userEmail && (!guestName || !guestEmail || !guestPhone)) {
      toast.error("Please fill in your name, email, and phone number.");
      return;
    }

    if (paymentMethod === "domain_verification") {
      if (!verificationEmail || !verificationCode) {
        toast.error("Please enter your corporate email and the 2FA verification code.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: space.id,
          pricing_id: pricing.id,
          date,
          slot,
          addons: selectedAddons.map((a) => ({ addon_id: a.id, quantity: 1 })),
          payment_method: paymentMethod,
          workspace_count: workspaceCount,
          ...(userEmail ? {} : { guest_name: guestName, guest_email: guestEmail, guest_phone: guestPhone }),
          ...(paymentMethod === "domain_verification"
            ? { verification_email: verificationEmail, verification_code: verificationCode }
            : {}),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not create booking");
        return;
      }

      const bookingId = data.booking.id as string;

      if (paymentMethod === "payhere") {
        const initiateRes = await fetch("/api/payments/payhere/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        const initiateData = await initiateRes.json();

        if (!initiateRes.ok) {
          toast.error(initiateData.error ?? "Could not start PayHere payment");
          router.push(`/booking/success?id=${bookingId}`);
          return;
        }

        redirectToPayhereCheckout(initiateData.payhere_url, initiateData.form_data);
        return;
      }

      router.push(`/booking/success?id=${bookingId}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        {!userEmail ? (
          <section>
            <h2 className="font-semibold text-brand-dark">Your Details</h2>
            <p className="text-xs text-muted-foreground">
              Have an account?{" "}
              <a href={`/login?redirect=/booking/checkout`} className="text-brand hover:underline">
                Sign in
              </a>{" "}
              for member discounts.
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <Label htmlFor="guestName">Full Name</Label>
                <Input id="guestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="guestEmail">Email</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="guestPhone">Phone</Label>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                />
              </div>
            </div>
          </section>
        ) : (
          <section>
            <h2 className="font-semibold text-brand-dark">Your Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">Booking as {userEmail}</p>
          </section>
        )}

        {space.total_inventory > 1 ? (
          <section className="rounded-lg border bg-slate-50/50 p-4">
            <h2 className="font-semibold text-brand-dark">Desks / Seats</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select how many workspaces or seats you would like to reserve.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Input
                id="workspaceCount"
                type="number"
                min={1}
                max={maxAllowed}
                value={workspaceCount}
                onChange={(e) => {
                  const val = Math.min(maxAllowed, Math.max(1, Number(e.target.value) || 1));
                  setWorkspaceCount(val);
                }}
                className="w-24 bg-white text-center font-semibold"
              />
              <span className="text-sm text-muted-foreground">
                (Up to {maxAllowed} available for this slot)
              </span>
            </div>
          </section>
        ) : null}

        {addons.length > 0 ? (
          <section>
            <h2 className="font-semibold text-brand-dark">Add-ons</h2>
            <div className="mt-3 space-y-2">
              {addons.map((addon) => (
                <label
                  key={addon.id}
                  className="flex cursor-pointer items-center justify-between rounded-md border p-3 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedAddonIds.has(addon.id)}
                      onCheckedChange={() => toggleAddon(addon.id)}
                    />
                    {addon.name}
                  </span>
                  <span className="text-muted-foreground">{formatLKR(addon.price)}</span>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="font-semibold text-brand-dark">Payment Method</h2>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
            className="mt-3 space-y-2"
          >
            <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="payhere" id="payhere" />
              Card Payment (PayHere)
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm hover:bg-slate-50 transition-colors">
              <RadioGroupItem value="qr_transfer" id="qr_transfer" />
              Bank Transfer
            </label>
            <label className="flex items-start gap-2 rounded-md border p-3 text-sm hover:bg-slate-50 transition-colors border-emerald-100 bg-emerald-50/10">
              <RadioGroupItem value="domain_verification" id="domain_verification" />
              <div className="flex flex-col">
                <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                  Domain Verification
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">Auto-Confirm</span>
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">Instant booking confirmation for pre-approved corporate domains</span>
              </div>
            </label>
          </RadioGroup>

          {paymentMethod === "domain_verification" && (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/20 p-4 space-y-3">
              <div>
                <Label htmlFor="verificationEmail" className="text-emerald-950 font-medium">Corporate Email</Label>
                <div className="mt-1.5 flex gap-2">
                  <Input
                    id="verificationEmail"
                    type="email"
                    placeholder="you@company.com"
                    value={verificationEmail}
                    onChange={(e) => setVerificationEmail(e.target.value)}
                    disabled={codeSent || sendingCode}
                    className="bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendVerificationCode}
                    disabled={sendingCode || !verificationEmail || !verificationEmail.includes("@")}
                    className="shrink-0 border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                  >
                    {sendingCode ? "Sending..." : codeSent ? "Resend Code" : "Send Code"}
                  </Button>
                </div>
              </div>

              {codeSent && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                  <Label htmlFor="verificationCode" className="text-emerald-950 font-medium">Verification Code (6-digit)</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className="mt-1.5 bg-white tracking-widest font-mono text-center text-lg font-bold"
                  />
                  <p className="mt-1 text-[11px] text-emerald-700">
                    Enter the 6-digit verification code sent to {verificationEmail}.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="font-semibold text-brand-dark">{space.name}</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Date</dt>
              <dd>{date}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Slot</dt>
              <dd>{SLOT_LABELS[slot] ?? slot}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{durationLabel(pricing.duration)} {workspaceCount > 1 ? `(x${workspaceCount})` : ""}</dt>
              <dd>{formatLKR(pricing.price * workspaceCount)}</dd>
            </div>
            {discount ? (
              <div className="flex justify-between text-emerald-600">
                <dt>Member discount ({discount.percent}%)</dt>
                <dd>-{formatLKR(discountAmount)}</dd>
              </div>
            ) : null}
            {selectedAddons.map((a) => (
              <div key={a.id} className="flex justify-between">
                <dt className="text-muted-foreground">{a.name}</dt>
                <dd>{formatLKR(a.price)}</dd>
              </div>
            ))}
          </dl>
          {discount ? (
            <p className="mt-2 rounded-md bg-emerald-50 p-2 text-xs text-emerald-700">
              🎁 You have a 10% member discount applied on this booking.
            </p>
          ) : null}
          <div className="mt-3 flex justify-between border-t pt-3 font-semibold text-brand-dark">
            <span>Total</span>
            <span>{formatLKR(total)}</span>
          </div>
          <Button className="mt-4 w-full" disabled={submitting} onClick={handleSubmit}>
            {submitting ? "Placing booking..." : "Confirm Booking"}
          </Button>
        </div>
      </div>
    </div>
  );
}
