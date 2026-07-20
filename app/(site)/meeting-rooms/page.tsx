import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpaces } from "@/lib/data/spaces";
import { SpaceCard } from "@/components/booking/SpaceCard";

const TITLE = "Meeting Rooms & Conference Rooms in Pannipitiya | Cowork.lk";
const DESCRIPTION =
  "Book private meeting rooms and conference rooms in Pannipitiya, Sri Lanka. Half-day, full-day, and unlimited access, with real-time availability and instant online booking.";

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

const FAQS = [
  {
    question: "Do you have conference rooms for rent near Pannipitiya?",
    answer:
      "Yes. Cowork.lk has private 4-seater and 5-seater meeting rooms at 349/A/3 Avissawella Road, Pannipitiya — 5 minutes from Kottawa and 10 minutes from Maharagama, bookable online with real-time availability.",
  },
  {
    question: "Can I book a meeting room for half a day?",
    answer:
      "Yes. Every meeting room is bookable by half-day, full-day, or unlimited day access — there are no hourly conference room slots, so pricing is fixed and predictable for the block you choose.",
  },
  {
    question: "Do you have conference facilities for larger groups?",
    answer:
      "Our largest private conference room seats up to 5 people. For larger conference venues or custom setups, contact us directly and we'll help arrange a tailored solution.",
  },
  {
    question: "What's included with a meeting room booking?",
    answer:
      "Every meeting room includes free fiber WiFi, air conditioning, and unlimited coffee and tea, with the booking confirmed instantly online.",
  },
];

export default async function MeetingRoomsPage() {
  const supabase = createClient();
  const spaces = await getActiveSpaces(supabase);
  const meetingRooms = spaces.filter((space) => space.type.startsWith("meeting_room"));

  return (
    <div className="bg-background min-h-screen text-brand-dark pb-24">
      <main className="mx-auto max-w-6xl px-4 pt-12">
        <div className="max-w-2xl space-y-4 mb-16">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-dark/40">
            Conference &amp; Meeting Rooms
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Meeting Rooms &amp; Conference Rooms in Pannipitiya
          </h1>
          <p className="text-sm text-brand-dark/65 max-w-lg leading-relaxed pt-2">
            Private, soundproofed conference rooms for interviews, client meetings, and team huddles — a
            few minutes from Kottawa and Maharagama. Book online with real-time availability and instant
            confirmation, no calls needed to check a conference hall&apos;s availability.
          </p>
        </div>

        <div className="space-y-4">
          <div className="border-b border-brand-dark/10 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-brand-dark">Our Meeting Rooms</h2>
          </div>

          {meetingRooms.length === 0 ? (
            <p className="text-sm text-brand-dark/50">No meeting rooms are available to book right now.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              {meetingRooms.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}
        </div>

        <section className="mt-20 rounded-2xl border border-brand-dark/5 bg-white p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand">
              Need Something Bigger?
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-brand-dark">
              Looking for a Larger Conference Venue?
            </h3>
            <p className="text-sm text-brand-dark/65 max-w-xl leading-relaxed">
              Reach out to discuss conference facilities for larger groups, training sessions, or
              multi-day events.
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

        <section className="mt-20">
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {FAQS.map((faq) => (
              <div key={faq.question} className="rounded-2xl border border-brand-dark/5 bg-white p-6">
                <h3 className="font-bold text-sm text-brand-dark">{faq.question}</h3>
                <p className="mt-2 text-xs leading-relaxed text-brand-dark/65">{faq.answer}</p>
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
                mainEntity: FAQS.map((faq) => ({
                  "@type": "Question",
                  name: faq.question,
                  acceptedAnswer: { "@type": "Answer", text: faq.answer },
                })),
              }),
            }}
          />
        </section>
      </main>
    </div>
  );
}
