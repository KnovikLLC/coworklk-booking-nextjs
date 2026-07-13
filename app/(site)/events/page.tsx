import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "Events | Cowork.lk",
  description:
    "Explore past and upcoming events at Cowork.lk — from member celebrations to creative recording sessions, our community is always buzzing.",
};

const PAST_EVENTS = [
  {
    title: "Christmas Celebration 2024",
    description:
      "Our members came together for a festive evening of food, laughter, and holiday cheer. A night to remember at Cowork!",
    images: [
      "/images/events/Christmas-Event.jpg",
      "/images/events/Christmas-Event-2.JPG",
    ],
  },
  {
    title: "Valentine's Day Gathering",
    description:
      "Love was in the air as our community celebrated Valentine's Day with fun activities, treats, and great company.",
    images: [
      "/images/events/Valentine-day-event.JPG",
      "/images/events/valentine-2.JPG",
    ],
  },
  {
    title: "Creative Recording Sessions",
    description:
      "Our studio space hosted multiple recording sessions — podcasts, interviews, and content creation all under one roof.",
    images: [
      "/images/events/Recording-Event.JPG",
      "/images/events/Recording-Event-2.jpg",
      "/images/events/Recording-Event-3.jpg",
      "/images/events/Recording-Event-4.jpg",
    ],
  },
  {
    title: "Member Success Spotlight",
    description:
      "Celebrating the wins of our community members. At Cowork, your success is our success.",
    images: ["/images/events/CoWork-Member-Success-1.jpg"],
  },
];

export default function EventsPage() {
  return (
    <div className="bg-background min-h-screen text-brand-dark pb-24">
      <main className="mx-auto max-w-6xl px-4 pt-12">
        {/* Hero / Intro */}
        <div className="max-w-2xl space-y-4 mb-16">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand">
            Life at Cowork
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            More Than Just a Workspace —{" "}
            <span className="text-brand">It&apos;s a Community.</span>
          </h1>
          <p className="text-sm text-brand-dark/65 leading-relaxed pt-2 max-w-lg">
            At Cowork, we believe great work happens when people feel connected.
            That&apos;s why we regularly host events — from festive celebrations
            and networking mixers to creative sessions and member spotlights.
            Whether you&apos;re here for a day or a dedicated member, you&apos;re
            always part of the family.
          </p>
        </div>

        {/* What You Get */}
        <section className="mb-20">
          <h2 className="text-xl font-bold tracking-tight text-brand-dark mb-6">
            What Our Members Get
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "🎉",
                title: "Community Events",
                text: "Regular celebrations, mixers, and themed gatherings to connect with fellow members.",
              },
              {
                icon: "🎙️",
                title: "Creative Studio Access",
                text: "Book our equipped studio for podcasts, interviews, video recordings, and content creation.",
              },
              {
                icon: "🤝",
                title: "Networking Opportunities",
                text: "Meet freelancers, startup founders, and professionals from diverse industries under one roof.",
              },
              {
                icon: "🏆",
                title: "Member Spotlights",
                text: "We celebrate your wins. Share your story and get featured across our community channels.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-3"
              >
                <span className="text-2xl block">{item.icon}</span>
                <h3 className="font-bold text-sm text-brand-dark">
                  {item.title}
                </h3>
                <p className="text-xs text-brand-dark/60 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Past Events Gallery */}
        <section>
          <div className="border-b border-brand-dark/10 pb-4 mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-brand-dark">
              Past Events
            </h2>
          </div>

          <div className="space-y-20">
            {PAST_EVENTS.map((event, idx) => (
              <div key={event.title} className="space-y-6">
                {/* Event Header */}
                <div className="max-w-xl space-y-2">
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand">
                    Event {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-bold text-brand-dark">
                    {event.title}
                  </h3>
                  <p className="text-sm text-brand-dark/60 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Photo Grid */}
                <div
                  className={`grid gap-4 ${
                    event.images.length === 1
                      ? "grid-cols-1 max-w-lg"
                      : event.images.length === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {event.images.map((src, i) => (
                    <div
                      key={src}
                      className={`relative overflow-hidden rounded-[20px] border border-brand-dark/10 shadow-sm ${
                        event.images.length >= 3 && i === 0
                          ? "sm:col-span-2 h-72"
                          : "h-56"
                      }`}
                    >
                      <Image
                        src={src}
                        alt={`${event.title} - Photo ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-24 rounded-2xl border border-brand-dark/5 bg-white p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand">
              Get Involved
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-brand-dark">
              Want to Be Part of Our Next Event?
            </h3>
            <p className="text-sm text-brand-dark/65 max-w-xl leading-relaxed">
              Join the Cowork community and never miss out on networking
              opportunities, celebrations, and creative sessions. Sign up today
              and start your coworking journey.
            </p>
          </div>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-1.5 rounded-xl bg-brand-dark px-6 py-3 text-sm font-bold text-white transition-all hover:bg-brand-dark/95 hover:shadow-sm whitespace-nowrap"
          >
            Join The Community
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
