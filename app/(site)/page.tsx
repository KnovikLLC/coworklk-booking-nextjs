import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Cowork.lk | Premium Coworking Space in Pannipitiya, Sri Lanka",
  description:
    "Discover hot desks, dedicated workspaces, and fully-equipped meeting rooms at Cowork Lanka (Pannipitiya). Book online with real-time availability.",
};

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brand-dark via-gray-900 to-black py-20 text-white md:py-32">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Work Better, Together at <span className="text-brand">Cowork.lk</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/80 md:text-xl">
            Premium coworking space in Pannipitiya, Sri Lanka. Fully-equipped hot desks, private workspaces, meeting rooms, and studio spaces, available with instant real-time booking.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-brand text-white hover:bg-brand/90">
              <Link href="/booking">Book a Space</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10 hover:text-white">
              <Link href="/about">Explore Spaces</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
              Why Cowork.lk?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Everything you need to focus on your work, connect with a vibrant community, and scale your business.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-md bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                ⚡
              </div>
              <h3 className="mt-4 text-lg font-semibold text-brand-dark">High-Speed Connectivity</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Ultra-fast, redundant fibre-optic internet connection. Every room booking includes complimentary data allocation.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-md bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                🤝
              </div>
              <h3 className="mt-4 text-lg font-semibold text-brand-dark">Professional Meeting Rooms</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Acoustically treated meeting rooms (4-seater, 5-seater, creative studios) equipped with monitors and projection screens.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-md bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                🎁
              </div>
              <h3 className="mt-4 text-lg font-semibold text-brand-dark">Member Loyalty Discounts</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Enjoy 10% off your booking automatically if you are a returning member with booking activity in the last 30 days.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-md bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                💼
              </div>
              <h3 className="mt-4 text-lg font-semibold text-brand-dark">Zoho Invoice Integration</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Seamless, automated generation of tax-compliant digital invoices and receipts synced directly with Zoho Books.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-md bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                ☕
              </div>
              <h3 className="mt-4 text-lg font-semibold text-brand-dark">Refreshments & Amenities</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Complimentary tea, premium coffee, water, clean washrooms, backup generator, and printing facilities on-site.
              </p>
            </div>
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="h-10 w-10 rounded-md bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                🕒
              </div>
              <h3 className="mt-4 text-lg font-semibold text-brand-dark">Instant Real-Time Booking</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Search available slots and pay online via PayHere or make bank/QR transfers. Confirmations are instantaneous.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Spaces Showcase */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
            Choose Your Workspace
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            From flexible hot desks to private meeting rooms, find the ideal setting for your productive day.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 text-left">
            <div className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
              <div className="h-48 bg-gray-100 bg-[url('/images/spaces/hot_desk.jpg')] bg-cover bg-center" />
              <div className="p-5">
                <h3 className="text-lg font-semibold text-brand-dark">Hot Desks</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Flexible desks in our shared collaborative open layout. Great for freelancers and remote workers.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-dark">From LKR 490</span>
                  <Link href="/booking" className="text-sm font-bold text-brand hover:underline">Book →</Link>
                </div>
              </div>
            </div>
            <div className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
              <div className="h-48 bg-gray-100 bg-[url('/images/spaces/workspace.jpg')] bg-cover bg-center" />
              <div className="p-5">
                <h3 className="text-lg font-semibold text-brand-dark">Dedicated Workspaces</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Your own dedicated desk with ergonomically designed seating and storage. Perfect for focused work.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-dark">From LKR 790</span>
                  <Link href="/booking" className="text-sm font-bold text-brand hover:underline">Book →</Link>
                </div>
              </div>
            </div>
            <div className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
              <div className="h-48 bg-gray-100 bg-[url('/images/spaces/meeting_room.jpg')] bg-cover bg-center" />
              <div className="p-5">
                <h3 className="text-lg font-semibold text-brand-dark">Private Meeting Rooms</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Soundproofed rooms for team huddles, workshops, and client presentations. Accommodates 4-5 pax.
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-brand-dark">From LKR 3,450</span>
                  <Link href="/booking" className="text-sm font-bold text-brand hover:underline">Book →</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
