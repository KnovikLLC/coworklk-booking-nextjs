import { describe, it, expect } from "vitest";
import { formatLKR, cn } from "@/lib/utils";

// Intl.NumberFormat inserts a non-breaking space (U+00A0) between the
// currency symbol and the amount, not a regular space — normalize before
// comparing so the assertions aren't tied to that invisible detail.
function normalize(s: string): string {
  return s.replace(/\u00A0/g, " ");
}

describe("formatLKR", () => {
  it("formats a whole number with thousands separators", () => {
    expect(normalize(formatLKR(1000))).toBe("LKR 1,000");
  });

  it("formats zero", () => {
    expect(normalize(formatLKR(0))).toBe("LKR 0");
  });

  it("rounds off decimals (maximumFractionDigits: 0)", () => {
    expect(normalize(formatLKR(1950.75))).toBe("LKR 1,951");
  });

  it("formats large numbers", () => {
    expect(normalize(formatLKR(1234567))).toBe("LKR 1,234,567");
  });

  it("formats negative numbers", () => {
    expect(normalize(formatLKR(-500))).toBe("-LKR 500");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });
});
