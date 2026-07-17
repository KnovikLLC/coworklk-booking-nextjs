"use client";

import { cn, formatLKR } from "@/lib/utils";
import type { BookableOption } from "@/lib/bookings/slot-options";

export function SlotSelector({
  options,
  selected,
  onSelect,
}: {
  options: BookableOption[];
  selected: BookableOption | null;
  onSelect: (option: BookableOption) => void;
}) {
  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground">No pricing options for this space.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => {
        const isSelected =
          selected?.pricingId === option.pricingId && selected.timeSlot === option.timeSlot;

        return (
          <button
            key={`${option.pricingId}-${option.timeSlot}`}
            type="button"
            data-testid="slot-option"
            disabled={!option.available}
            onClick={() => onSelect(option)}
            className={cn(
              "flex flex-col items-start rounded-lg border p-3 text-left text-sm transition-colors",
              isSelected ? "border-brand ring-1 ring-brand" : "border-border hover:border-brand/60",
              !option.available && "cursor-not-allowed opacity-50"
            )}
          >
            <span className="font-medium text-brand-dark">{option.label}</span>
            <span className="mt-1 font-semibold text-brand-dark">{formatLKR(option.price)}</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {option.available ? `${option.remaining} available` : "Fully booked"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
