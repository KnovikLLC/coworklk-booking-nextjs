import { describe, it, expect } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";
import {
  slotKeysForSpaceType,
  getAvailabilityForRange,
  getAdminAvailabilityForDate,
} from "@/lib/bookings/availability";

describe("slotKeysForSpaceType", () => {
  it("returns the default slot set for a normal space type", () => {
    expect(slotKeysForSpaceType("meeting_room")).toEqual(["morning", "afternoon", "full_day", "unlimited"]);
  });

  it("returns lobby's reduced 1hr/2hr slot set", () => {
    expect(slotKeysForSpaceType("lobby")).toEqual(["1hr", "2hr"]);
  });
});

describe("getAvailabilityForRange", () => {
  it("builds one AvailabilityDay per date with per-slot availability from the RPC", async () => {
    const mock = createSupabaseMock();
    // meeting_room -> 4 slot keys: morning, afternoon, full_day, unlimited
    mock.queueRpc("check_availability", {
      data: [{ is_available: true, booked_count: 0, total_inventory: 1, is_holiday: false }],
      error: null,
    });
    mock.queueRpc("check_availability", {
      data: [{ is_available: false, booked_count: 1, total_inventory: 1, is_holiday: false }],
      error: null,
    });
    mock.queueRpc("check_availability", {
      data: [{ is_available: true, booked_count: 0, total_inventory: 1, is_holiday: false }],
      error: null,
    });
    mock.queueRpc("check_availability", {
      data: [{ is_available: true, booked_count: 0, total_inventory: 1, is_holiday: false }],
      error: null,
    });

    const days = await getAvailabilityForRange(
      mock.client as never,
      "space-1",
      "meeting_room",
      new Date("2026-08-01T00:00:00"),
      1
    );

    expect(days).toHaveLength(1);
    expect(days[0].date).toBe("2026-08-01");
    expect(days[0].slots.morning).toEqual({ available: true, remaining: 1 });
    expect(days[0].slots.afternoon).toEqual({ available: false, remaining: 0 });
    expect(days[0].is_holiday).toBe(false);
  });

  it("marks the whole day as a holiday if any slot's RPC row reports is_holiday", async () => {
    const mock = createSupabaseMock();
    for (let i = 0; i < 4; i++) {
      mock.queueRpc("check_availability", {
        data: [{ is_available: false, booked_count: 0, total_inventory: 1, is_holiday: i === 2 }],
        error: null,
      });
    }

    const days = await getAvailabilityForRange(
      mock.client as never,
      "space-1",
      "meeting_room",
      new Date("2026-08-01T00:00:00"),
      1
    );

    expect(days[0].is_holiday).toBe(true);
  });

  it("never returns a negative remaining count", async () => {
    const mock = createSupabaseMock();
    for (let i = 0; i < 4; i++) {
      mock.queueRpc("check_availability", {
        data: [{ is_available: false, booked_count: 5, total_inventory: 1, is_holiday: false }],
        error: null,
      });
    }

    const days = await getAvailabilityForRange(
      mock.client as never,
      "space-1",
      "meeting_room",
      new Date("2026-08-01T00:00:00"),
      1
    );

    expect(days[0].slots.morning.remaining).toBe(0);
  });
});

describe("getAdminAvailabilityForDate", () => {
  it("attaches the occupying booking to every overlapping slot and flags holidays", async () => {
    const mock = createSupabaseMock();
    mock.queue("spaces", {
      data: [{ id: "space-1", name: "5-Seater Meeting Room", type: "meeting_room", total_inventory: 1 }],
      error: null,
    });

    // Order: rpc(morning), rpc(afternoon), rpc(full_day), rpc(unlimited), then the bookings select.
    mock.queueRpc("check_availability", {
      data: [{ is_available: false, booked_count: 1, total_inventory: 1, is_holiday: false }],
      error: null,
    });
    mock.queueRpc("check_availability", {
      data: [{ is_available: false, booked_count: 1, total_inventory: 1, is_holiday: false }],
      error: null,
    });
    mock.queueRpc("check_availability", {
      data: [{ is_available: false, booked_count: 1, total_inventory: 1, is_holiday: false }],
      error: null,
    });
    mock.queueRpc("check_availability", {
      data: [{ is_available: true, booked_count: 0, total_inventory: 1, is_holiday: false }],
      error: null,
    });
    mock.queue("bookings", {
      data: [{ id: "booking-1", time_slot: "full_day", status: "confirmed", guest_name: "Jane Doe", users: null }],
      error: null,
    });

    const resources = await getAdminAvailabilityForDate(mock.client as never, "2026-08-01");

    expect(resources).toHaveLength(1);
    const resource = resources[0];
    expect(resource.is_holiday).toBe(false);
    // full_day booking overlaps every cell (morning/afternoon read through
    // full_day, and unlimited itself reads through full_day) per slotOverlaps.
    expect(resource.slots.morning.booking).toEqual({ id: "booking-1", customer: "Jane Doe", status: "confirmed" });
    expect(resource.slots.afternoon.booking?.id).toBe("booking-1");
    expect(resource.slots.full_day.booking?.id).toBe("booking-1");
    expect(resource.slots.unlimited.booking?.id).toBe("booking-1");
  });

  it("flags is_holiday true if any slot's RPC row reports a holiday", async () => {
    const mock = createSupabaseMock();
    mock.queue("spaces", {
      data: [{ id: "space-1", name: "Hot Desk", type: "hotdesk", total_inventory: 5 }],
      error: null,
    });
    for (let i = 0; i < 4; i++) {
      mock.queueRpc("check_availability", {
        data: [{ is_available: false, booked_count: 5, total_inventory: 5, is_holiday: true }],
        error: null,
      });
    }
    mock.queue("bookings", { data: [], error: null });

    const resources = await getAdminAvailabilityForDate(mock.client as never, "2026-08-01");
    expect(resources[0].is_holiday).toBe(true);
  });
});
