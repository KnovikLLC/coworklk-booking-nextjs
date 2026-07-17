"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SlotSelector } from "@/components/booking/SlotSelector";
import { AddonQuantityStepper } from "@/components/booking/AddonQuantityStepper";
import { buildBookableOptions, type BookableOption } from "@/lib/bookings/slot-options";
import { formatLKR } from "@/lib/utils";
import type { AddonDTO, AvailabilityResponse, SpaceDTO } from "@/lib/types/domain";
import { X } from "lucide-react";

import { useSearchParams } from "next/navigation";

interface OrderItem {
  key: string;
  spaceId: string;
  spaceName: string;
  date: string;
  option: BookableOption;
  addons: { id: string; name: string; price: number; quantity: number }[];
  itemTotal: number;
}

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
  const [addonQuantities, setAddonQuantities] = useState<Record<string, number>>({});
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
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

  // Addons can be scoped to one space (space_id set) or offered everywhere
  // (space_id null) — filter client-side on the already-loaded full list so
  // switching resources doesn't need a re-fetch.
  const availableAddons = addons.filter((a) => !a.space_id || a.space_id === spaceId);
  const selectedAddons = availableAddons
    .filter((a) => (addonQuantities[a.id] ?? 0) > 0)
    .map((a) => ({ ...a, quantity: addonQuantities[a.id] }));
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price * a.quantity, 0);
  const lineTotal = (selectedOption?.price ?? 0) + addonsTotal;
  const orderTotal = orderItems.reduce((sum, item) => sum + item.itemTotal, 0);

  function setAddonQuantity(id: string, quantity: number) {
    setAddonQuantities((prev) => ({ ...prev, [id]: quantity }));
  }

  function addToOrder() {
    if (!space || !selectedOption) {
      toast.error("Please select a resource and slot first.");
      return;
    }
    setOrderItems((prev) => [
      ...prev,
      {
        key: `${space.id}-${date}-${selectedOption.timeSlot}-${prev.length}`,
        spaceId: space.id,
        spaceName: space.name,
        date,
        option: selectedOption,
        addons: selectedAddons.map((a) => ({ id: a.id, name: a.name, price: a.price, quantity: a.quantity })),
        itemTotal: lineTotal,
      },
    ]);
    setSelectedOption(null);
    setAddonQuantities({});
  }

  function removeOrderItem(key: string) {
    setOrderItems((prev) => prev.filter((item) => item.key !== key));
  }

  async function handleSubmit() {
    if (orderItems.length === 0 || !name || !email || !phone) {
      toast.error("Add at least one item to the order and fill in customer details.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bookings/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: { name, email, phone },
          payment_method: paymentMethod,
          payment_received: paymentMethod !== "qr_transfer",
          items: orderItems.map((item) => ({
            space_id: item.spaceId,
            pricing_id: item.option.pricingId,
            date: item.date,
            slot: item.option.timeSlot,
            addons: item.addons.map((a) => ({ addon_id: a.id, quantity: a.quantity })),
            notes: notes || undefined,
          })),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not create booking");
        return;
      }

      toast.success(
        data.bookings.length > 1
          ? `${data.bookings.length} bookings created`
          : `Booking ${data.bookings[0].booking_number} created`
      );
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

      {availableAddons.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-dark">3. Add-ons (Optional)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {availableAddons.map((addon) => (
                <div key={addon.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <span>
                    {addon.name} <span className="text-muted-foreground">({formatLKR(addon.price)} each)</span>
                  </span>
                  <AddonQuantityStepper
                    quantity={addonQuantities[addon.id] ?? 0}
                    onChange={(next) => setAddonQuantity(addon.id, next)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between rounded-lg border bg-white p-4">
        <span className="text-sm text-muted-foreground">Item total: {formatLKR(lineTotal)}</span>
        <Button type="button" variant="outline" onClick={addToOrder}>
          Add to Order
        </Button>
      </div>

      {orderItems.length > 0 ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-brand-dark">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Space</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell>{item.spaceName}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="capitalize">{item.option.label}</TableCell>
                    <TableCell>{formatLKR(item.itemTotal)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => removeOrderItem(item.key)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-brand-dark">4. Customer Details</CardTitle>
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
                {method === "cash" ? "Cash (Received)" : method === "card_terminal" ? "Card Terminal" : "Bank Transfer (Pending)"}
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
        <span className="text-lg font-semibold text-brand-dark">Order Total: {formatLKR(orderTotal)}</span>
        <Button disabled={submitting || orderItems.length === 0} onClick={handleSubmit}>
          {submitting ? "Creating..." : "Create Booking"}
        </Button>
      </div>
    </div>
  );
}
