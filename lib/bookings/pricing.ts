export interface BookingTotals {
  base_amount: number;
  addons_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
}

// Doc §8.3: member discount applies to base price only, never add-ons, and
// never stacks. discount_percent/discount_amount are computed by the caller
// (lib/pricing/discount.ts) and passed in here — this function just totals.
export function computeBookingTotals(
  basePrice: number,
  addonLines: { unitPrice: number; quantity: number }[],
  discountPercent = 0
): BookingTotals {
  const addons_amount = addonLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const discount_amount = Math.round(basePrice * (discountPercent / 100));
  const total_amount = basePrice - discount_amount + addons_amount;

  return {
    base_amount: basePrice,
    addons_amount,
    discount_percent: discountPercent,
    discount_amount,
    total_amount,
  };
}
