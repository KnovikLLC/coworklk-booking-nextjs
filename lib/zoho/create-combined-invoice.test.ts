import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";

const createInvoice = vi.fn();
const findOrCreateCustomer = vi.fn();
const syncUserContact = vi.fn();

vi.mock("@/lib/zoho/invoices", () => ({
  createInvoice: (...args: unknown[]) => createInvoice(...args),
  recordInvoicePayment: vi.fn(),
}));
vi.mock("@/lib/zoho/customers", () => ({
  findOrCreateCustomer: (...args: unknown[]) => findOrCreateCustomer(...args),
}));
vi.mock("@/lib/zoho/sync-user-contacts", () => ({
  syncUserContact: (...args: unknown[]) => syncUserContact(...args),
}));

import { createCombinedBookingInvoice } from "@/lib/zoho/create-combined-invoice";

function guestBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-a",
    booking_number: "CW260801-01",
    base_amount: 5000,
    discount_amount: 0,
    total_amount: 5000,
    guest_name: "Jane Doe",
    guest_email: "jane@knovik.com",
    guest_phone: "0771234567",
    user_id: null,
    workspace_count: 1,
    zoho_invoice_id: null,
    pricing: { zoho_item_id: "item-a" },
    users: null,
    booking_addons: [],
    ...overrides,
  };
}

describe("createCombinedBookingInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findOrCreateCustomer.mockResolvedValue({ contact_id: "contact-1" });
    createInvoice.mockResolvedValue({ invoice_id: "inv-1", invoice_number: "INV-001" });
  });

  it("combines bookings across different dates into exactly one invoice", async () => {
    const mock = createSupabaseMock();
    const bookingA = guestBooking({ id: "booking-a", booking_number: "CW260801-01" });
    const bookingB = guestBooking({
      id: "booking-b",
      booking_number: "CW260805-02",
      base_amount: 3000,
      total_amount: 3000,
      pricing: { zoho_item_id: "item-b" },
      booking_addons: [{ quantity: 2, unit_price: 500, addons: { zoho_item_id: "addon-item" } }],
    });
    mock.queue("bookings", { data: [bookingA, bookingB], error: null });
    mock.queue("bookings", { data: null, error: null }); // update

    const result = await createCombinedBookingInvoice(mock.client as never, ["booking-a", "booking-b"]);

    expect(createInvoice).toHaveBeenCalledTimes(1);
    const [contactId, email, referenceNumber, lineItems] = createInvoice.mock.calls[0];
    expect(contactId).toBe("contact-1");
    expect(email).toBe("jane@knovik.com");
    expect(referenceNumber).toBe("CW260801-01");
    expect(lineItems).toEqual([
      { item_id: "item-a", quantity: 1, rate: 5000 },
      { item_id: "item-b", quantity: 1, rate: 3000 },
      { item_id: "addon-item", quantity: 2, rate: 500 },
    ]);
    expect(result).toEqual({
      invoice_id: "inv-1",
      invoice_number: "INV-001",
      booking_ids: ["booking-a", "booking-b"],
      skipped_ids: [],
    });

    const update = mock.insertCalls.find((c) => c.table === "bookings" && c.method === "insert");
    expect(update?.payload).toMatchObject({ zoho_invoice_id: "inv-1", zoho_invoice_number: "INV-001" });
  });

  it("skips already-invoiced bookings and reports them separately, invoicing only the rest", async () => {
    const mock = createSupabaseMock();
    const alreadyInvoiced = guestBooking({ id: "booking-a", zoho_invoice_id: "inv-existing" });
    const fresh = guestBooking({ id: "booking-b", booking_number: "CW260805-02" });
    mock.queue("bookings", { data: [alreadyInvoiced, fresh], error: null });
    mock.queue("bookings", { data: null, error: null });

    const result = await createCombinedBookingInvoice(mock.client as never, ["booking-a", "booking-b"]);

    expect(result.booking_ids).toEqual(["booking-b"]);
    expect(result.skipped_ids).toEqual(["booking-a"]);
  });

  it("throws when every selected booking already has an invoice", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: [guestBooking({ zoho_invoice_id: "inv-existing" })], error: null });

    await expect(createCombinedBookingInvoice(mock.client as never, ["booking-a"])).rejects.toThrow(
      "already has an invoice"
    );
    expect(createInvoice).not.toHaveBeenCalled();
  });

  it("throws when the customer has no email on file", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: [guestBooking({ guest_email: null })], error: null });

    await expect(createCombinedBookingInvoice(mock.client as never, ["booking-a"])).rejects.toThrow("no email");
  });

  it("throws when called with an empty booking id list", async () => {
    const mock = createSupabaseMock();
    await expect(createCombinedBookingInvoice(mock.client as never, [])).rejects.toThrow("No bookings selected");
    expect(createInvoice).not.toHaveBeenCalled();
  });

  it("propagates Zoho errors instead of swallowing them (this is an explicit admin action, not best-effort)", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: [guestBooking()], error: null });
    createInvoice.mockRejectedValue(new Error("Zoho API error 500"));

    await expect(createCombinedBookingInvoice(mock.client as never, ["booking-a"])).rejects.toThrow(
      "Zoho API error 500"
    );
  });
});
