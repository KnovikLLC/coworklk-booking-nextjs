import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";

const requireStaff = vi.fn();
let mock: ReturnType<typeof createSupabaseMock>;

vi.mock("@/lib/auth/require-staff", () => ({ requireStaff: (...args: unknown[]) => requireStaff(...args) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => mock.client }));

import { DELETE } from "@/app/api/admin/holidays/[id]/route";

describe("DELETE /api/admin/holidays/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock = createSupabaseMock();
    requireStaff.mockResolvedValue({ user: { id: "staff-1" }, role: "admin" });
  });

  it("returns 401/403 when not staff", async () => {
    requireStaff.mockResolvedValue({ error: "Not authenticated", status: 401 });
    const res = await DELETE(new Request("http://localhost"), { params: { id: "h1" } });
    expect(res.status).toBe(401);
  });

  it("deletes the holiday and returns success", async () => {
    mock.queue("holidays", { data: null, error: null });
    const res = await DELETE(new Request("http://localhost"), { params: { id: "h1" } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 on a delete error", async () => {
    mock.queue("holidays", { data: null, error: { message: "db error" } });
    const res = await DELETE(new Request("http://localhost"), { params: { id: "h1" } });
    expect(res.status).toBe(500);
  });
});
