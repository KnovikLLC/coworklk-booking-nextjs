"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Matches bookingAddonSchema's quantity bounds (1-20) — 0 here means "not
// added to the order" and is omitted from the submit payload by callers.
const MIN = 0;
const MAX = 20;

export function AddonQuantityStepper({
  quantity,
  onChange,
}: {
  quantity: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7"
        disabled={quantity <= MIN}
        onClick={() => onChange(Math.max(MIN, quantity - 1))}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-5 text-center text-sm font-medium">{quantity}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-7 w-7"
        disabled={quantity >= MAX}
        onClick={() => onChange(Math.min(MAX, quantity + 1))}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}
