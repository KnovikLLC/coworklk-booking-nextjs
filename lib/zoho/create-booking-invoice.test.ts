import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "@/test/helpers/supabase-mock";

const createInvoice = vi.fn();
const recordInvoicePayment = vi.fn();
const findOrCreateCustomer = vi.fn();
const syncUserContact = vi.fn();

vi.mock("@/lib/zoho/invoices", () => ({
  createInvoice: (...args: unknown[]) => createInvoice(...args),
  recordInvoicePayment: (...args: unknown[]) => recordInvoicePayment(...args),
}));
vi.mock("@/lib/zoho/customers", () => ({
  findOrCreateCustomer: (...args: unknown[]) => findOrCreateCustomer(...args),
}));
vi.mock("@/lib/zoho/sync-user-contacts", () => ({
  syncUserContact: (...args: unknown[]) => syncUserContact(...args),
}));

import { createBookingInvoice } from "@/lib/zoho/create-booking-invoice";

function booking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1",
    booking_number: "CW260801-01",
    base_amount: 5000,
    discount_amount: 0,
    total_amount: 5000,
    guest_name: "Jane Doe",
    guest_email: "jane@example.com",
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

describe("createBookingInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findOrCreateCustomer.mockResolvedValue({ contact_id: "contact-1" });
    createInvoice.mockResolvedValue({ invoice_id: "inv-1", invoice_number: "INV-001" });
  });

  it("creates an invoice from the booking's pricing and addon line items", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", {
      data: booking({ booking_addons: [{ quantity: 2, unit_price: 300, addons: { zoho_item_id: "addon-1" } }] }),
      error: null,
    });
    mock.queue("bookings", { data: null, error: null }); // update

    await createBookingInvoice(mock.client as never, "booking-1");

    expect(createInvoice).toHaveBeenCalledWith(
      "contact-1",
      "jane@example.com",
      "CW260801-01",
      [
        { item_id: "item-a", quantity: 1, rate: 5000 },
        { item_id: "addon-1", quantity: 2, rate: 300 },
      ],
      true,
      true
    );

    const update = mock.insertCalls.find((c) => c.table === "bookings" && c.method === "insert");
    expect(update?.payload).toMatchObject({ zoho_invoice_id: "inv-1", zoho_invoice_number: "INV-001" });
  });

  it("is idempotent: records payment instead of re-invoicing when zoho_invoice_id is already set", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: booking({ zoho_invoice_id: "inv-existing", total_amount: 6000 }), error: null });

    await createBookingInvoice(mock.client as never, "booking-1", { paymentReceived: true });

    expect(createInvoice).not.toHaveBeenCalled();
    expect(recordInvoicePayment).toHaveBeenCalledWith("contact-1", "inv-existing", 6000);
  });

  it("does not record a payment for an already-invoiced booking when paymentReceived is false", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: booking({ zoho_invoice_id: "inv-existing" }), error: null });

    await createBookingInvoice(mock.client as never, "booking-1", { paymentReceived: false });

    expect(recordInvoicePayment).not.toHaveBeenCalled();
  });

  it("skips invoicing when the booking has no customer email", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: booking({ guest_email: null }), error: null });

    await createBookingInvoice(mock.client as never, "booking-1");

    expect(createInvoice).not.toHaveBeenCalled();
  });

  it("skips invoicing when the booking has no Zoho-mapped line items", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: booking({ pricing: null, booking_addons: [] }), error: null });

    await createBookingInvoice(mock.client as never, "booking-1");

    expect(createInvoice).not.toHaveBeenCalled();
  });

  it("swallows errors instead of throwing", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: booking(), error: null });
    createInvoice.mockRejectedValue(new Error("network error"));

    await expect(createBookingInvoice(mock.client as never, "booking-1")).resolves.toBeUndefined();
  });
});
