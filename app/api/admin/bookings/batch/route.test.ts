import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const requireStaff = vi.fn();
const createBooking = vi.fn();
const markBookingPaid = vi.fn();
const createGroupBookingInvoice = vi.fn();

vi.mock("@/lib/auth/require-staff", () => ({ requireStaff: (...args: unknown[]) => requireStaff(...args) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/bookings/create", async () => {
  const actual = await vi.importActual<typeof import("@/lib/bookings/create")>("@/lib/bookings/create");
  return { ...actual, createBooking: (...args: unknown[]) => createBooking(...args) };
});
vi.mock("@/lib/bookings/payments", () => ({ markBookingPaid: (...args: unknown[]) => markBookingPaid(...args) }));
vi.mock("@/lib/zoho/create-group-invoice", () => ({
  createGroupBookingInvoice: (...args: unknown[]) => createGroupBookingInvoice(...args),
}));

import { POST } from "@/app/api/admin/bookings/batch/route";
import { BookingError } from "@/lib/bookings/create";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/bookings/batch", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function validItem(overrides: Record<string, unknown> = {}) {
  return { space_id: VALID_UUID, pricing_id: VALID_UUID, date: "2026-08-01", slot: "morning", ...overrides };
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    customer: { name: "Jane Doe", email: "jane@example.com", phone: "0771234567" },
    payment_method: "cash",
    items: [validItem()],
    ...overrides,
  };
}

describe("POST /api/admin/bookings/batch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaff.mockResolvedValue({ user: { id: "staff-1" }, role: "admin" });
    createBooking.mockImplementation(async (_supabase, params) => ({
      id: `booking-${params.date}`,
      booking_number: `CW-${params.date}`,
      total_amount: 5000,
      status: params.markConfirmed ? "confirmed" : "pending_payment",
    }));
  });

  it("returns 401/403 when the caller is not staff", async () => {
    requireStaff.mockResolvedValue({ error: "Not authenticated", status: 401 });
    const res = await POST(makeRequest(validPayload()));
    expect(res.status).toBe(401);
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid payload", async () => {
    const res = await POST(makeRequest(validPayload({ items: [] })));
    expect(res.status).toBe(400);
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("creates every item with a shared booking_group_id and marks cash payments confirmed", async () => {
    const res = await POST(makeRequest(validPayload({ items: [validItem({ date: "2026-08-01" }), validItem({ date: "2026-08-02" })] })));
    expect(res.status).toBe(201);

    expect(createBooking).toHaveBeenCalledTimes(2);
    const groupIds = createBooking.mock.calls.map((c) => c[1].bookingGroupId);
    expect(groupIds[0]).toBe(groupIds[1]);
    expect(groupIds[0]).toBeTruthy();

    expect(markBookingPaid).toHaveBeenCalledTimes(2); // cash -> markConfirmed true
    expect(createGroupBookingInvoice).toHaveBeenCalledWith(expect.anything(), expect.any(Array), {
      paymentReceived: true,
    });

    const body = await res.json();
    expect(body.bookings).toHaveLength(2);
    expect(body.booking_group_id).toBe(groupIds[0]);
  });

  it("does not mark bank-transfer bookings paid and invoices with paymentReceived: false", async () => {
    const res = await POST(makeRequest(validPayload({ payment_method: "qr_transfer" })));
    expect(res.status).toBe(201);

    expect(markBookingPaid).not.toHaveBeenCalled();
    expect(createGroupBookingInvoice).toHaveBeenCalledWith(expect.anything(), expect.any(Array), {
      paymentReceived: false,
    });
  });

  it("respects an explicit payment_received override", async () => {
    await POST(makeRequest(validPayload({ payment_method: "qr_transfer", payment_received: true })));
    expect(markBookingPaid).toHaveBeenCalledTimes(1);
  });

  it("propagates a BookingError from createBooking as the matching HTTP status", async () => {
    createBooking.mockRejectedValueOnce(new BookingError("This date is a holiday — the space is closed.", 409));
    const res = await POST(makeRequest(validPayload()));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("holiday");
  });
});
