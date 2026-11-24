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
    street: "349/A/3 Avissawella Road, Kottawa",
    building: "2nd Floor, Active Plus Building",
    locality: "Pannipitiya",
    postalCode: "10230",
    region: "Western Province",
    country: "LK",
    countryName: "Sri Lanka",
  },
  // Evening bookings run 5–9 PM (lib/bookings/slot-times.ts), so the space
  // is staffed until 9 PM even though "unlimited" day passes end at 8 PM.
  hours: { days: "Monday to Sunday", opens: "08:00", closes: "21:00", display: "8:00 AM – 9:00 PM" },
  mapUrl:
    "https://www.google.com/maps?q=349%2FA%2F3+Avissawella+Road%2C+Pannipitiya+10230%2C+Sri+Lanka",
  founders: ["Charith", "Madusanka Premaratne", "Amila Gunawardhana"],
  // Landmarks people actually navigate by (provided by the owners).
  landmarks: "Opposite Anura Tyres Kottawa, near Mahalwarawa Junction; 20 m from Red Bell Kottawa, and 100 m from Taco Bell and Lyceum School Kottawa",
  internet: {
    short: "1 Gbps SLT fiber + Starlink",
    long: "a 1 Gbps SLT Fiber line plus a separate Starlink satellite connection",
  },
} as const;

export const FULL_ADDRESS = `${BUSINESS.address.street}, ${BUSINESS.address.locality} ${BUSINESS.address.postalCode}, ${BUSINESS.address.countryName}`;

// Stable @id so every page's JSON-LD can reference the same entity instead of
// declaring a new, disconnected business each time.
export const BUSINESS_ID = `${SITE_URL}/#business`;

// "From" prices quoted in page copy (FAQ answers, intros, /llms.txt).
// Must match the live pricing table — check https://cowork.lk/api/spaces
// whenever rates change in Supabase/Zoho. Price tables on the location pages
// read the live table directly; these constants are for prose and fallbacks.
// Last checked against production: 24 Nov 2026.
export const FROM_PRICES = {
  hotDesk: 490,
  workspace: 890,
  meetingRoom4: 3950,
  meetingRoom5: 4450,
  // Lobby seats up to 10 for every block, 1 hour included (confirmed by the
  // owners 24 Nov 2026, despite the old Zoho item name "Max 3 Pax").
  lobbyHour: 1950,
  max: 16950,
  eveningFee: 500,
} as const;

export function lkr(amount: number) {
  return `LKR ${amount.toLocaleString("en-US")}`;
}

// Used only when the live pricing table can't be read (e.g. a DB hiccup at
// build time) so a page never renders an empty price table.
export const FALLBACK_FROM_PRICES = [
  { label: "Hot Desk", from: FROM_PRICES.hotDesk },
  { label: "Workspace Seat", from: FROM_PRICES.workspace },
  { label: "Lobby Area (up to 10 people)", from: FROM_PRICES.lobbyHour },
  { label: "4-Seater Meeting Room", from: FROM_PRICES.meetingRoom4 },
  { label: "5-Seater Meeting Room", from: FROM_PRICES.meetingRoom5 },
];
