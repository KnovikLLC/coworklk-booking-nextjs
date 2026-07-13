"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { SlotSelector } from "@/components/booking/SlotSelector";
import { buildBookableOptions, type BookableOption } from "@/lib/bookings/slot-options";
import type { AvailabilityResponse, SpaceDTO } from "@/lib/types/domain";
import { formatLKR } from "@/lib/utils";

export function BookingWidget({ space }: { space: SpaceDTO }) {
  const router = useRouter();
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedOption, setSelectedOption] = useState<BookableOption | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/availability?space_id=${space.id}`)
      .then((res) => res.json())
      .then((data: AvailabilityResponse) => setAvailability(data))
      .finally(() => setLoading(false));
  }, [space.id]);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedDay = availability?.availability.find((d) => d.date === selectedDateStr);

  const options = useMemo(
    () => buildBookableOptions(space.pricing, selectedDay),
    [space.pricing, selectedDay]
  );

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelectedOption(null);
  }

  function handleContinue() {
    if (!selectedOption) return;
    const params = new URLSearchParams({
      space_id: space.id,
      pricing_id: selectedOption.pricingId,
      date: selectedDateStr,
      slot: selectedOption.timeSlot,
      remaining: selectedOption.remaining.toString(),
    });
    router.push(`/booking/checkout?${params.toString()}`);
  }

  return (
    <>
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-semibold text-brand-dark">Select a date</h2>
        {loading || !availability ? (
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-16" />
            ))}
          </div>
        ) : (
          <AvailabilityCalendar
            days={availability.availability}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
        )}

        <h2 className="mb-3 mt-6 font-semibold text-brand-dark">Select a time slot</h2>
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <SlotSelector options={options} selected={selectedOption} onSelect={setSelectedOption} />
        )}

        <button
          type="button"
          disabled={!selectedOption}
          onClick={handleContinue}
          className="mt-6 w-full rounded-md bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Continue to Checkout
        </button>
      </div>

      {/* Sticky Mobile Booking Bar */}
      {selectedOption && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand/20 bg-white/95 backdrop-blur p-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Selected Slot</p>
              <p className="text-sm font-semibold text-brand-dark truncate">{selectedOption.label}</p>
              <p className="text-xs font-bold text-brand">{formatLKR(selectedOption.price)}</p>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              className="flex-shrink-0 rounded-md bg-brand px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-brand/90 transition-colors"
            >
              Book Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
