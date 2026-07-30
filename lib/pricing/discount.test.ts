import { describe, it, expect } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";
import { checkMemberDiscount } from "@/lib/pricing/discount";

describe("checkMemberDiscount — corporate discount", () => {
  it("gives a guest booking with a @knovik.com email 25% off, no DB lookups needed", async () => {
    const mock = createSupabaseMock();
    const result = await checkMemberDiscount(mock.client as never, null, "person@knovik.com", 1000);
    expect(result).toEqual({
      eligible: true,
      discount_percent: 25,
      discount_amount: 250,
      reason: "Corporate discount (knovik.com/knovik.eu)",
      last_booking_date: null,
      days_since_last: null,
    });
  });

  it("gives a guest booking with a @knovik.eu email 25% off", async () => {
    const mock = createSupabaseMock();
    const result = await checkMemberDiscount(mock.client as never, null, "person@knovik.eu", 2000);
    expect(result.eligible).toBe(true);
    expect(result.discount_percent).toBe(25);
    expect(result.discount_amount).toBe(500);
  });

  it("gives a logged-in user 25% off when their own account email is on a corporate domain", async () => {
    const mock = createSupabaseMock();
    mock.queue("users", { data: { role: "member", email: "staffer@knovik.com" }, error: null });
    const result = await checkMemberDiscount(mock.client as never, "user-1", null, 1000);
    expect(result.eligible).toBe(true);
    expect(result.discount_percent).toBe(25);
  });

  it("prioritizes the corporate discount over an otherwise-eligible loyalty discount", async () => {
    const mock = createSupabaseMock();
    // Even though this user would also qualify for the 10% loyalty discount
    // (recent booking), the corporate match short-circuits before that
    // lookup ever runs — queue no "bookings" response to prove it's unused.
    const result = await checkMemberDiscount(mock.client as never, null, "person@knovik.com", 1000);
    expect(result.discount_percent).toBe(25);
  });

  it("is case-insensitive and ignores lookalike domains", async () => {
    const mock = createSupabaseMock();
    const upper = await checkMemberDiscount(mock.client as never, null, "person@KNOVIK.COM", 1000);
    expect(upper.discount_percent).toBe(25);

    mock.queue("users", { data: null, error: null }); // no user, not corporate -> falls through
    const lookalike = await checkMemberDiscount(mock.client as never, null, "person@notknovik.com", 1000);
    expect(lookalike.discount_percent).toBe(0);
  });

  it("non-corporate guest emails fall through to the existing 'no discount for guests without a user' behavior", async () => {
    const mock = createSupabaseMock();
    const result = await checkMemberDiscount(mock.client as never, null, "person@example.com", 1000);
    expect(result).toEqual({
      eligible: false,
      discount_percent: 0,
      discount_amount: 0,
      reason: null,
      last_booking_date: null,
      days_since_last: null,
    });
  });

  it("non-corporate logged-in user still gets the existing loyalty-discount behavior unchanged", async () => {
    const mock = createSupabaseMock();
    mock.queue("users", { data: { role: "member", email: "person@example.com" }, error: null });
    mock.queue("bookings", { data: { booking_date: new Date().toISOString().split("T")[0] }, error: null });
    const result = await checkMemberDiscount(mock.client as never, "user-1", null, 1000);
    expect(result.discount_percent).toBe(10);
    expect(result.reason).toContain("loyalty");
  });

  it("staff accounts (admin/frontdesk) still get no discount when not on a corporate domain", async () => {
    const mock = createSupabaseMock();
    mock.queue("users", { data: { role: "admin", email: "admin@example.com" }, error: null });
    const result = await checkMemberDiscount(mock.client as never, "user-1", null, 1000);
    expect(result.eligible).toBe(false);
    expect(result.reason).toContain("Staff accounts");
  });
});
