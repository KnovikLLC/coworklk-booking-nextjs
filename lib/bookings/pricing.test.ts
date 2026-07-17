import { describe, it, expect } from "vitest";
import { computeBookingTotals } from "@/lib/bookings/pricing";

describe("computeBookingTotals", () => {
  it("totals base price with no addons and no discount", () => {
    const totals = computeBookingTotals(5000, []);
    expect(totals).toEqual({
      base_amount: 5000,
      addons_amount: 0,
      discount_percent: 0,
      discount_amount: 0,
      total_amount: 5000,
    });
  });

  it("sums addon lines by unitPrice * quantity", () => {
    const totals = computeBookingTotals(5000, [
      { unitPrice: 500, quantity: 2 },
      { unitPrice: 1190, quantity: 3 },
    ]);
    expect(totals.addons_amount).toBe(500 * 2 + 1190 * 3);
    expect(totals.total_amount).toBe(5000 + 500 * 2 + 1190 * 3);
  });

  it("applies discount to base price only, never to addons", () => {
    const totals = computeBookingTotals(5000, [{ unitPrice: 1000, quantity: 1 }], 10);
    expect(totals.discount_amount).toBe(500); // 10% of 5000
    expect(totals.addons_amount).toBe(1000); // untouched by discount
    expect(totals.total_amount).toBe(5000 - 500 + 1000);
  });

  it("rounds the discount amount", () => {
    const totals = computeBookingTotals(3333, [], 10);
    expect(totals.discount_amount).toBe(Math.round(3333 * 0.1));
  });

  it("defaults discountPercent to 0 when omitted", () => {
    const totals = computeBookingTotals(1000, [{ unitPrice: 100, quantity: 1 }]);
    expect(totals.discount_percent).toBe(0);
    expect(totals.discount_amount).toBe(0);
  });

  it("handles workspace-count-multiplied base price (caller multiplies before calling)", () => {
    const workspaceCount = 3;
    const pricePerSeat = 1500;
    const totals = computeBookingTotals(pricePerSeat * workspaceCount, []);
    expect(totals.base_amount).toBe(4500);
  });
});
