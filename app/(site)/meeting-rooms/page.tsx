import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpaces } from "@/lib/data/spaces";
import { getActiveAddons } from "@/lib/data/addons";
import { SpaceCard } from "@/components/booking/SpaceCard";
import { BUSINESS, BUSINESS_ID, FROM_PRICES, FULL_ADDRESS, SITE_URL, lkr } from "@/lib/seo/business";
import type { AddonDTO, SpaceDTO } from "@/lib/types/domain";

// Targets the meeting/conference-room rental queries in Search Console
// ("meeting room rental sri lanka", "conference room rental sri lanka",
// "meeting rooms sri lanka", "meeting room near me", ...), where the old page
// sat around position 40–60. Prices and add-ons are read live; the prose
// uses FROM_PRICES so it matches the published rates.

const UPDATED = "2026-11-24";
const TITLE = `Meeting Room Rental Sri Lanka | Kottawa, from ${lkr(FROM_PRICES.meetingRoom4)} | Cowork.lk`;
const DESCRIPTION = `Rent a private meeting or conference room in Kottawa, Sri Lanka from ${lkr(FROM_PRICES.meetingRoom4)} per half day, or the Lobby for up to 10 people by the hour. 1 Gbps fiber + Starlink.`;

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/meeting-rooms" },
  openGraph: {
    siteName: "Cowork.lk",
    title: TITLE,
    description: DESCRIPTION,
    url: "/meeting-rooms",
    images: ["/opengraph-image"],
  },
};

const ROOM_COLUMNS = [
  { duration: "half_day", label: "Half day", hours: "4 hrs · 8–12 or 12–4" },
  { duration: "full_day", label: "Full day", hours: "8 AM – 5 PM" },
  { duration: "evening", label: "Evening", hours: "5 PM – 9 PM" },
  { duration: "unlimited", label: "Unlimited", hours: "8 AM – 8 PM" },
];

const LOBBY_COLUMNS = [
  { duration: "1hr", label: "1 hour" },
  { duration: "2hr", label: "2 hours" },
  { duration: "4hr", label: "4 hours" },
  { duration: "8hr", label: "8 hours" },
  { duration: "unlimited", label: "Full day" },
];

function priceFor(space: SpaceDTO, duration: string) {
  return space.pricing.find((p) => p.duration === duration);
}

function cheapest(addons: AddonDTO[], match: RegExp) {
  const hits = addons.filter((a) => match.test(a.name)).map((a) => a.price);
  return hits.length ? Math.min(...hits) : null;
}

function buildFaqs(addons: AddonDTO[]) {
  const projector = cheapest(addons, /projector(?! screen)/i);
  const screen = cheapest(addons, /screen/i);
  const monitor = cheapest(addons, /monitor/i);
  const chair = cheapest(addons, /additional chair/i);
  const equipment = [
    projector && `a projector from ${lkr(projector)}`,
    screen && `a projector screen from ${lkr(screen)}`,
    monitor && `an extra monitor for ${lkr(monitor)} a day`,
  ].filter(Boolean);

  return [
    {
      question: "How much does it cost to rent a meeting room in Sri Lanka?",
      answer: `At Cowork.lk in Kottawa, a private 4-seater meeting room costs from ${lkr(FROM_PRICES.meetingRoom4)} for a half day (4 hours) and the glass-enclosed 5-seater from ${lkr(FROM_PRICES.meetingRoom5)}. Full-day, evening (5–9 PM) and unlimited-day rates are also available, and the Lobby Area for up to 10 people starts at ${lkr(FROM_PRICES.lobbyHour)} for an hour. Prices are in LKR and include WiFi, coffee and tea.`,
    },
    {
      question: "Do you have conference rooms for rent near Kottawa, Maharagama or Pannipitiya?",
      answer: `Yes. Cowork.lk is at ${FULL_ADDRESS}: ${BUSINESS.landmarks.charAt(0).toLowerCase()}${BUSINESS.landmarks.slice(1)}, about 10 minutes from Maharagama. It has two private 4-seater rooms, a 5-seater room and a Lobby Area for up to 10 people, all bookable online.`,
    },
    {
      question: "Is there a meeting space for 6 to 10 people?",
      answer: `The Lobby Area seats up to 10 people and can be booked for 1, 2, 4 or 8 hours or a full day, from ${lkr(FROM_PRICES.lobbyHour)} for an hour.${chair ? ` For six people, the 5-seater room can take an additional chair for ${lkr(chair)}.` : ""} For larger events, contact us and we'll help plan it.`,
    },
    {
      question: "Can I book a meeting room for half a day or in the evening?",
      answer: `Yes. Private meeting rooms are booked in fixed blocks: half day (8 AM–12 PM or 12–4 PM), full day (8 AM–5 PM), evening (5–9 PM) or unlimited (8 AM–8 PM). Evening bookings carry an ${lkr(FROM_PRICES.eveningFee)} evening convenience fee. Only the Lobby Area is bookable by the hour.`,
    },
    {
      question: "What's included with a meeting room booking?",
      answer: `Every room includes WiFi on ${BUSINESS.internet.long}, a daily data package (4–15 GB depending on the room and booking length), air conditioning, a backup power generator, and unlimited coffee and tea.`,
    },
    {
      question: "Can I rent a projector or screen for my meeting?",
      answer: equipment.length
        ? `Yes. You can add ${equipment.join(", ")} at checkout, along with extra data packages.`
        : "Yes. Projectors, screens, monitors and extra data can be added at checkout.",
    },
    {
      question: "Are the rooms good for interviews and video calls?",
      answer:
        "Yes. The rooms are private and include a soundproof room, and two independent internet connections (1 Gbps SLT fiber and Starlink) plus a backup generator keep Zoom, Teams and Meet calls running through line faults and power cuts.",
    },
    {
      question: "How do I book and pay for a meeting room?",
      answer:
        "Pick a room and date on the booking page to see live availability, then pay by card online or by bank/QR transfer. Guest checkout is available, so you don't need an account. Returning members who book again within 30 days get 10% off.",
    },
    {
      question: "What is the cancellation policy for meeting rooms?",
      answer:
        "You get 80% back if you cancel more than 24 hours before the booking, 50% back with 4–24 hours' notice, and no refund for cancellations inside 4 hours.",
    },
  ];
}

