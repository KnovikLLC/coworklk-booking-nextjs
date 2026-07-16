"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlotSelector } from "@/components/booking/SlotSelector";
import { buildBookableOptions, type BookableOption } from "@/lib/bookings/slot-options";
import { formatLKR } from "@/lib/utils";
import type { AddonDTO, AvailabilityResponse, SpaceDTO } from "@/lib/types/domain";

import { useSearchParams } from "next/navigation";

export function CreateBookingForm({ spaces, addons }: { spaces: SpaceDTO[]; addons: AddonDTO[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramSpaceId = searchParams.get("space_id");
  const paramDate = searchParams.get("date");

  const [spaceId, setSpaceId] = useState(() => {
    if (paramSpaceId && spaces.some((s) => s.id === paramSpaceId)) {
      return paramSpaceId;
    }
    return spaces[0]?.id ?? "";
  });
  const [date, setDate] = useState(() => paramDate ?? format(new Date(), "yyyy-MM-dd"));

  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [selectedOption, setSelectedOption] = useState<BookableOption | null>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card_terminal" | "qr_transfer">("cash");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const space = spaces.find((s) => s.id === spaceId) ?? null;

  useEffect(() => {
    if (!spaceId || !date) return;
    setSelectedOption(null);
    fetch(`/api/availability?space_id=${spaceId}&date=${date}`)
      .then((res) => res.json())
      .then(setAvailability);
  }, [spaceId, date]);

  const options = useMemo(
    () => (space ? buildBookableOptions(space.pricing, availability?.availability[0]) : []),
    [space, availability]
  );

  const selectedAddons = addons.filter((a) => selectedAddonIds.has(a.id));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const total = (selectedOption?.price ?? 0) + addonsTotal;

  function toggleAddon(id: string) {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!space || !selectedOption || !name || !email || !phone) {
      toast.error("Please fill in resource, slot, and customer details.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_id: space.id,
          pricing_id: selectedOption.pricingId,
          date,
          slot: selectedOption.timeSlot,
          customer: { name, email, phone },
          addons: selectedAddons.map((a) => ({ addon_id: a.id, quantity: 1 })),
          payment_method: paymentMethod,
          payment_received: paymentMethod !== "qr_transfer",
          notes: notes || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not create booking");
        return;
      }

      toast.success(`Booking ${data.booking.booking_number} created`);
      router.push("/admin/bookings");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-dark">1. Select Resource &amp; Date</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Select value={spaceId} onValueChange={setSpaceId}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-dark">2. Select Slot</CardTitle>
        </CardHeader>
        <CardContent>
          <SlotSelector options={options} selected={selectedOption} onSelect={setSelectedOption} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-dark">3. Customer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="customerName">Name</Label>
              <Input id="customerName" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="customerEmail">Email</Label>
              <Input id="customerEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="customerPhone">Phone</Label>
              <Input id="customerPhone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {addons.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-dark">4. Add-ons (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {addons.map((addon) => (
                <label key={addon.id} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={selectedAddonIds.has(addon.id)} onCheckedChange={() => toggleAddon(addon.id)} />
                  {addon.name} ({formatLKR(addon.price)})
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-dark">5. Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(["cash", "card_terminal", "qr_transfer"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  paymentMethod === method
                    ? "border-brand bg-brand/10 font-medium text-brand-dark"
                    : "text-muted-foreground hover:border-brand-dark/20"
                }`}
              >
                {method === "cash" ? "Cash (Received)" : method === "card_terminal" ? "Card Terminal" : "QR Transfer (Pending)"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <span className="text-lg font-semibold text-brand-dark">Total: {formatLKR(total)}</span>
        <Button disabled={submitting} onClick={handleSubmit}>
          {submitting ? "Creating..." : "Create Booking"}
        </Button>
      </div>
    </div>
  );
}
