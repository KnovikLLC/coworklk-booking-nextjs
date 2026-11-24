import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveSpaces } from "@/lib/data/spaces";
import { durationLabel, slugify } from "@/lib/spaces";
import { BUSINESS, FALLBACK_FROM_PRICES, FULL_ADDRESS, SITE_URL } from "@/lib/seo/business";
import { LOCATION_PAGES } from "@/lib/seo/locations";

// /llms.txt — a plain-markdown brief for LLMs and AI crawlers (llmstxt.org).
// Gives answer engines the canonical facts in one cheap fetch, with links to
// the pages worth citing. Prices are read live so this never goes stale.
export const revalidate = 3600;

async function priceLines(): Promise<string[]> {
  try {
    const spaces = await getActiveSpaces(createAdminClient());
    const lines = spaces
      .filter((s) => s.pricing.length > 0)
      .map((s) => {
        const sorted = [...s.pricing].sort((a, b) => a.price - b.price);
        const opts = sorted.map((p) => `${durationLabel(p.duration)} LKR ${p.price.toLocaleString("en-US")}`).join("; ");
        return `- [${s.name}](${SITE_URL}/booking/${slugify(s.name)}) (up to ${s.capacity} ${s.capacity === 1 ? "person" : "people"}): ${opts}`;
      });
    if (lines.length > 0) return lines;
  } catch {
    // fall back below
  }
  return FALLBACK_FROM_PRICES.map((p) => `- ${p.label}: from LKR ${p.from.toLocaleString("en-US")}`);
}

export async function GET() {
  const prices = await priceLines();
  const body = `# ${BUSINESS.brandName}

> ${BUSINESS.brandName} (${BUSINESS.legalName}) is a coworking space in Pannipitiya, Sri Lanka — 5 minutes from Kottawa, 10 minutes from Maharagama and about 30 minutes from Kadawatha via the expressway. It rents hot desks, workspace seats and private 4- and 5-seater meeting rooms by the half-day, full day or unlimited day, bookable online with real-time availability and no lease.

## Key facts

- Address: ${BUSINESS.address.building}, ${FULL_ADDRESS}
- Opening hours: ${BUSINESS.hours.days}, ${BUSINESS.hours.display} (not 24/7)
- Phone / WhatsApp: ${BUSINESS.phoneDisplay}
- Email: ${BUSINESS.email}
- Map: ${BUSINESS.mapUrl}
- Included with every booking: SLT Mobitel fiber WiFi, air conditioning, backup power generator, unlimited coffee and tea, lounge access, limited on-site parking
- Payment: card online, or bank/QR transfer; guest checkout available (no account needed)
- Evening bookings (5–9 PM) carry an LKR 500 evening convenience fee
- Returning members get 10% off when they book again within 30 days
- Cancellation: 80% refund with more than 24 hours' notice, 50% with 4–24 hours, none inside 4 hours
- Founded by ${BUSINESS.founders.join(", ")}
- One location only (Pannipitiya); no branches in central Colombo

## Current prices (LKR)

${prices.join("\n")}

## Pages

- [Home](${SITE_URL}/): overview, amenities and FAQ
${LOCATION_PAGES.map((p) => `- [${p.h1}](${SITE_URL}/${p.slug}): ${p.description}`).join("\n")}
- [Meeting rooms](${SITE_URL}/meeting-rooms): private meeting and conference rooms in Pannipitiya
- [Book a space](${SITE_URL}/booking): live availability and online booking
- [FAQ](${SITE_URL}/faq): pricing, day passes, amenities, hours, payments, cancellations
- [About](${SITE_URL}/about): company, founders and story
- [360° tour](${SITE_URL}/tour): virtual tour of the space
- [Contact](${SITE_URL}/contact)
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
