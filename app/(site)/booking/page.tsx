import { createClient } from "@/lib/supabase/server";
import { getActiveSpaces } from "@/lib/data/spaces";
import { SpaceCard } from "@/components/booking/SpaceCard";
import Link from "next/link";

export const metadata = {
  title: "Book a Space | Cowork.lk",
  description: "Browse premium coworking hot desks, dedicated workspaces, and meeting rooms. Book online instantly.",
  alternates: { canonical: "/booking" },
  openGraph: {
    siteName: "Cowork.lk",
    title: "Book a Space | Cowork.lk",
    description: "Browse premium coworking hot desks, dedicated workspaces, and meeting rooms. Book online instantly.",
    url: "/booking",
  },
};

export default async function BookingPage() {
  const supabase = createClient();
  const spaces = await getActiveSpaces(supabase);

  const spacesJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: spaces.map((space, index) => {
      const lowestPrice = space.pricing.reduce(
        (min, p) => (p.price < min ? p.price : min),
        space.pricing[0]?.price ?? 0
      );
      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: space.name,
          description: space.description ?? `${space.name} at Cowork.lk, Pannipitiya, Sri Lanka.`,
          url: `${process.env.NEXT_PUBLIC_URL || "https://cowork.lk"}/booking/${space.id}`,
          offers: {
            "@type": "Offer",
            priceCurrency: "LKR",
            price: lowestPrice,
            availability: "https://schema.org/InStock",
          },
        },
      };
    }),
  };

  return (
    <div className="bg-background min-h-screen text-brand-dark pb-24">
      {spaces.length > 0 ? (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(spacesJsonLd) }}
        />
      ) : null}

      {/* Decorative Curves (consistent with Home) */}
      <div className="absolute top-0 right-0 pointer-events-none opacity-10 hidden md:block">
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
          <circle cx="300" cy="100" r="180" stroke="#F9A440" strokeWidth="2" />
          <circle cx="300" cy="100" r="130" stroke="#F9A440" strokeWidth="1.5" strokeDasharray="5 5" />
        </svg>
      </div>

      <main className="mx-auto max-w-6xl px-4 pt-12 relative">
        {/* Banner Section */}
        <div className="max-w-2xl space-y-4 mb-16">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Book Your Spot,
            <br />
            Join the Community
            <br />
            <span className="text-brand">Let&apos;s Cowork!</span>
          </h1>
          <p className="text-sm text-brand-dark/65 max-w-lg leading-relaxed pt-2">
            Explore our curated list of workspace offerings. Find the perfect environment for your productive day, or book private, soundproofed spaces for your team huddles.
          </p>
        </div>

        {/* Offerings Grid */}
        <div className="space-y-4">
          <div className="border-b border-brand-dark/10 pb-4">
            <h2 className="text-xl font-bold tracking-tight text-brand-dark">
              Explore Our Offerings
            </h2>
          </div>

          {spaces.length === 0 ? (
            <p className="text-sm text-brand-dark/50">No spaces are available to book right now.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 mt-8">
              {spaces.map((space) => (
                <SpaceCard key={space.id} space={space} />
              ))}
            </div>
          )}
        </div>

        {/* Custom Offering Banner */}
        <section className="mt-20 rounded-2xl border border-brand-dark/5 bg-white p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand">
              Custom Offering
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-brand-dark">
              Seeking a Tailored Workspace Solution?
            </h3>
            <p className="text-sm text-brand-dark/65 max-w-xl leading-relaxed">
              Let&apos;s customize your workspace experience. Reach out to explore tailored options for dedicated teams, private custom offices, or larger event settings.
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
      </main>
    </div>
  );
}
