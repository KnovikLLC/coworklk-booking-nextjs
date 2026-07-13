export const metadata = {
  title: "About Us | Cowork.lk",
  description: "Learn more about Cowork Lanka (Pvt) Ltd, our story, mission, and the premium coworking workspace we provide in Pannipitiya.",
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
      </div>
    </main>
  );
}
