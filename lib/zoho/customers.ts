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

  const searchResult = await zoho.get<ZohoContactsSearchResponse>("/contacts", {
    params: { email },
  });

  if (searchResult.data.contacts.length > 0) {
    return searchResult.data.contacts[0];
  }

  const newCustomer = await zoho.post<ZohoContactCreateResponse>("/contacts", {
    contact_name: name,
    email,
    phone,
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
