import { getZohoClient } from "@/lib/zoho/client";

// Doc §5.4 lines 1255-1291, adapted to use our getZohoClient(). Callers
// must catch ZohoNotConfiguredError (and errors generally) — this never
// gets called without that wrapping in this codebase.

export interface ZohoCustomer {
  contact_id: string;
  contact_name: string;
  email: string;
  phone: string;
}

interface ZohoContactsSearchResponse {
  contacts: ZohoCustomer[];
}
interface ZohoContactCreateResponse {
  contact: ZohoCustomer;
}

export async function findOrCreateCustomer(
  email: string,
  name: string,
  phone: string
): Promise<ZohoCustomer> {
  const zoho = await getZohoClient();

  // Check both email and phone (not email-else-phone) — someone can already
  // exist in Zoho under a different email with the same phone (or vice
  // versa), and creating a second contact for them would split their
  // invoice history across two records.
  if (email) {
    const byEmail = await zoho.get<ZohoContactsSearchResponse>("/contacts", { params: { email } });
    if (byEmail.data.contacts && byEmail.data.contacts.length > 0) {
      return byEmail.data.contacts[0];
    }
  }

  if (phone) {
    const byPhone = await zoho.get<ZohoContactsSearchResponse>("/contacts", { params: { phone } });
    if (byPhone.data.contacts && byPhone.data.contacts.length > 0) {
      return byPhone.data.contacts[0];
    }
  }

  const newCustomer = await zoho.post<ZohoContactCreateResponse>("/contacts", {
    contact_name: name,
    email: email || undefined,
    phone: phone || undefined,
    contact_type: "customer",
  });

  return newCustomer.data.contact;
}

// Gap-fill (not in doc, but referenced by §8.6's convert-guest flow as
// createOrUpdateZohoContact): thin wrapper so the guest-conversion route
// has a single call matching its own naming rather than reaching for
// findOrCreateCustomer directly.
export async function createOrUpdateZohoContact(
  email: string,
  name: string | null | undefined,
  phone: string | null | undefined
): Promise<ZohoCustomer> {
  return findOrCreateCustomer(email, name ?? "Customer", phone ?? "");
}
