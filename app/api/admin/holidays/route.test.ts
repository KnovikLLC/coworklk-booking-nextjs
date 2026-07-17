import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";

const requireStaff = vi.fn();
let mock: ReturnType<typeof createSupabaseMock>;

vi.mock("@/lib/auth/require-staff", () => ({ requireStaff: (...args: unknown[]) => requireStaff(...args) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => mock.client }));

import { GET, POST } from "@/app/api/admin/holidays/route";

function makePostRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/holidays", { method: "POST", body: JSON.stringify(body) });
}

describe("/api/admin/holidays", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock = createSupabaseMock();
    requireStaff.mockResolvedValue({ user: { id: "staff-1" }, role: "admin" });
  });

  describe("GET", () => {
    it("returns 401/403 when not staff", async () => {
      requireStaff.mockResolvedValue({ error: "Not authorized", status: 403 });
      const res = await GET();
      expect(res.status).toBe(403);
    });

    it("returns the list of holidays ordered by date", async () => {
      mock.queue("holidays", {
        data: [{ id: "h1", date: "2026-08-15", reason: "Public holiday", created_at: "2026-07-01" }],
        error: null,
      });
      const res = await GET();
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.holidays).toHaveLength(1);
      expect(body.holidays[0].date).toBe("2026-08-15");
    });

    it("returns an empty array when there are no holidays", async () => {
      mock.queue("holidays", { data: null, error: null });
      const res = await GET();
      const body = await res.json();
      expect(body.holidays).toEqual([]);
    });
  });

  describe("POST", () => {
    it("rejects a missing/malformed date", async () => {
      const res = await POST(makePostRequest({ date: "15-08-2026" }));
      expect(res.status).toBe(400);
    });

    it("creates a holiday and stamps created_by from the staff session", async () => {
      mock.queue("holidays", { data: { id: "h1", date: "2026-08-15", reason: null, created_at: "2026-07-01" }, error: null });
      const res = await POST(makePostRequest({ date: "2026-08-15" }));
      expect(res.status).toBe(201);

      const insert = mock.insertCalls.find((c) => c.table === "holidays");
      expect(insert?.payload).toMatchObject({ date: "2026-08-15", created_by: "staff-1" });
    });

    it("returns 409 on a duplicate date (unique constraint violation)", async () => {
      mock.queue("holidays", { data: null, error: { code: "23505", message: "duplicate key value" } });
      const res = await POST(makePostRequest({ date: "2026-08-15" }));
      expect(res.status).toBe(409);
    });
  });
});
