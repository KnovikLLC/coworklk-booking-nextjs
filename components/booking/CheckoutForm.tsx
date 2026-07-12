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
}: {
  space: SpaceDTO;
  pricing: SpacePricingDTO;
  date: string;
  slot: string;
  addons: AddonDTO[];
  userEmail: string | null;
}) {
  const router = useRouter();
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"qr_transfer" | "payhere">("qr_transfer");
  const [submitting, setSubmitting] = useState(false);

  const selectedAddons = useMemo(
    () => addons.filter((a) => selectedAddonIds.has(a.id)),
    [addons, selectedAddonIds]
  );
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const total = pricing.price + addonsTotal;

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
          ...(userEmail ? {} : { guest_name: guestName, guest_email: guestEmail, guest_phone: guestPhone }),
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
            <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <RadioGroupItem value="qr_transfer" id="qr_transfer" />
              QR / Bank Transfer
            </label>
            <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <RadioGroupItem value="payhere" id="payhere" />
              Card / PayHere
            </label>
          </RadioGroup>
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
              <dt className="text-muted-foreground">{durationLabel(pricing.duration)}</dt>
              <dd>{formatLKR(pricing.price)}</dd>
            </div>
            {selectedAddons.map((a) => (
              <div key={a.id} className="flex justify-between">
                <dt className="text-muted-foreground">{a.name}</dt>
                <dd>{formatLKR(a.price)}</dd>
              </div>
            ))}
          </dl>
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
