import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";

const getAvailabilityForRange = vi.fn();
let mock: ReturnType<typeof createSupabaseMock>;

vi.mock("@/lib/supabase/server", () => ({ createClient: () => mock.client }));
vi.mock("@/lib/bookings/availability", () => ({
  getAvailabilityForRange: (...args: unknown[]) => getAvailabilityForRange(...args),
}));

import { GET } from "@/app/api/availability/route";

describe("GET /api/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock = createSupabaseMock();
    getAvailabilityForRange.mockResolvedValue([{ date: "2026-08-01", slots: {}, is_holiday: false }]);
  });

  it("requires space_id", async () => {
    const res = await GET(new NextRequest("http://localhost/api/availability"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when the space doesn't exist or is inactive", async () => {
    mock.queue("spaces", { data: null, error: { message: "not found" } });
    const res = await GET(new NextRequest("http://localhost/api/availability?space_id=space-1"));
    expect(res.status).toBe(404);
  });

  it("passes the space's type through and defaults to a 14-day range", async () => {
    mock.queue("spaces", { data: { id: "space-1", type: "meeting_room" }, error: null });
    const res = await GET(new NextRequest("http://localhost/api/availability?space_id=space-1"));
    expect(res.status).toBe(200);
    expect(getAvailabilityForRange).toHaveBeenCalledWith(expect.anything(), "space-1", "meeting_room", expect.any(Date), 14);

    const body = await res.json();
    expect(body.space_id).toBe("space-1");
    expect(body.availability).toHaveLength(1);
  });

  it("requests a single day when a date param is given", async () => {
    mock.queue("spaces", { data: { id: "space-1", type: "meeting_room" }, error: null });
    await GET(new NextRequest("http://localhost/api/availability?space_id=space-1&date=2026-08-01"));
    expect(getAvailabilityForRange).toHaveBeenCalledWith(expect.anything(), "space-1", "meeting_room", expect.any(Date), 1);
  });
});
