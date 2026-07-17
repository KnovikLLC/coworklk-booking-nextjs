import { describe, it, expect } from "vitest";
import { bookingStatusLabel, BOOKING_STATUS_VARIANT, BOOKING_SLOT_LABEL } from "@/lib/bookings/status";

const ALL_STATUSES = [
  "pending_payment",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
  "no_show",
  "expired",
];

describe("BOOKING_STATUS_VARIANT", () => {
  it("has a variant mapping for every known booking status", () => {
    for (const status of ALL_STATUSES) {
      expect(BOOKING_STATUS_VARIANT[status]).toBeDefined();
    }
  });

  it("only uses valid badge variants", () => {
    const validVariants = new Set(["default", "secondary", "destructive", "outline"]);
    for (const variant of Object.values(BOOKING_STATUS_VARIANT)) {
      expect(validVariants.has(variant)).toBe(true);
    }
  });
});

describe("bookingStatusLabel", () => {
  it("replaces underscores with spaces", () => {
    expect(bookingStatusLabel("pending_payment")).toBe("pending payment");
    expect(bookingStatusLabel("checked_in")).toBe("checked in");
  });

  it("leaves single-word statuses unchanged", () => {
    expect(bookingStatusLabel("confirmed")).toBe("confirmed");
  });
});

describe("BOOKING_SLOT_LABEL", () => {
  it("has labels for the core time slots", () => {
    for (const slot of ["morning", "afternoon", "evening", "night", "full_day", "unlimited"]) {
      expect(BOOKING_SLOT_LABEL[slot]).toBeDefined();
    }
  });
});
