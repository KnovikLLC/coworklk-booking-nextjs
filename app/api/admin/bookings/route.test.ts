import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const requireStaff = vi.fn();
const createBooking = vi.fn();
const markBookingPaid = vi.fn();
const createBookingInvoice = vi.fn();

vi.mock("@/lib/auth/require-staff", () => ({ requireStaff: (...args: unknown[]) => requireStaff(...args) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }));
vi.mock("@/lib/bookings/create", async () => {
  const actual = await vi.importActual<typeof import("@/lib/bookings/create")>("@/lib/bookings/create");
  return { ...actual, createBooking: (...args: unknown[]) => createBooking(...args) };
});
vi.mock("@/lib/bookings/payments", () => ({ markBookingPaid: (...args: unknown[]) => markBookingPaid(...args) }));
vi.mock("@/lib/zoho/create-booking-invoice", () => ({
  createBookingInvoice: (...args: unknown[]) => createBookingInvoice(...args),
}));

import { POST } from "@/app/api/admin/bookings/route";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/admin/bookings", { method: "POST", body: JSON.stringify(body) });
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    space_id: VALID_UUID,
    pricing_id: VALID_UUID,
    date: "2026-08-01",
    slot: "morning",
    customer: { name: "Jane Doe", email: "jane@example.com", phone: "0771234567" },
    payment_method: "cash",
    ...overrides,
  };
}

describe("POST /api/admin/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireStaff.mockResolvedValue({ user: { id: "staff-1" }, role: "admin" });
    createBooking.mockResolvedValue({
      id: "booking-1",
      booking_number: "CW260801-01",
      total_amount: 5000,
      status: "confirmed",
    });
  });

  it("marks cash payments confirmed and invoices paid", async () => {
    const res = await POST(makeRequest(validPayload({ payment_method: "cash" })));
    expect(res.status).toBe(201);
    expect(markBookingPaid).toHaveBeenCalledTimes(1);
    expect(createBookingInvoice).toHaveBeenCalledWith(expect.anything(), "booking-1", { paymentReceived: true });
  });

  it("leaves bank-transfer bookings pending and invoices unpaid", async () => {
    const res = await POST(makeRequest(validPayload({ payment_method: "qr_transfer" })));
    expect(res.status).toBe(201);
    expect(markBookingPaid).not.toHaveBeenCalled();
    expect(createBookingInvoice).toHaveBeenCalledWith(expect.anything(), "booking-1", { paymentReceived: false });
  });

  it("rejects an invalid payload", async () => {
    const res = await POST(makeRequest(validPayload({ customer: undefined })));
    expect(res.status).toBe(400);
    expect(createBooking).not.toHaveBeenCalled();
  });
});
