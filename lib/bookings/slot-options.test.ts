import { describe, it, expect } from "vitest";
import { buildBookableOptions } from "@/lib/bookings/slot-options";
import type { AvailabilityDay, SpacePricingDTO } from "@/lib/types/domain";

function pricing(overrides: Partial<SpacePricingDTO> = {}): SpacePricingDTO {
  return {
    id: "pricing-1",
    duration: "full_day",
    slot_type: "full_day",
    price: 5000,
    description: null,
    includes_data_gb: 0,
    ...overrides,
  };
}

function availabilityDay(slots: AvailabilityDay["slots"] = {}): AvailabilityDay {
  return { date: "2026-08-01", slots, is_holiday: false };
}

describe("buildBookableOptions", () => {
  it("expands half_day duration into morning and afternoon options at the same price", () => {
    const options = buildBookableOptions([pricing({ id: "p1", duration: "half_day", price: 2000 })], undefined);
    expect(options).toHaveLength(2);
    expect(options.map((o) => o.timeSlot)).toEqual(["morning", "afternoon"]);
    expect(options.every((o) => o.price === 2000)).toBe(true);
    expect(options.every((o) => o.pricingId === "p1")).toBe(true);
  });

  it("maps other durations 1:1 to their slot", () => {
    const options = buildBookableOptions([pricing({ duration: "full_day" })], undefined);
    expect(options).toHaveLength(1);
    expect(options[0].timeSlot).toBe("full_day");
  });

  it("drops durations with no known slot mapping", () => {
    const options = buildBookableOptions([pricing({ duration: "monthly" })], undefined);
    expect(options).toHaveLength(0);
  });

  it("passes through availability and remaining from the matching AvailabilityDay slot", () => {
    const day = availabilityDay({ full_day: { available: true, remaining: 3 } });
    const options = buildBookableOptions([pricing({ duration: "full_day" })], day);
    expect(options[0].available).toBe(true);
    expect(options[0].remaining).toBe(3);
  });

  it("defaults to unavailable/zero remaining when there is no availability data for the slot", () => {
    const options = buildBookableOptions([pricing({ duration: "full_day" })], undefined);
    expect(options[0].available).toBe(false);
    expect(options[0].remaining).toBe(0);
  });

  it("flat-maps multiple pricing rows into a combined option list", () => {
    const options = buildBookableOptions(
      [pricing({ id: "p1", duration: "morning" }), pricing({ id: "p2", duration: "half_day" })],
      undefined
    );
    expect(options).toHaveLength(3); // 1 (morning) + 2 (half_day -> morning/afternoon)
  });
});
