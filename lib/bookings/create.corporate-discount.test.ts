// Separate file from create.test.ts because that file mocks
// @/lib/pricing/discount entirely (vi.mock is module-scoped per file) — this
// one deliberately uses the REAL checkMemberDiscount to prove the corporate
// discount is correctly wired end-to-end through createBooking's real
// pricing math, not just unit-tested in isolation.
import { describe, it, expect } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";
import { createBooking } from "@/lib/bookings/create";

const SPACE = { id: "space-1", type: "meeting_room", total_inventory: 1 };
const PRICING = { id: "pricing-1", price: 5000, space_id: "space-1", duration: "full_day" };

function setupHappyPath(mock: ReturnType<typeof createSupabaseMock>) {
  mock.queue("spaces", { data: SPACE, error: null });
  mock.queue("pricing", { data: PRICING, error: null });
  mock.queueRpc("check_availability", {
    data: [{ is_available: true, booked_count: 0, total_inventory: 1, is_holiday: false }],
    error: null,
  });
}

describe("createBooking — corporate discount end-to-end wiring", () => {
  it("applies the real 25% corporate discount to a guest booking with a @knovik.com email", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock);
    mock.queue("guest_profiles", { data: { id: "guest-1" }, error: null });
    mock.queue("bookings", {
      data: { id: "booking-1", booking_number: "CW260801-01", total_amount: 3750, status: "pending_payment" },
      error: null,
    });

    await createBooking(mock.client as never, {
      spaceId: "space-1",
      pricingId: "pricing-1",
      date: "2026-08-01",
      slot: "full_day",
      guestName: "Corporate Guest",
      guestEmail: "person@knovik.com",
      guestPhone: "0771234567",
    });

    const bookingInsert = mock.insertCalls.find((c) => c.table === "bookings");
    expect(bookingInsert?.payload).toMatchObject({
      base_amount: 5000,
      discount_percent: 25,
      discount_amount: 1250, // round(5000 * 0.25)
      discount_reason: "Corporate discount (knovik.com/knovik.eu)",
      total_amount: 3750, // 5000 - 1250
    });
  });

  it("applies no discount for a non-corporate guest email (regression: real path unchanged)", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock);
    mock.queue("guest_profiles", { data: { id: "guest-2" }, error: null });
    mock.queue("bookings", {
      data: { id: "booking-2", booking_number: "CW260801-02", total_amount: 5000, status: "pending_payment" },
      error: null,
    });

    await createBooking(mock.client as never, {
      spaceId: "space-1",
      pricingId: "pricing-1",
      date: "2026-08-01",
      slot: "full_day",
      guestName: "Regular Guest",
      guestEmail: "person@example.com",
      guestPhone: "0771234567",
    });

    const bookingInsert = mock.insertCalls.find((c) => c.table === "bookings");
    expect(bookingInsert?.payload).toMatchObject({
      base_amount: 5000,
      discount_percent: 0,
      discount_amount: 0,
      total_amount: 5000,
    });
  });
});
