import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const requireStaff = vi.fn();
const getAdminAvailabilityForDate = vi.fn();

vi.mock("@/lib/auth/require-staff", () => ({ requireStaff: (...args: unknown[]) => requireStaff(...args) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/bookings/availability", () => ({
  getAdminAvailabilityForDate: (...args: unknown[]) => getAdminAvailabilityForDate(...args),
}));

import { GET } from "@/app/api/admin/availability/route";

describe("GET /api/admin/availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaff.mockResolvedValue({ user: { id: "staff-1" }, role: "admin" });
    getAdminAvailabilityForDate.mockResolvedValue([]);
  });

  it("returns 401/403 when not staff", async () => {
    requireStaff.mockResolvedValue({ error: "Not authenticated", status: 401 });
    const res = await GET(new NextRequest("http://localhost/api/admin/availability"));
    expect(res.status).toBe(401);
    expect(getAdminAvailabilityForDate).not.toHaveBeenCalled();
  });

  it("defaults to today when no date param is given", async () => {
    const res = await GET(new NextRequest("http://localhost/api/admin/availability"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getAdminAvailabilityForDate).toHaveBeenCalledWith(expect.anything(), body.date);
  });

  it("passes through an explicit date param", async () => {
    await GET(new NextRequest("http://localhost/api/admin/availability?date=2026-08-15"));
    expect(getAdminAvailabilityForDate).toHaveBeenCalledWith(expect.anything(), "2026-08-15");
  });
});