const USE_CASES = [
  { title: "Job interviews", body: "A private, quiet room for one-on-one or panel interviews, with a reception area for candidates to wait." },
  { title: "Client meetings", body: "Meet clients somewhere professional without a city-centre commute, with limited on-site parking." },
  { title: "Video calls & webinars", body: "1 Gbps SLT fiber with Starlink as a second line, plus generator backup, for calls that can't drop." },
  { title: "Training & workshops", body: "Book the Lobby for up to 10 people and add a projector and screen for presentations." },
  { title: "Team planning days", body: "Take a room for the full day or unlimited access, with free coffee and tea all day." },
  { title: "Evening sessions", body: "Evening slots from 5–9 PM for tuition, study groups or after-work meetups." },
];

export default async function MeetingRoomsPage() {
  const supabase = createClient();
  const [spaces, addons] = await Promise.all([getActiveSpaces(supabase), getActiveAddons(supabase)]);
  const meetingRooms = spaces
    .filter((space) => space.type.startsWith("meeting_room"))
    .sort((a, b) => a.capacity - b.capacity || a.name.localeCompare(b.name));
  const lobby = spaces.find((space) => space.type === "lobby");
  const faqs = buildFaqs(addons);
  const equipmentAddons = addons
    .filter((a) => a.category === "equipment" || a.category === "data")
    .sort((a, b) => a.price - b.price);

  const pageUrl = `${SITE_URL}/meeting-rooms`;
  const bookable = [...meetingRooms, ...(lobby ? [lobby] : [])];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: TITLE,
        description: DESCRIPTION,
        dateModified: UPDATED,
        inLanguage: "en-LK",
        about: { "@id": BUSINESS_ID },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Meeting Rooms", item: pageUrl },
        ],
      },
      {
        "@type": "OfferCatalog",
        name: "Meeting and conference room rental in Kottawa, Sri Lanka",
        provider: { "@id": BUSINESS_ID },
        itemListElement: bookable.flatMap((space) =>
          space.pricing.map((p) => ({
            "@type": "Offer",
            name: `${space.name} – ${p.duration.replace(/_/g, " ")}`,
            price: p.price,
            priceCurrency: "LKR",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/booking`,
            itemOffered: {
              "@type": "Service",
              name: space.name,
              serviceType: "Meeting room rental",
              areaServed: ["Kottawa", "Pannipitiya", "Maharagama", "Sri Lanka"],
            },
          }))
        ),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  const updatedDisplay = new Date(`${UPDATED}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="bg-background min-h-screen text-brand-dark pb-24">
      <main className="mx-auto max-w-6xl px-4 pt-12">
        <nav aria-label="Breadcrumb" className="text-xs text-brand-dark/50 mb-6">
          <Link href="/" className="hover:text-brand">Home</Link>
          <span className="mx-2">/</span>
          <span>Meeting Rooms</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-5 items-start">
          <div className="lg:col-span-3 space-y-5">
            <span className="text-xs uppercase font-extrabold tracking-widest text-brand-dark/40">
              Meeting &amp; Conference Room Rental
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-[1.1]">
              Meeting Room &amp; Conference Room Rental in Kottawa, Sri Lanka
            </h1>
            <p className="text-base leading-relaxed text-brand-dark/75">
              Cowork.lk rents private meeting rooms in Kottawa, Pannipitiya: two 4-seater rooms from{" "}
              {lkr(FROM_PRICES.meetingRoom4)} and a glass-enclosed 5-seater from {lkr(FROM_PRICES.meetingRoom5)} per
              half day, plus a Lobby Area for up to 10 people from {lkr(FROM_PRICES.lobbyHour)} for an hour. Every
              booking includes 1 Gbps SLT fiber with Starlink backup, a generator, AC and free coffee, and you can book
              online with instant confirmation.
            </p>
            <p className="text-xs text-brand-dark/45">Last updated: {updatedDisplay}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-brand/95"
              >
                Check availability &amp; book <span>→</span>
              </Link>
              <a
                href={`${BUSINESS.whatsapp}?text=${encodeURIComponent("Hi Cowork.lk, I'd like to book a meeting room.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-dark/20 px-6 py-3 text-sm font-bold text-brand-dark hover:bg-brand-dark/5"
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>
          <div className="lg:col-span-2 relative h-64 lg:h-80 w-full rounded-[24px] overflow-hidden border border-brand-dark/10">
            <Image
              src="/images/spaces/meeting-rooms.png"
              alt="Private meeting room for rent at Cowork.lk, Kottawa, Sri Lanka"
              fill
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Which room fits: answers "meeting room for N people" queries in one glance */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Which room fits your group?</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              { size: "1–4 people", room: "4-Seater Meeting Rooms (two rooms)", from: `From ${lkr(FROM_PRICES.meetingRoom4)} / half day` },
              { size: "5–6 people", room: "5-Seater Glass Room (extra chair available)", from: `From ${lkr(FROM_PRICES.meetingRoom5)} / half day` },
              { size: "Up to 10 people", room: "Lobby Area, booked by the hour", from: `From ${lkr(FROM_PRICES.lobbyHour)} / hour` },
            ].map((item) => (
              <div key={item.size} className="rounded-2xl border border-brand-dark/5 bg-white p-6">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-brand">{item.size}</p>
                <h3 className="mt-2 font-bold text-base">{item.room}</h3>
                <p className="mt-1 text-sm text-brand-dark/65">{item.from}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Meeting room rental prices</h2>
          <p className="mt-2 text-sm text-brand-dark/60">
            Live rates from our booking system in Sri Lankan rupees. Evening bookings add an{" "}
            {lkr(FROM_PRICES.eveningFee)} convenience fee.
          </p>
          {meetingRooms.length === 0 ? (
            <p className="mt-6 text-sm text-brand-dark/60">
              4-seater rooms from {lkr(FROM_PRICES.meetingRoom4)} and the 5-seater from {lkr(FROM_PRICES.meetingRoom5)} per
              half day. <Link href="/booking" className="text-brand font-semibold hover:underline">See live availability</Link>.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-dark/10 bg-white">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="bg-brand-dark/[0.03] text-left">
                  <tr>
                    <th className="p-4 font-bold">Room</th>
                    {ROOM_COLUMNS.map((col) => (
                      <th key={col.duration} className="p-4 font-bold">
                        {col.label}
                        <span className="block text-[11px] font-normal text-brand-dark/50">{col.hours}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {meetingRooms.map((room) => (
                    <tr key={room.id} className="border-t border-brand-dark/5">
                      <th scope="row" className="p-4 text-left font-semibold">
                        {room.name}
                        <span className="block text-xs font-normal text-brand-dark/50">Up to {room.capacity} people</span>
                      </th>
                      {ROOM_COLUMNS.map((col) => {
                        const p = priceFor(room, col.duration);
                        return (
                          <td key={col.duration} className="p-4 whitespace-nowrap">
                            {p ? (
                              <>
                                <span className="font-bold">{lkr(p.price)}</span>
                                {p.includes_data_gb > 0 ? (
                                  <span className="block text-[11px] text-brand-dark/50">{p.includes_data_gb} GB data</span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-brand-dark/40">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {lobby ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-dark/10 bg-white">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="bg-brand-dark/[0.03] text-left">
                  <tr>
                    <th className="p-4 font-bold">Lobby Area (up to {lobby.capacity} people)</th>
                    {LOBBY_COLUMNS.map((col) => (
                      <th key={col.duration} className="p-4 font-bold">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-brand-dark/5">
                    <th scope="row" className="p-4 text-left font-normal text-brand-dark/60">Up to 10 people, any block</th>
                    {LOBBY_COLUMNS.map((col) => {
                      const p = priceFor(lobby, col.duration);
                      return (
                        <td key={col.duration} className="p-4 font-bold whitespace-nowrap">
                          {p ? lkr(p.price) : <span className="font-normal text-brand-dark/40">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="mt-16">
          <div className="border-b border-brand-dark/10 pb-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Book a meeting room</h2>
          </div>
          {meetingRooms.length === 0 ? (
            <p className="mt-6 text-sm text-brand-dark/50">No meeting rooms are available to book right now.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              {meetingRooms.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What&apos;s included</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-brand-dark/75">
              {[
                `WiFi on ${BUSINESS.internet.long}`,
                "Daily data package: 4–15 GB depending on the room and booking length",
                "Backup power generator, so meetings continue through power cuts",
                "Air conditioning and private rooms, including a soundproof room",
                "Unlimited Nescafé coffee and Nest tea",
                "Instant online confirmation, with guest checkout (no account needed)",
              ].map((line) => (
                <li key={line} className="flex gap-3">
                  <span className="text-brand font-bold">✓</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Optional add-ons</h2>
            {equipmentAddons.length === 0 ? (
              <p className="mt-6 text-sm text-brand-dark/60">
                Projectors, screens, monitors and extra data can be added at checkout.
              </p>
            ) : (
              <ul className="mt-6 divide-y divide-brand-dark/5 rounded-2xl border border-brand-dark/10 bg-white text-sm">
                {equipmentAddons.map((addon) => (
                  <li key={addon.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <span>{addon.name.replace(/^Rent - /, "").replace(/\s+/g, " ")}</span>
                    <span className="font-bold whitespace-nowrap">{lkr(addon.price)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What people book our rooms for</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-brand-dark/5 bg-white p-6">
                <h3 className="font-bold text-base">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-dark/65">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How to book a meeting room</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              "Open the booking page and pick a room.",
              "Choose a date and a half-day, full-day, evening or unlimited slot. Availability updates live.",
              "Add a projector, screen or extra data if you need it.",
              "Pay by card or bank/QR transfer and get your confirmation by email.",
            ].map((step, i) => (
              <li key={step} className="rounded-2xl border border-brand-dark/5 bg-white p-6 text-sm leading-relaxed text-brand-dark/75">
                <span className="block text-2xl font-extrabold text-brand">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-16 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Where the meeting rooms are</h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-dark/75">
              {BUSINESS.address.building}, {FULL_ADDRESS}.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-brand-dark/75">{BUSINESS.landmarks}.</p>
            <p className="mt-2 text-sm leading-relaxed text-brand-dark/75">
              About 10 minutes from Maharagama and roughly 30 minutes from Kadawatha via the expressway, with limited
              on-site parking. Open {BUSINESS.hours.days}, {BUSINESS.hours.display}.
            </p>
            <p className="mt-4 text-sm text-brand-dark/60">
              Need a desk instead? See{" "}
              <Link href="/coworking-space-kottawa" className="text-brand font-semibold hover:underline">
                coworking in Kottawa
              </Link>
              .
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border min-h-[280px]">
            <iframe
              title={`Map: Cowork.lk meeting rooms, ${FULL_ADDRESS}`}
              src={`${BUSINESS.mapUrl}&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 280 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-brand-dark/5 bg-white p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand">
              Need Something Bigger?
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-brand-dark">
              Planning a training session or event?
            </h2>
            <p className="text-sm text-brand-dark/65 max-w-xl leading-relaxed">
              Tell us your group size and date, and we&apos;ll suggest the right setup.
            </p>
          </div>
          <Link
            href="/contact"
            className="group inline-flex items-center gap-1.5 rounded-xl border border-brand-dark/20 px-6 py-3 text-sm font-bold text-brand-dark transition-all hover:bg-brand-dark/5 hover:border-brand-dark whitespace-nowrap"
          >
            Contact Us
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Meeting room rental FAQ</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-brand-dark/5 bg-white p-6">
                <h3 className="font-bold text-sm text-brand-dark">{faq.question}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-dark/65">{faq.answer}</p>
              </div>
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
