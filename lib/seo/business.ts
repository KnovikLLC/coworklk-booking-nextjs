// Single source of truth for the business facts (name, address, phone, hours)
// that search engines and AI answer engines cross-check. Keep every page,
// JSON-LD block and /llms.txt reading from here so the NAP (name, address,
// phone) never drifts between pages — inconsistent NAP is one of the main
// reasons local businesses get skipped in AI answers and the Google map pack.

export const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://cowork.lk";

export const BUSINESS = {
  legalName: "Cowork Lanka (Pvt) Ltd",
  brandName: "Cowork.lk",
  alternateNames: ["Cowork Sri Lanka", "Co Work Sri Lanka", "Cowork Lanka"],
  phone: "+94774884040",
  phoneDisplay: "+94 77 488 4040",
  email: "admin@cowork.lk",
  whatsapp: "https://wa.me/94774884040",
  whatsappCommunity: "https://chat.whatsapp.com/FUHL35hZvOs35O4oeyexpa",
  address: {
    street: "349/A/3 Avissawella Road",
    building: "2nd Floor, Active Plus Building",
    locality: "Pannipitiya",
    postalCode: "10230",
    region: "Western Province",
    country: "LK",
    countryName: "Sri Lanka",
  },
  hours: { days: "Monday to Sunday", opens: "08:00", closes: "20:00", display: "8:00 AM – 8:00 PM" },
  mapUrl:
    "https://www.google.com/maps?q=349%2FA%2F3+Avissawella+Road%2C+Pannipitiya+10230%2C+Sri+Lanka",
  founders: ["Charith", "Madusanka Premaratne", "Amila Gunawardhana"],
} as const;

export const FULL_ADDRESS = `${BUSINESS.address.street}, ${BUSINESS.address.locality} ${BUSINESS.address.postalCode}, ${BUSINESS.address.countryName}`;

// Stable @id so every page's JSON-LD can reference the same entity instead of
// declaring a new, disconnected business each time.
export const BUSINESS_ID = `${SITE_URL}/#business`;

// Prices already published across the site (FAQ, home page, meeting rooms).
// Used only when the live pricing table can't be read (e.g. a DB hiccup at
// build time) so a page never renders an empty price table.
export const FALLBACK_FROM_PRICES = [
  { label: "Hot Desk", from: 490 },
  { label: "Workspace Seat", from: 790 },
  { label: "4-Seater Meeting Room", from: 3450 },
  { label: "5-Seater Meeting Room", from: 3950 },
];
