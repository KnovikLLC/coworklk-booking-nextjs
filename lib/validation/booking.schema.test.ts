import { describe, it, expect } from "vitest";
import {
  bookingAddonSchema,
  bookingCreateSchema,
  adminBookingCreateSchema,
  adminBookingBatchCreateSchema,
} from "@/lib/validation/booking.schema";

const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("bookingAddonSchema", () => {
  it("accepts a valid addon line", () => {
    expect(bookingAddonSchema.safeParse({ addon_id: VALID_UUID, quantity: 3 }).success).toBe(true);
  });

  it("rejects quantity below 1", () => {
    expect(bookingAddonSchema.safeParse({ addon_id: VALID_UUID, quantity: 0 }).success).toBe(false);
  });

  it("rejects quantity above 20", () => {
    expect(bookingAddonSchema.safeParse({ addon_id: VALID_UUID, quantity: 21 }).success).toBe(false);
  });

  it("rejects a non-uuid addon_id", () => {
    expect(bookingAddonSchema.safeParse({ addon_id: "not-a-uuid", quantity: 1 }).success).toBe(false);
  });
});

function validBookingCreatePayload(overrides: Record<string, unknown> = {}) {
  return {
    space_id: VALID_UUID,
    pricing_id: VALID_UUID,
    date: "2026-08-01",
    slot: "morning",
    payment_method: "payhere",
    ...overrides,
  };
}

describe("bookingCreateSchema", () => {
  it("accepts a valid guest payload", () => {
    const result = bookingCreateSchema.safeParse(
      validBookingCreatePayload({ guest_name: "Jane Doe", guest_email: "jane@example.com" })
    );
    expect(result.success).toBe(true);
  });

  it("accepts a valid member payload with no guest fields", () => {
    expect(bookingCreateSchema.safeParse(validBookingCreatePayload()).success).toBe(true);
  });

  it("defaults workspace_count to 1", () => {
    const result = bookingCreateSchema.safeParse(validBookingCreatePayload());
    expect(result.success && result.data.workspace_count).toBe(1);
  });

  it("rejects a malformed date", () => {
    expect(bookingCreateSchema.safeParse(validBookingCreatePayload({ date: "08/01/2026" })).success).toBe(false);
  });

  it("rejects an invalid slot enum value", () => {
    expect(bookingCreateSchema.safeParse(validBookingCreatePayload({ slot: "midnight" })).success).toBe(false);
  });

  it("rejects guest_name without guest_email (refinement)", () => {
    expect(bookingCreateSchema.safeParse(validBookingCreatePayload({ guest_name: "Jane Doe" })).success).toBe(false);
  });

  it("rejects guest_email without guest_name (refinement)", () => {
    expect(
      bookingCreateSchema.safeParse(validBookingCreatePayload({ guest_email: "jane@example.com" })).success
    ).toBe(false);
  });

  it("rejects workspace_count above 20", () => {
    expect(bookingCreateSchema.safeParse(validBookingCreatePayload({ workspace_count: 21 })).success).toBe(false);
  });
});

describe("adminBookingCreateSchema", () => {
  function validAdminPayload(overrides: Record<string, unknown> = {}) {
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

  it("accepts a valid payload", () => {
    expect(adminBookingCreateSchema.safeParse(validAdminPayload()).success).toBe(true);
  });

  it("accepts cash/card_terminal payment methods not allowed on the customer-facing schema", () => {
    expect(adminBookingCreateSchema.safeParse(validAdminPayload({ payment_method: "card_terminal" })).success).toBe(
      true
    );
  });

  it("rejects a missing customer object", () => {
    const payload = validAdminPayload();
    delete (payload as { customer?: unknown }).customer;
    expect(adminBookingCreateSchema.safeParse(payload).success).toBe(false);
  });

  it("rejects a too-short customer name", () => {
    expect(
      adminBookingCreateSchema.safeParse(validAdminPayload({ customer: { name: "J", email: "j@x.com", phone: "0771234567" } }))
        .success
    ).toBe(false);
  });
});

describe("adminBookingBatchCreateSchema", () => {
  function validItem(overrides: Record<string, unknown> = {}) {
    return {
      space_id: VALID_UUID,
      pricing_id: VALID_UUID,
      date: "2026-08-01",
      slot: "morning",
      ...overrides,
    };
  }

  function validBatchPayload(items: unknown[] = [validItem()]) {
    return {
      customer: { name: "Jane Doe", email: "jane@example.com", phone: "0771234567" },
      payment_method: "cash",
      items,
    };
  }

  it("accepts a payload with one item", () => {
    expect(adminBookingBatchCreateSchema.safeParse(validBatchPayload()).success).toBe(true);
  });

  it("accepts a payload with multiple items across different dates/spaces", () => {
    const items = [validItem({ date: "2026-08-01" }), validItem({ date: "2026-08-02", space_id: VALID_UUID })];
    expect(adminBookingBatchCreateSchema.safeParse(validBatchPayload(items)).success).toBe(true);
  });

  it("rejects an empty items array (min 1)", () => {
    expect(adminBookingBatchCreateSchema.safeParse(validBatchPayload([])).success).toBe(false);
  });

  it("rejects more than 20 items (max 20)", () => {
    const items = Array.from({ length: 21 }, () => validItem());
    expect(adminBookingBatchCreateSchema.safeParse(validBatchPayload(items)).success).toBe(false);
  });

  it("rejects a malformed item within the batch", () => {
    const items = [validItem({ date: "not-a-date" })];
    expect(adminBookingBatchCreateSchema.safeParse(validBatchPayload(items)).success).toBe(false);
  });
});
