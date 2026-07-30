const TITLE = "Coworking & Office Space Rental FAQ | Cowork.lk";
const DESCRIPTION =
  "Answers to common questions about coworking spaces and office rental at Cowork.lk, Pannipitiya — pricing, day passes, amenities, hours, cancellations, and more.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: {
    siteName: "Cowork.lk",
    title: TITLE,
    description: DESCRIPTION,
    url: "/faq",
    images: ["/opengraph-image"],
  },
};

// Question set drawn from research into what people actually ask about
// coworking spaces and short-term office rental (pricing/membership,
// day-office rentals, amenities, access, contracts, community). Every
// answer reflects how Cowork.lk actually operates today — where the
// research surfaced something Cowork.lk doesn't offer (24/7 access,
// hourly booking on every space, multiple locations), the answer says so
// rather than implying otherwise.
const FAQ_GROUPS: { heading: string; items: { question: string; answer: string }[] }[] = [
  {
    heading: "Pricing & Membership",
    items: [
      {
        question: "How much does it cost to book a space at Cowork.lk?",
        answer:
          "Pricing depends on the space and how long you book it: hot desks from LKR 490, workspace seats from LKR 790, and 4- and 5-seater meeting rooms from LKR 3,450, each with half-day, full-day, and unlimited-access pricing tiers.",
      },
      {
        question: "What's the difference between a hot desk, a workspace seat, and a meeting room?",
        answer:
          "A hot desk is a flexible, open-seating desk for individual work. A workspace seat is a similar individual desk in the shared work area. A meeting room is a private, bookable room (4- or 5-seater) for calls, interviews, or team sessions.",
      },
      {
        question: "Is there a discount for regular members?",
        answer:
          "Yes. Members who complete a booking and then book again within 30 days automatically get a 10% discount applied to their next booking.",
      },
      {
        question: "Do I need to sign a long-term lease or contract?",
        answer:
          "No. Every space is booked by the slot — half-day, full-day, or unlimited access for that day — with no lease, membership contract, or minimum commitment.",
      },
    ],
  },
  {
    heading: "Renting Office Space for a Day",
    items: [
      {
        question: "Can I rent office space for just a day?",
        answer:
          "Yes. Every space at Cowork.lk offers a full-day pricing option, so you can book a desk, workspace seat, or meeting room for a single day with no ongoing commitment.",
      },
      {
        question: "Can I book a space by the hour?",
        answer:
          "Only the Lobby Area is bookable by the hour (1-hour or 2-hour slots). Hot desks, workspace seats, and meeting rooms are booked in half-day, full-day, or unlimited-access blocks rather than by the hour.",
      },
      {
        question: "Do I need to be a member to book a day pass?",
        answer:
          "No. Guest checkout is available for any space — you can book and pay without creating an account, and optionally convert to a member afterward to unlock the loyalty discount.",
      },
    ],
  },
  {
    heading: "Amenities & Facilities",
    items: [
      {
        question: "Is WiFi included?",
        answer: "Yes, every space includes free WiFi on SLT Mobitel Fiber at no extra charge.",
      },
      {
        question: "Is coffee or tea provided?",
        answer: "Yes, unlimited Nescafé coffee and Nest tea are included free with every booking.",
      },
      {
        question: "Is parking available on-site?",
        answer: "Yes, Cowork.lk has safe on-premise parking, though space for vehicles is limited.",
      },
      {
        question: "What happens if there's a power outage?",
        answer:
          "The facility runs a backup power generator, so bookings continue uninterrupted during load shedding or grid outages.",
      },
    ],
  },
  {
    heading: "Access & Hours",
    items: [
      {
        question: "What are Cowork.lk's operating hours?",
        answer:
          "Cowork.lk is open Monday to Sunday, 8:00 AM to 8:00 PM. It is not a 24/7 space — all bookings fall within these hours.",
      },
      {
        question: "Where is Cowork.lk located, and is it easy to reach?",
        answer:
          "Cowork.lk is at 349/A/3 Avissawella Road, Pannipitiya 10230 — about 5 minutes from Kottawa, 10 minutes from Maharagama, and within a 30-minute drive from Kadawatha via the expressway.",
      },
    ],
  },
  {
    heading: "Payments & Cancellations",
    items: [
      {
        question: "How do I pay for a booking?",
        answer:
          "You can pay online by card through Stripe, or via bank/QR transfer with admin verification before your booking is confirmed.",
      },
      {
        question: "What is the cancellation and refund policy?",
        answer:
          "Refunds are tiered by notice given: 80% back if you cancel more than 24 hours before your booking, 50% back for 4–24 hours' notice, and no refund for cancellations inside 4 hours.",
      },
    ],
  },
  {
    heading: "Community",
    items: [
      {
        question: "Is Cowork.lk just desks, or is there a community aspect?",
        answer:
          "Cowork.lk runs an active WhatsApp community and hosts regular events — member celebrations, creative recording sessions, foosball tournaments, and training workshops — alongside the day-to-day desk and meeting room bookings.",
      },
    ],
  },
];

const ALL_FAQS = FAQ_GROUPS.flatMap((group) => group.items);

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
          Coworking &amp; Office Space Rental FAQ
        </h1>
        <p className="text-lg text-muted-foreground">
          Answers to the questions people most often ask about coworking spaces and short-term office
          rental, as they apply to Cowork.lk in Pannipitiya.
        </p>
      </div>

      <div className="mt-10 space-y-12">
        {FAQ_GROUPS.map((group) => (
          <section key={group.heading}>
            <h2 className="text-xl font-semibold text-brand-dark mb-4">{group.heading}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {group.items.map((faq) => (
                <div key={faq.question} className="rounded-xl border bg-white p-5 shadow-sm">
                  <h3 className="font-bold text-sm text-brand-dark">{faq.question}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: ALL_FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }),
        }}
      />
    </main>
  );
}
