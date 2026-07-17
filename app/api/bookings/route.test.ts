import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";

const createBooking = vi.fn();
const markBookingPaid = vi.fn();
const createBookingInvoice = vi.fn();
let mock: ReturnType<typeof createSupabaseMock>;
let currentUser: { id: string } | null = null;

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => ({ auth: { getUser: async () => ({ data: { user: currentUser } }) } }),
}));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => mock.client }));
vi.mock("@/lib/bookings/create", async () => {
  const actual = await vi.importActual<typeof import("@/lib/bookings/create")>("@/lib/bookings/create");
  return { ...actual, createBooking: (...args: unknown[]) => createBooking(...args) };
});
vi.mock("@/lib/bookings/payments", () => ({ markBookingPaid: (...args: unknown[]) => markBookingPaid(...args) }));
vi.mock("@/lib/zoho/create-booking-invoice", () => ({
  createBookingInvoice: (...args: unknown[]) => createBookingInvoice(...args),
}));

import { POST } from "@/app/api/bookings/route";
import { BookingError } from "@/lib/bookings/create";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/bookings", { method: "POST", body: JSON.stringify(body) });
}

function guestPayload(overrides: Record<string, unknown> = {}) {
  return {
    space_id: VALID_UUID,
    pricing_id: VALID_UUID,
    date: "2026-08-01",
    slot: "morning",
    guest_name: "Jane Doe",
    guest_email: "jane@example.com",
    guest_phone: "0771234567",
    payment_method: "payhere",
    ...overrides,
  };
}

describe("POST /api/bookings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mock = createSupabaseMock();
    currentUser = null;
    createBooking.mockResolvedValue({
      id: "booking-1",
      booking_number: "CW260801-01",
      total_amount: 5000,
      status: "pending_payment",
    });
  });

  it("rejects an invalid payload", async () => {
    const res = await POST(makeRequest({ space_id: "not-a-uuid" }));
    expect(res.status).toBe(400);
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("rejects a guest checkout missing guest contact fields when unauthenticated", async () => {
    const res = await POST(makeRequest(guestPayload({ guest_email: undefined, guest_name: undefined })));
    expect(res.status).toBe(400);
    expect(createBooking).not.toHaveBeenCalled();
  });

  it("creates a guest booking and invoices it unpaid (still pending_payment)", async () => {
    const res = await POST(makeRequest(guestPayload()));
    expect(res.status).toBe(201);
    expect(createBooking).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ guestName: "Jane Doe", guestEmail: "jane@example.com", userId: null })
    );
    expect(createBookingInvoice).toHaveBeenCalledWith(expect.anything(), "booking-1", { paymentReceived: false });
    expect(markBookingPaid).not.toHaveBeenCalled();
  });

  it("creates a member booking using the session user id, ignoring guest fields", async () => {
    currentUser = { id: "user-1" };
    await POST(makeRequest(guestPayload({ guest_name: undefined, guest_email: undefined, guest_phone: undefined })));
    expect(createBooking).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ userId: "user-1" }));
  });

  it("propagates a BookingError as the matching HTTP status", async () => {
    createBooking.mockRejectedValueOnce(new BookingError("This slot is no longer available", 409));
    const res = await POST(makeRequest(guestPayload()));
    expect(res.status).toBe(409);
  });

  describe("domain_verification payment method", () => {
    function domainPayload(overrides: Record<string, unknown> = {}) {
      return guestPayload({
        payment_method: "domain_verification",
        verification_email: "jane@corp.com",
        verification_code: "123456",
        ...overrides,
      });
    }

    it("rejects when the domain is not preconfigured", async () => {
      mock.queue("preconfigured_domains", { data: null, error: { message: "not found" } });
      const res = await POST(makeRequest(domainPayload()));
      expect(res.status).toBe(403);
      expect(createBooking).not.toHaveBeenCalled();
    });

    it("rejects an invalid or already-used verification code", async () => {
      mock.queue("preconfigured_domains", { data: { domain: "corp.com" }, error: null });
      mock.queue("domain_verifications", { data: null, error: { message: "not found" } });
      const res = await POST(makeRequest(domainPayload()));
      expect(res.status).toBe(400);
    });

    it("rejects an expired verification code", async () => {
      mock.queue("preconfigured_domains", { data: { domain: "corp.com" }, error: null });
      mock.queue("domain_verifications", {
        data: { id: "v1", expires_at: new Date(Date.now() - 60_000).toISOString(), verified_at: null },
        error: null,
      });
      const res = await POST(makeRequest(domainPayload()));
      expect(res.status).toBe(400);
    });

    it("confirms the booking immediately on a valid code and records payment", async () => {
      mock.queue("preconfigured_domains", { data: { domain: "corp.com" }, error: null });
      mock.queue("domain_verifications", {
        data: { id: "v1", expires_at: new Date(Date.now() + 60_000).toISOString(), verified_at: null },
        error: null,
      });
      mock.queue("domain_verifications", { data: null, error: null }); // the "mark verified" update

      const res = await POST(makeRequest(domainPayload()));
      expect(res.status).toBe(201);
      expect(markBookingPaid).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ bookingId: "booking-1", method: "domain_verification" })
      );
      expect(createBookingInvoice).toHaveBeenCalledWith(expect.anything(), "booking-1", { paymentReceived: true });

      const body = await res.json();
      expect(body.booking.status).toBe("confirmed");
    });
  });
});
