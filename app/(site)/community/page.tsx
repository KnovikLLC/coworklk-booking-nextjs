import Link from "next/link";

export const metadata = {
  title: "Community | Cowork.lk",
  description:
    "Join the Cowork community — connect with entrepreneurs, developers, freelancers, and professionals across Sri Lanka. Exclusive discounts, hiring opportunities, and partner perks.",
  alternates: { canonical: "/community" },
  openGraph: {
    siteName: "Cowork.lk",
    title: "Community | Cowork.lk",
    description:
      "Join the Cowork community — connect with entrepreneurs, developers, freelancers, and professionals across Sri Lanka. Exclusive discounts, hiring opportunities, and partner perks.",
    url: "/community",
    images: ["/opengraph-image"],
  },
};

const CONNECTED_COMMUNITIES = [
  {
    name: "Online Entrepreneurs Club",
    description:
      "A thriving network of digital entrepreneurs sharing strategies, insights, and opportunities to grow online businesses.",
    members: "200,000+",
    icon: "🚀",
  },
  {
    name: "Colombo Flutter Community",
    description:
      "Sri Lanka's leading Flutter developer community — meetups, workshops, and collaborative projects for mobile developers.",
    members: "300+",
    icon: "📱",
  },
  {
    name: "Freelancer Communities",
    description:
      "Multiple freelancer networks across the country — designers, writers, marketers, and developers collaborating under one roof.",
    members: "1,000+",
    icon: "💼",
  },
  {
    name: "Startup Founders Network",
    description:
      "Early-stage founders and startup teams connecting, pitching ideas, and finding co-founders within the Cowork ecosystem.",
    members: "200+",
    icon: "💡",
  },
];

const MEMBER_PERKS = [
  {
    icon: "🏷️",
    title: "Exclusive Member Discounts",
    description:
      "Community members enjoy special discounted rates on workspace bookings, meeting rooms, and studio sessions. The more you engage, the more you save.",
  },
  {
    icon: "🤝",
    title: "Hiring Opportunities",
    description:
      "Our partner companies frequently post job openings, freelance gigs, and contract work exclusively to our community members first.",
  },
  {
    icon: "🎯",
    title: "Partner Services & Perks",
    description:
      "Access discounted services from Cowork partners — accounting, legal, cloud hosting, design tools, and more at special community rates.",
  },
  {
    icon: "📢",
    title: "Early Access & Priority Booking",
    description:
      "Be the first to know about new spaces, upcoming events, and limited-time offers. Community members get priority access to book premium slots.",
  },
  {
    icon: "🎓",
    title: "Free Workshops & Training",
    description:
      "Regular skill-building sessions, tech talks, and business workshops hosted by industry experts — free for all community members.",
  },
  {
    icon: "🌏",
    title: "Island-Wide Network",
    description:
      "Connect with professionals from Colombo to Kandy and beyond. Our community spans across multiple cities and industries in Sri Lanka.",
  },
];

