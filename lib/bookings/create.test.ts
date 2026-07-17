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

import { createBooking, BookingError } from "@/lib/bookings/create";

const SPACE = { id: "space-1", type: "meeting_room", total_inventory: 1 };
const PRICING = { id: "pricing-1", price: 5000, space_id: "space-1", duration: "full_day" };

function availableRpcRow(overrides: Record<string, unknown> = {}) {
  return { is_available: true, booked_count: 0, total_inventory: 1, is_holiday: false, ...overrides };
}

function setupHappyPath(mock: ReturnType<typeof createSupabaseMock>, rpcRow = availableRpcRow()) {
  mock.queue("spaces", { data: SPACE, error: null });
  mock.queue("pricing", { data: PRICING, error: null });
  mock.queueRpc("check_availability", { data: [rpcRow], error: null });
}

describe("createBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a guest booking end to end", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock);
    mock.queue("guest_profiles", { data: { id: "guest-1" }, error: null });
    mock.queue("bookings", {
      data: { id: "booking-1", booking_number: "CW260801-01", total_amount: 5000, status: "pending_payment" },
      error: null,
    });

    const result = await createBooking(mock.client as never, {
      spaceId: "space-1",
      pricingId: "pricing-1",
      date: "2026-08-01",
      slot: "full_day",
      guestName: "Jane Doe",
      guestEmail: "jane@example.com",
      guestPhone: "0771234567",
    });

    expect(result).toEqual({
      id: "booking-1",
      booking_number: "CW260801-01",
      total_amount: 5000,
      status: "pending_payment",
    });

    const bookingInsert = mock.insertCalls.find((c) => c.table === "bookings");
    expect(bookingInsert?.payload).toMatchObject({
      space_id: "space-1",
      booking_type: "guest",
      status: "pending_payment",
      total_amount: 5000,
    });
  });

  it("creates a member booking without touching guest_profiles", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock);
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

    expect(mock.insertCalls.some((c) => c.table === "guest_profiles")).toBe(false);
    const bookingInsert = mock.insertCalls.find((c) => c.table === "bookings");
    expect(bookingInsert?.payload).toMatchObject({ user_id: "user-1", booking_type: "member" });
  });

  it("throws a holiday-specific 409 when the RPC reports is_holiday, before checking inventory", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock, availableRpcRow({ is_available: false, booked_count: 1, is_holiday: true }));

    await expect(
      createBooking(mock.client as never, {
        spaceId: "space-1",
        pricingId: "pricing-1",
        date: "2026-08-01",
        slot: "full_day",
        userId: "user-1",
      })
    ).rejects.toMatchObject({ status: 409, message: expect.stringContaining("holiday") });
  });

  it("throws a 409 when there is not enough remaining inventory", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock, availableRpcRow({ is_available: false, booked_count: 1, total_inventory: 1 }));

    await expect(
      createBooking(mock.client as never, {
        spaceId: "space-1",
        pricingId: "pricing-1",
        date: "2026-08-01",
        slot: "full_day",
        userId: "user-1",
      })
    ).rejects.toBeInstanceOf(BookingError);
  });

  it("throws a 400 when an addon id doesn't resolve to an active addon row", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock);
    mock.queue("addons", { data: [], error: null }); // requested 1 addon, got 0 back

    await expect(
      createBooking(mock.client as never, {
        spaceId: "space-1",
        pricingId: "pricing-1",
        date: "2026-08-01",
        slot: "full_day",
        userId: "user-1",
        addons: [{ addon_id: "addon-1", quantity: 2 }],
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("multiplies the base price by workspaceCount before totaling", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock, availableRpcRow({ total_inventory: 5 }));
    mock.queue("bookings", {
      data: { id: "booking-3", booking_number: "CW260801-03", total_amount: 15000, status: "pending_payment" },
      error: null,
    });

    await createBooking(mock.client as never, {
      spaceId: "space-1",
      pricingId: "pricing-1",
      date: "2026-08-01",
      slot: "full_day",
      userId: "user-1",
      workspaceCount: 3,
    });

    const bookingInsert = mock.insertCalls.find((c) => c.table === "bookings");
    expect(bookingInsert?.payload).toMatchObject({ base_amount: 15000, workspace_count: 3 });
  });

  it("passes bookingGroupId straight through onto the inserted row", async () => {
    const mock = createSupabaseMock();
    setupHappyPath(mock);
    mock.queue("bookings", {
      data: { id: "booking-4", booking_number: "CW260801-04", total_amount: 5000, status: "confirmed" },
      error: null,
    });

    await createBooking(mock.client as never, {
      spaceId: "space-1",
      pricingId: "pricing-1",
      date: "2026-08-01",
      slot: "full_day",
      userId: "user-1",
      markConfirmed: true,
      bookingGroupId: "group-abc",
    });

    const bookingInsert = mock.insertCalls.find((c) => c.table === "bookings");
    expect(bookingInsert?.payload).toMatchObject({ booking_group_id: "group-abc", status: "confirmed" });
  });

  it("throws a 404 when the space is not found or inactive", async () => {
    const mock = createSupabaseMock();
    mock.queue("spaces", { data: null, error: { message: "not found" } });

    await expect(
      createBooking(mock.client as never, {
        spaceId: "missing-space",
        pricingId: "pricing-1",
        date: "2026-08-01",
        slot: "full_day",
        userId: "user-1",
      })
    ).rejects.toMatchObject({ status: 404 });
  });
});
