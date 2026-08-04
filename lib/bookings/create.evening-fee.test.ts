import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";

vi.mock("@/lib/pricing/discount", () => ({
  checkMemberDiscount: vi.fn().mockResolvedValue({
    eligible: false,
    discount_percent: 0,
    discount_amount: 0,
    reason: null,
    last_booking_date: null,
    days_since_last: null,
  }),
}));

import { createBooking } from "@/lib/bookings/create";

const SPACE = { id: "space-1", type: "meeting_room", total_inventory: 1 };
const PRICING = { id: "pricing-1", price: 5000, space_id: "space-1", duration: "evening" };
const EVENING_FEE_ID = "evening-fee-addon";

function setupHappyPath(mock: ReturnType<typeof createSupabaseMock>, slot = "evening") {
  mock.queue("spaces", { data: SPACE, error: null });
  mock.queue("pricing", { data: { ...PRICING, duration: slot }, error: null });
  mock.queueRpc("check_availability", {
    data: [{ is_available: true, booked_count: 0, total_inventory: 1, is_holiday: false }],
    error: null,
  });
}

describe("createBooking — Evening Convenience Fee auto-attach", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("automatically attaches the LKR 500 evening fee when slot is 'evening'", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock, "evening");
    mock.queue("addons", { data: { id: EVENING_FEE_ID }, error: null }); // is_evening_fee lookup
    mock.queue("addons", { data: [{ id: EVENING_FEE_ID, price: 500 }], error: null }); // price lookup
    mock.queue("bookings", {
      data: { id: "booking-1", booking_number: "CW260801-01", total_amount: 5500, status: "pending_payment" },
      error: null,
    });

    await createBooking(mock.client as never, {
      spaceId: "space-1",
      pricingId: "pricing-1",
      date: "2026-08-01",
      slot: "evening",
      userId: "user-1",
    });

    const bookingInsert = mock.insertCalls.find((c) => c.table === "bookings");
    expect(bookingInsert?.payload).toMatchObject({ addons_amount: 500, total_amount: 5500 });

    const addonInsert = mock.insertCalls.find((c) => c.table === "booking_addons");
    expect(addonInsert?.payload).toEqual([
      { booking_id: "booking-1", addon_id: EVENING_FEE_ID, quantity: 1, unit_price: 500, total_price: 500 },
    ]);
  });

  it("does not attach the evening fee for any non-evening slot", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock, "full_day");
    mock.queue("bookings", {
      data: { id: "booking-2", booking_number: "CW260801-02", total_amount: 5000, status: "pending_payment" },
      error: null,
    });

    await createBooking(mock.client as never, {
      spaceId: "space-1",
      pricingId: "pricing-1",
      date: "2026-08-01",
      slot: "full_day",
      userId: "user-1",
    });

    expect(mock.insertCalls.some((c) => c.table === "booking_addons")).toBe(false);
    const bookingInsert = mock.insertCalls.find((c) => c.table === "bookings");
    expect(bookingInsert?.payload).toMatchObject({ addons_amount: 0, total_amount: 5000 });
  });

  it("does not duplicate the fee if the client already included it", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock, "evening");
    mock.queue("addons", { data: { id: EVENING_FEE_ID }, error: null }); // is_evening_fee lookup
    mock.queue("addons", { data: [{ id: EVENING_FEE_ID, price: 500 }], error: null }); // price lookup
    mock.queue("bookings", {
      data: { id: "booking-3", booking_number: "CW260801-03", total_amount: 5500, status: "pending_payment" },
      error: null,
    });

    await createBooking(mock.client as never, {
      spaceId: "space-1",
      pricingId: "pricing-1",
      date: "2026-08-01",
      slot: "evening",
      userId: "user-1",
      addons: [{ addon_id: EVENING_FEE_ID, quantity: 1 }],
    });

    const addonInsert = mock.insertCalls.find((c) => c.table === "booking_addons");
    expect(addonInsert?.payload).toHaveLength(1); // not duplicated
  });
});
