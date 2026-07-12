import crypto from "crypto";

// Doc §6.1 lines 1417-1449, verbatim.
export function generatePayhereHash(
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string,
  merchantSecret: string
): string {
  const hashedSecret = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();

  const amountFormatted = amount.toFixed(2);

  const hash = crypto
    .createHash("md5")
    .update(merchantId + orderId + amountFormatted + currency + hashedSecret)
    .digest("hex")
    .toUpperCase();

  return hash;
}

// Not given verbatim in the doc — the webhook handler (§6.1 lines 1498-1541)
// calls generatePayhereNotifyHash but the doc never defines it. Authored
// from PayHere's documented notify-hash formula:
// md5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + md5(merchant_secret))
export function generatePayhereNotifyHash(
  merchantId: string,
  orderId: string,
  amount: string,
  currency: string,
  statusCode: string,
  merchantSecret: string
): string {
  const hashedSecret = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();

  const hash = crypto
    .createHash("md5")
    .update(merchantId + orderId + amount + currency + statusCode + hashedSecret)
    .digest("hex")
    .toUpperCase();

  return hash;
}
