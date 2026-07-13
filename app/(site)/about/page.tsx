export const metadata = {
  title: "About Us | Cowork.lk",
  description: "Learn more about Cowork Lanka (Pvt) Ltd, our story, mission, and the premium coworking workspace we provide in Pannipitiya.",
  alternates: { canonical: "/about" },
  openGraph: {
    siteName: "Cowork.lk",
    title: "About Us | Cowork.lk",
    description: "Learn more about Cowork Lanka (Pvt) Ltd, our story, mission, and the premium coworking workspace we provide in Pannipitiya.",
    url: "/about",
    images: ["/opengraph-image"],
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">About Cowork.lk</h1>
        <p className="text-lg text-muted-foreground">
          Cowork Lanka (Pvt) Ltd is a premier workspace solutions provider based in Pannipitiya, Sri Lanka. Our mission is to build highly productive, inspiring, and collaborative environments for professionals, entrepreneurs, freelancers, and small teams.
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
            Our central location at 279 Avissawella Road, Pannipitiya, offers excellent accessibility. The facility features a backup power generator (ensuring 100% uptime during load shedding), dedicated clean washrooms, comfortable breakout zones, and safe on-premise parking.
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
      </div>
    </main>
  );
}
