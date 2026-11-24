import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpaces } from "@/lib/data/spaces";
import { formatLKR } from "@/lib/utils";
import { durationLabel, slugify } from "@/lib/spaces";
import {
  BUSINESS,
  BUSINESS_ID,
  FALLBACK_FROM_PRICES,
  FULL_ADDRESS,
  SITE_URL,
} from "@/lib/seo/business";
import { LOCATION_PAGES, type LocationPageData } from "@/lib/seo/locations";

interface PriceRow {
  name: string;
  href?: string;
  capacity?: number;
  options: string;
  from: number;
}

async function loadPriceRows(): Promise<PriceRow[]> {
  try {
    const spaces = await getActiveSpaces(createClient());
    const rows = spaces
      .filter((s) => s.pricing.length > 0)
      .map((s) => {
        const sorted = [...s.pricing].sort((a, b) => a.price - b.price);
        const durations = Array.from(new Set(sorted.map((p) => durationLabel(p.duration))));
        return {
          name: s.name,
          href: `/booking/${slugify(s.name)}`,
          capacity: s.capacity,
          options: durations.join(", "),
          from: sorted[0].price,
        };
      })
      .sort((a, b) => a.from - b.from);
    if (rows.length > 0) return rows;
  } catch {
    // fall through to the published "from" prices
  }
  return FALLBACK_FROM_PRICES.map((p) => ({ name: p.label, options: "Half day, Full day", from: p.from }));
}

const COMPARISON = [
  { factor: "Upfront commitment", cowork: "None — book by the half-day or day", home: "None", lease: "Months of rent + deposit" },
  { factor: "Internet", cowork: "1 Gbps SLT fiber + Starlink backup line, included", home: "One home connection", lease: "You set up and pay" },
  { factor: "Power cuts", cowork: "Backup generator", home: "Usually no backup", lease: "You buy a generator/UPS" },
  { factor: "Meeting space", cowork: "Private 4–5 seater rooms on demand", home: "None", lease: "Only if you rent it" },
  { factor: "Coffee, cleaning, AC", cowork: "Included", home: "Your cost", lease: "Your cost" },
];

