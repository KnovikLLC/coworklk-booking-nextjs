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

import { createGroupBookingInvoice } from "@/lib/zoho/create-group-invoice";

function guestBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-a",
    booking_number: "CW260801-01",
    booking_date: "2026-08-01",
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

describe("createGroupBookingInvoice", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findOrCreateCustomer.mockResolvedValue({ contact_id: "contact-1" });
    createInvoice.mockResolvedValue({ invoice_id: "inv-1", invoice_number: "INV-001" });
  });

  it("creates one invoice per calendar date, combining every booking's pricing + addon lines", async () => {
    const mock = createSupabaseMock();
    const bookingA = guestBooking({ id: "booking-a", booking_number: "CW260801-01" });
    const bookingB = guestBooking({
      id: "booking-b",
      booking_number: "CW260801-02",
      base_amount: 3000,
      total_amount: 3000,
      pricing: { zoho_item_id: "item-b" },
      booking_addons: [{ quantity: 2, unit_price: 500, addons: { zoho_item_id: "addon-item" } }],
    });
    mock.queue("bookings", { data: [bookingA, bookingB], error: null }); // initial select
    mock.queue("bookings", { data: null, error: null }); // update after invoicing

    await createGroupBookingInvoice(mock.client as never, ["booking-a", "booking-b"]);

    expect(createInvoice).toHaveBeenCalledTimes(1);
    const [contactId, email, referenceNumber, lineItems, paymentReceived, sendEmail, options] =
      createInvoice.mock.calls[0];
    expect(contactId).toBe("contact-1");
    expect(email).toBe("jane@example.com");
    expect(referenceNumber).toBe("CW260801-01");
    expect(lineItems).toEqual([
      { item_id: "item-a", quantity: 1, rate: 5000 },
      { item_id: "item-b", quantity: 1, rate: 3000 },
      { item_id: "addon-item", quantity: 2, rate: 500 },
    ]);
    expect(paymentReceived).toBe(true);
    expect(sendEmail).toBe(true);
    expect(options).toMatchObject({ invoiceDate: "2026-08-01" });

    const update = mock.insertCalls.find((c) => c.table === "bookings" && c.method === "insert");
    expect(update?.payload).toMatchObject({ zoho_invoice_id: "inv-1", zoho_invoice_number: "INV-001" });
  });

  it("splits into two invoices when bookings span two calendar dates", async () => {
    const mock = createSupabaseMock();
    const bookingWed = guestBooking({ id: "booking-wed", booking_date: "2026-08-05" });
    const bookingThu = guestBooking({ id: "booking-thu", booking_date: "2026-08-06" });
    mock.queue("bookings", { data: [bookingWed, bookingThu], error: null });
    mock.queue("bookings", { data: null, error: null }); // update for Wed group
    mock.queue("bookings", { data: null, error: null }); // update for Thu group

    await createGroupBookingInvoice(mock.client as never, ["booking-wed", "booking-thu"]);

    expect(createInvoice).toHaveBeenCalledTimes(2);
    const dates = createInvoice.mock.calls.map((call) => call[6]?.invoiceDate);
    expect(dates.sort()).toEqual(["2026-08-05", "2026-08-06"]);
  });

  it("skips already-invoiced bookings and records payment against the existing invoice instead", async () => {
    const mock = createSupabaseMock();
    const alreadyInvoiced = guestBooking({ id: "booking-a", zoho_invoice_id: "inv-existing", total_amount: 4200 });
    mock.queue("bookings", { data: [alreadyInvoiced], error: null });

    await createGroupBookingInvoice(mock.client as never, ["booking-a"]);

    expect(createInvoice).not.toHaveBeenCalled();
    expect(recordInvoicePayment).toHaveBeenCalledWith("contact-1", "inv-existing", 4200);
  });

  it("skips invoicing entirely when the customer has no email on file", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: [guestBooking({ guest_email: null })], error: null });

    await createGroupBookingInvoice(mock.client as never, ["booking-a"]);

    expect(createInvoice).not.toHaveBeenCalled();
  });

  it("does nothing when called with an empty booking id list", async () => {
    const mock = createSupabaseMock();
    await createGroupBookingInvoice(mock.client as never, []);
    expect(createInvoice).not.toHaveBeenCalled();
    expect(mock.insertCalls).toHaveLength(0);
  });

  it("swallows errors instead of throwing (Zoho is best-effort)", async () => {
    const mock = createSupabaseMock();
    mock.queue("bookings", { data: [guestBooking()], error: null });
    createInvoice.mockRejectedValue(new Error("Zoho API error 500"));

    await expect(createGroupBookingInvoice(mock.client as never, ["booking-a"])).resolves.toBeUndefined();
  });
});