export default function CommunityPage() {
  return (
    <div className="bg-background min-h-screen text-brand-dark pb-24">
      <main className="mx-auto max-w-6xl px-4 pt-12">
        {/* Hero */}
        <div className="max-w-2xl space-y-4 mb-20">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-brand">
            Our Community
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
            You&apos;re Not Just Booking a Desk —{" "}
            <span className="text-brand">You&apos;re Joining a Movement.</span>
          </h1>
          <p className="text-sm text-brand-dark/65 leading-relaxed pt-2 max-w-lg">
            At Cowork, we&apos;ve built more than a workspace. We&apos;ve built a thriving
            ecosystem of entrepreneurs, developers, creatives, and professionals
            who support each other, share opportunities, and grow together. When
            you join Cowork, you gain access to an entire network.
          </p>
          <div className="pt-4">
            <a
              href="https://chat.whatsapp.com/FUHL35hZvOs35O4oeyexpa"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-7 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#20BD5A] hover:-translate-y-0.5"
            >
              Join Our WhatsApp Community
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </div>
        </div>

        {/* Connected Communities */}
        <section className="mb-20">
          <div className="border-b border-brand-dark/10 pb-4 mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-brand-dark">
              Communities We&apos;re Connected To
            </h2>
            <p className="text-sm text-brand-dark/50 mt-1">
              Our members are part of a wider network of communities across Sri Lanka
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {CONNECTED_COMMUNITIES.map((community) => (
              <div
                key={community.name}
                className="group rounded-2xl border border-brand-dark/5 bg-white p-8 space-y-4 transition-all hover:border-brand/20 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{community.icon}</span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand bg-brand/10 px-3 py-1 rounded-full">
                    {community.members} members
                  </span>
                </div>
                <h3 className="text-lg font-bold text-brand-dark">
                  {community.name}
                </h3>
                <p className="text-sm text-brand-dark/60 leading-relaxed">
                  {community.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Join — Member Perks */}
        <section className="mb-20">
          <div className="space-y-2 mb-10">
            <h2 className="text-2xl font-bold tracking-tight text-brand-dark">
              Why Join the Community?
            </h2>
            <p className="text-brand text-lg font-bold">
              Perks That Go Beyond a Desk
            </p>
            <p className="text-xs uppercase font-extrabold tracking-widest text-brand-dark/40 pt-2">
              Exclusive benefits for every member
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {MEMBER_PERKS.map((perk) => (
              <div
                key={perk.title}
                className="rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-4"
              >
                <span className="text-2xl block">{perk.icon}</span>
                <div>
                  <h3 className="font-bold text-sm text-brand-dark">
                    {perk.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-brand-dark/60 leading-relaxed">
                    {perk.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partner Opportunities */}
        <section className="mb-20">
          <div className="rounded-2xl border border-brand-dark/5 bg-white p-8 md:p-12 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏢</span>
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand">
                  Cowork Partners
                </span>
                <h2 className="text-xl font-bold text-brand-dark">
                  Hiring & Service Opportunities
                </h2>
              </div>
            </div>
            <p className="text-sm text-brand-dark/65 leading-relaxed max-w-2xl">
              Our partner companies actively seek talent from within the Cowork
              community. Whether you&apos;re a developer looking for your next
              contract, a designer seeking clients, or a startup needing team
              members — our community board regularly features opportunities
              posted by trusted partners.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 pt-4">
              <div className="rounded-xl bg-background p-4 text-center">
                <p className="text-2xl font-extrabold text-brand">50+</p>
                <p className="text-xs text-brand-dark/50 font-semibold mt-1">
                  Partner Companies
                </p>
              </div>
              <div className="rounded-xl bg-background p-4 text-center">
                <p className="text-2xl font-extrabold text-brand">Monthly</p>
                <p className="text-xs text-brand-dark/50 font-semibold mt-1">
                  Job Postings Shared
                </p>
              </div>
              <div className="rounded-xl bg-background p-4 text-center">
                <p className="text-2xl font-extrabold text-brand">Free</p>
                <p className="text-xs text-brand-dark/50 font-semibold mt-1">
                  For All Members
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark mb-8">
            How to Join
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="relative rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-3">
              <span className="text-4xl font-extrabold text-brand/20">01</span>
              <h3 className="font-bold text-sm text-brand-dark">
                Tap the Button Below
              </h3>
              <p className="text-xs text-brand-dark/60 leading-relaxed">
                Click &quot;Join Our WhatsApp Community&quot; — it takes you directly to
                our group invite link.
              </p>
            </div>
            <div className="relative rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-3">
              <span className="text-4xl font-extrabold text-brand/20">02</span>
              <h3 className="font-bold text-sm text-brand-dark">
                Introduce Yourself
              </h3>
              <p className="text-xs text-brand-dark/60 leading-relaxed">
                Tell the community who you are, what you do, and what
                you&apos;re looking for. We love meeting new faces!
              </p>
            </div>
            <div className="relative rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-3">
              <span className="text-4xl font-extrabold text-brand/20">03</span>
              <h3 className="font-bold text-sm text-brand-dark">
                Start Connecting
              </h3>
              <p className="text-xs text-brand-dark/60 leading-relaxed">
                Engage with members, attend events, grab discounts, and explore
                opportunities. Welcome to the family!
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="rounded-2xl border border-brand-dark/5 bg-white p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#25D366]">
              Ready to Join?
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-brand-dark">
              Don&apos;t Miss Out — Join Cowork Sri Lanka Community Today
            </h3>
            <p className="text-sm text-brand-dark/65 max-w-xl leading-relaxed">
              Our WhatsApp community is free, active, and full of real
              opportunities. Whether you&apos;re a solo freelancer or a growing team,
              there&apos;s a place for you here.
            </p>
          </div>
          <a
            href="https://chat.whatsapp.com/FUHL35hZvOs35O4oeyexpa"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#20BD5A] hover:shadow-sm whitespace-nowrap"
          >
            Join WhatsApp Community
            <span className="transition-transform group-hover:translate-x-0.5">
              →
            </span>
          </a>
        </section>

        {/* Browse Events link */}
        <div className="mt-12 text-center">
          <p className="text-sm text-brand-dark/50">
            Want to see what we&apos;ve been up to?{" "}
            <Link
              href="/events"
              className="font-bold text-brand hover:underline"
            >
              Browse Past Events →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