export async function LocationLanding({ page }: { page: LocationPageData }) {
  const prices = await loadPriceRows();
  const pageUrl = `${SITE_URL}/${page.slug}`;
  const others = LOCATION_PAGES.filter((p) => p.slug !== page.slug);
  const updatedDisplay = new Date(`${page.updated}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: page.title,
        description: page.description,
        dateModified: page.updated,
        inLanguage: "en-LK",
        about: { "@id": BUSINESS_ID },
        breadcrumb: { "@id": `${pageUrl}#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: page.h1, item: pageUrl },
        ],
      },
      {
        "@type": "OfferCatalog",
        "@id": `${pageUrl}#offers`,
        name: `Coworking spaces near ${page.place}`,
        provider: { "@id": BUSINESS_ID },
        itemListElement: prices.map((row) => ({
          "@type": "Offer",
          name: row.name,
          priceCurrency: "LKR",
          price: row.from,
          availability: "https://schema.org/InStock",
          url: row.href ? `${SITE_URL}${row.href}` : `${SITE_URL}/booking`,
          areaServed: page.place,
        })),
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <div className="bg-background min-h-screen text-brand-dark pb-24">
      <main className="mx-auto max-w-6xl px-4 pt-12">
        <nav aria-label="Breadcrumb" className="text-xs text-brand-dark/50 mb-6">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span className="mx-2">/</span>
          <span>{page.h1}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-5 items-start">
          <div className="lg:col-span-3 space-y-5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-dark/40">
              {page.eyebrow}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-[1.1]">{page.h1}</h1>
            <p className="text-base leading-relaxed text-brand-dark/75">{page.answer}</p>
            <p className="text-xs text-brand-dark/45">Last updated: {updatedDisplay}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand/95"
              >
                Check availability &amp; book <span>→</span>
              </Link>
              <Link
                href="/tour"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-dark/20 px-6 py-3 text-sm font-bold text-brand-dark hover:bg-brand-dark/5"
              >
                Take the 360° tour
              </Link>
            </div>
          </div>
          <div className="lg:col-span-2 relative h-64 lg:h-80 w-full rounded-[24px] overflow-hidden border border-brand-dark/10">
            <Image
              src="/images/spaces/co-work-area.png"
              alt={`Shared workspace at Cowork.lk, Pannipitiya — coworking near ${page.place}`}
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Quick facts: one self-contained block an answer engine can lift whole */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Cowork.lk at a glance</h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Address", `${BUSINESS.address.building}, ${FULL_ADDRESS}`],
              ["Distance", "5 min from Kottawa · 10 min from Maharagama · ~30 min from Kadawatha via expressway"],
              ["Opening hours", `${BUSINESS.hours.days}, ${BUSINESS.hours.display}`],
              ["Prices from", prices[0] ? `${formatLKR(prices[0].from)} (${prices[0].name})` : "See booking page"],
              ["Internet", "1 Gbps SLT Fiber + Starlink satellite — two independent connections"],
              ["Included", "WiFi, AC, backup generator, unlimited coffee & tea, lounge, parking (limited)"],
              ["Contact", `${BUSINESS.phoneDisplay} (call or WhatsApp) · ${BUSINESS.email}`],
            ].map(([term, value]) => (
              <div key={term} className="rounded-2xl border border-brand-dark/5 bg-white p-5">
                <dt className="text-[10px] uppercase font-extrabold tracking-wider text-brand">{term}</dt>
                <dd className="mt-1.5 text-sm text-brand-dark/80 leading-relaxed">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Coworking prices near {page.place}
          </h2>
          <p className="mt-2 text-sm text-brand-dark/60">
            Live prices from our booking system, in Sri Lankan rupees. No lease, no membership fee.
          </p>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-dark/10 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-brand-dark/[0.03] text-left">
                <tr>
                  <th className="p-4 font-bold">Space</th>
                  <th className="p-4 font-bold">Booking options</th>
                  <th className="p-4 font-bold whitespace-nowrap">From</th>
                </tr>
              </thead>
              <tbody>
                {prices.map((row) => (
                  <tr key={row.name} className="border-t border-brand-dark/5">
                    <td className="p-4 font-semibold">
                      {row.href ? (
                        <Link href={row.href} className="hover:text-brand">{row.name}</Link>
                      ) : (
                        row.name
                      )}
                      {row.capacity && row.capacity > 1 ? (
                        <span className="block text-xs font-normal text-brand-dark/50">Up to {row.capacity} people</span>
                      ) : null}
                    </td>
                    <td className="p-4 text-brand-dark/70">{row.options}</td>
                    <td className="p-4 font-bold whitespace-nowrap">{formatLKR(row.from)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{page.gettingHereHeading}</h2>
            <ul className="mt-6 space-y-3">
              {page.gettingHere.map((line) => (
                <li key={line} className="flex gap-3 text-sm leading-relaxed text-brand-dark/75">
                  <span className="text-brand font-bold">•</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <a
              href={BUSINESS.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-sm font-bold text-brand hover:underline"
            >
              Open in Google Maps →
            </a>
          </div>
          <div className="overflow-hidden rounded-2xl border min-h-[280px]">
            <iframe
              title={`Map: Cowork.lk, ${FULL_ADDRESS}`}
              src={`${BUSINESS.mapUrl}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 280 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Who uses Cowork.lk</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {page.whoFor.map((item) => (
              <div key={item.heading} className="rounded-2xl border border-brand-dark/5 bg-white p-6">
                <h3 className="font-bold text-base">{item.heading}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-dark/65">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Coworking vs working from home vs leasing an office
          </h2>
          <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-dark/10 bg-white">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-brand-dark/[0.03] text-left">
                <tr>
                  <th className="p-4 font-bold"> </th>
                  <th className="p-4 font-bold text-brand">Cowork.lk</th>
                  <th className="p-4 font-bold">Working from home</th>
                  <th className="p-4 font-bold">Leasing an office</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.factor} className="border-t border-brand-dark/5">
                    <th scope="row" className="p-4 text-left font-semibold">{row.factor}</th>
                    <td className="p-4 text-brand-dark/80">{row.cowork}</td>
                    <td className="p-4 text-brand-dark/60">{row.home}</td>
                    <td className="p-4 text-brand-dark/60">{row.lease}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {page.faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-brand-dark/5 bg-white p-6">
                <h3 className="font-bold text-sm">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-dark/65">{faq.answer}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-brand-dark/60">
            More answers on our <Link href="/faq" className="text-brand font-semibold hover:underline">FAQ page</Link>.
            Need meeting space? See <Link href="/meeting-rooms" className="text-brand font-semibold hover:underline">meeting rooms</Link>.
          </p>
        </section>

        <section className="mt-16 rounded-2xl border border-brand-dark/5 bg-white p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Also nearby</h2>
            <p className="mt-1 text-sm text-brand-dark/60">Same space, described for where you&apos;re coming from.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {others.map((p) => (
              <Link
                key={p.slug}
                href={`/${p.slug}`}
                className="rounded-xl border border-brand-dark/20 px-5 py-2.5 text-sm font-bold hover:bg-brand-dark/5"
              >
                {p.h1}
              </Link>
            ))}
          </div>
        </section>
      </main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

export function locationMetadata(page: LocationPageData) {
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: `/${page.slug}` },
    openGraph: {
      siteName: "Cowork.lk",
      title: page.title,
      description: page.description,
      url: `/${page.slug}`,
      images: ["/opengraph-image"],
    },
  };
}
