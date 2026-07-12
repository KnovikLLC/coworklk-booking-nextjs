import { getZohoClient } from "@/lib/zoho/client";

// Doc §5.4 lines 1295-1346, adapted to use our getZohoClient() and fixed
// email recipient bug: the doc's version passes an empty `to_mail_ids`
// array (the comment even says "customer email from invoice" but never
// fills it in) — passes the customer's email explicitly here instead.

export interface InvoiceLineItem {
  item_id: string;
  quantity: number;
  rate: number;
}

interface ZohoInvoiceCreateResponse {
  invoice: { invoice_id: string; invoice_number: string };
}

export async function createInvoice(
  customerId: string,
  customerEmail: string,
  bookingNumber: string,
  lineItems: InvoiceLineItem[],
  paymentReceived: boolean = true
): Promise<{ invoice_id: string; invoice_number: string }> {
  const zoho = await getZohoClient();

  const invoice = await zoho.post<ZohoInvoiceCreateResponse>("/invoices", {
    customer_id: customerId,
    reference_number: bookingNumber,
    date: new Date().toISOString().split("T")[0],
    payment_terms: 0, // Due on receipt
    line_items: lineItems.map((item) => ({
      item_id: item.item_id,
      quantity: item.quantity,
      rate: item.rate,
    })),
    notes: `Booking Reference: ${bookingNumber}\nThank you for choosing Cowork!`,
  });

  const invoiceId = invoice.data.invoice.invoice_id;
  const invoiceNumber = invoice.data.invoice.invoice_number;

  if (paymentReceived) {
    await zoho.post(`/invoices/${invoiceId}/payments`, {
      amount: lineItems.reduce((sum, item) => sum + item.rate * item.quantity, 0),
      date: new Date().toISOString().split("T")[0],
      payment_mode: "Online Payment",
    });
  }

  await zoho.post(`/invoices/${invoiceId}/email`, {
    to_mail_ids: [customerEmail],
    subject: `Invoice ${invoiceNumber} from Cowork`,
    body: `Dear Customer,\n\nPlease find attached your invoice for booking ${bookingNumber}.\n\nThank you for choosing Cowork!`,
  });

  return { invoice_id: invoiceId, invoice_number: invoiceNumber };
}
