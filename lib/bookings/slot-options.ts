import type { AvailabilityDay } from "@/lib/types/domain";
import type { SpacePricingDTO } from "@/lib/types/domain";

// Maps pricing.duration (doc §3.2 CHECK constraint) to the bookings.time_slot
// enum value(s) it can produce. 'half_day' has no AM/PM distinction in the
// pricing table (one row, doc description "4hrs (8am-12pm or 12pm-4pm)"),
// so it expands into two selectable slot options at the same price.
export interface BookableOption {
  pricingId: string;
  timeSlot: string;
  label: string;
  price: number;
  includesDataGb: number;
  available: boolean;
  remaining: number;
}

const SLOT_LABELS: Record<string, string> = {
  morning: "Morning (8am - 12pm)",
  afternoon: "Afternoon (12pm - 4pm)",
  full_day: "Full Day (8am - 5pm)",
  unlimited: "Unlimited (8am - 8pm)",
  "1hr": "1 Hour",
  "2hr": "2 Hours",
  "30min": "30 Minutes",
};

function slotsForDuration(duration: string): string[] {
  if (duration === "half_day") return ["morning", "afternoon"];
  if (SLOT_LABELS[duration]) return [duration];
  return [];
}

export function buildBookableOptions(
  pricing: SpacePricingDTO[],
  availabilityDay: AvailabilityDay | undefined
): BookableOption[] {
  return pricing.flatMap((p) =>
    slotsForDuration(p.duration).map((timeSlot) => {
      const slotInfo = availabilityDay?.slots[timeSlot];
      return {
        pricingId: p.id,
        timeSlot,
        label: SLOT_LABELS[timeSlot] ?? timeSlot,
        price: p.price,
        includesDataGb: p.includes_data_gb,
        available: slotInfo?.available ?? false,
        remaining: slotInfo?.remaining ?? 0,
      };
    })
  );
}
