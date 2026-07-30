import Link from "next/link";

export const metadata = {
  title: "About Cowork.lk | Pannipitiya's Coworking Space & Story",
  description:
    "Meet the team behind Cowork.lk — Sri Lanka's flexible coworking space in Pannipitiya. Hot desks, private rooms & meeting rooms, no long-term lease. See why members choose us.",
  alternates: { canonical: "/about" },
  openGraph: {
    siteName: "Cowork.lk",
    title: "About Cowork.lk | Pannipitiya's Coworking Space & Story",
    description:
      "Meet the team behind Cowork.lk — Sri Lanka's flexible coworking space in Pannipitiya. Hot desks, private rooms & meeting rooms, no long-term lease. See why members choose us.",
    url: "/about",
    images: ["/opengraph-image"],
  },
};

// Entity-clarification FAQ ("what is X" queries are the content type AI
// answer engines cite most) — every answer is sourced from the real content
// already on this page (mission statement, founders, origin story below).
const ABOUT_FAQS = [
  {
    question: "What is Cowork.lk?",
    answer:
      "Cowork.lk is a coworking space in Pannipitiya, Sri Lanka, run by Cowork Lanka (Pvt) Ltd. It offers hot desks, dedicated workspaces, and meeting rooms on a flexible, slot-based booking system with real-time online availability — no long-term lease required.",
  },
  {
    question: "What is a coworking space?",
    answer:
      "A coworking space is a shared work environment where freelancers, remote employees, and small teams rent desks, private rooms, or meeting rooms instead of committing to a traditional office lease — typically with amenities like WiFi, meeting rooms, and a built-in professional community included.",
  },
  {
    question: "Who founded Cowork.lk?",
    answer:
      "Cowork.lk was founded by three co-founders — Charith, Madusanka Premaratne, and Amila Gunawardhana — who met in the Sri Lankan Online Entrepreneurs Club and built the space after experiencing the isolation of working alone as freelancers and remote developers.",
  },
  {
    question: "How is Cowork.lk different from renting a traditional office?",
    answer:
      "Cowork.lk uses slot-based bookings (hourly, half-day, or full-day) instead of long-term leases, so freelancers and small teams get office infrastructure — WiFi, meeting rooms, air conditioning — without the overhead of a fixed commercial lease.",
  },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">About Cowork.lk</h1>
        <p className="text-lg text-muted-foreground">
          Cowork Lanka (Pvt) Ltd is a premier workspace solutions provider based in Pannipitiya, Sri Lanka. Our mission is to build highly productive, inspiring, and collaborative environments for professionals, entrepreneurs, freelancers, and small teams. Explore our{" "}
          <Link href="/" className="text-brand font-semibold hover:underline">
            cowork space
          </Link>{" "}
          in Pannipitiya to see available desks, seats, and meeting rooms.
        </p>

        <hr className="my-8" />

        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">Our Mission</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We aim to democratize access to premium office infrastructure. By offering flexible hot desking, dedicated desks, meeting rooms, and shared amenities on a slot-based booking system, we empower professionals to work productively without the overheads of traditional commercial leases.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">Vibrant Community</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Beyond just physical desks and high-speed internet, we are a thriving community of local and global talents. Our workspace fosters networking, sharing of ideas, and organic collaboration, helping your business and projects grow.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-lg bg-muted/30 p-6 border">
          <h2 className="text-xl font-semibold text-brand-dark mb-3">Location &amp; Facility</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Our central location at 349/A/3 Avissawella Road, Pannipitiya, offers excellent accessibility. 5 min from Kottawa, 10 min from Maharagama and within 30min drive from Kadawatha via expressway. clean washrooms (planning for dedicated really soon), comfortable breakout zones, and safe on-premise parking for limited vehicles. Fully air conditioned, free coffee and ozone water dispenser etc.
          </p>
        </div>

        <div className="mt-12 rounded-lg bg-brand-dark/5 p-6 border border-brand/10">
          <h2 className="text-xl font-semibold text-brand-dark mb-3">Our Story</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The story of Cowork.lk began when our three co-founders met in the Sri Lankan <strong>Online Entrepreneurs Club</strong>. As independent freelancers and remote developers, they experienced firsthand the isolation and daily hassles of working alone from home. Recognizing the need for a collaborative space, they joined forces to build a vibrant community hub.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            To empower local freelancers, digital creators, and small teams, Cowork.lk offers premium workspace infrastructure at minimal, community-first prices. Our ultimate vision is to build a thriving, collaborative tech ecosystem in Sri Lanka, enabling more local professionals to export high-value IT services and bring valuable foreign currency into the country.
          </p>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-brand-dark mb-4">Our Founders</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border bg-white p-5 shadow-sm text-center">
              <h3 className="font-bold text-brand-dark text-base">Charith</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Co-Founder &amp; Designer</p>
              <a
                href="https://www.charithdesign.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold text-brand hover:underline"
              >
                Charith Design
              </a>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm text-center">
              <h3 className="font-bold text-brand-dark text-base">Madusanka Premaratne</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Co-Founder</p>
              <a
                href="https://madusankapremaratne.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold text-brand hover:underline"
              >
                madusankapremaratne.com
              </a>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-sm text-center">
              <h3 className="font-bold text-brand-dark text-base">Amila Gunawardhana</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Co-Founder</p>
              <a
                href="https://amilagunawardhana.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-bold text-brand hover:underline"
              >
                amilagunawardhana.com
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-brand-dark mb-4">Frequently Asked Questions</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ABOUT_FAQS.map((faq) => (
              <div key={faq.question} className="rounded-xl border bg-white p-5 shadow-sm">
                <h3 className="font-bold text-sm text-brand-dark">{faq.question}</h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
          <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: ABOUT_FAQS.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: { "@type": "Answer", text: faq.answer },
                })),
              }),
            }}
          />
        </div>
      </div>
    </main>
  );
}
