import Link from "next/link";
import Image from "next/image";

const FAQS = [
  {
    question: "Where is Cowork.lk located?",
    answer:
      "Cowork.lk is at 279 Avissawella Road, Pannipitiya 10230, Western Province, Sri Lanka, open Monday to Sunday, 8:00 AM to 8:00 PM.",
  },
  {
    question: "What coworking spaces can I book?",
    answer:
      "Hot desks and workspace seats from LKR 699, 4- and 5-seater meeting rooms from LKR 1,750, creative studios from LKR 1,500, and a classroom space from LKR 4,990 — all bookable online with real-time availability.",
  },
  {
    question: "Is WiFi included at Cowork.lk?",
    answer:
      "Yes. Every space includes free WiFi on SLT Mobitel Fiber, plus unlimited coffee and tea, lounge access, and a foosball table.",
  },
  {
    question: "How do I pay for a booking?",
    answer:
      "You can pay online by card through Stripe, or via QR/bank transfer with admin verification. Returning members who completed a booking in the prior 30 days automatically get a 10% discount.",
  },
  {
    question: "Can I book a coworking space without signing up?",
    answer:
      "Yes, guest checkout is available for any space. You can optionally convert to a full member account right after checkout to track bookings and unlock the loyalty discount.",
  },
];

export const metadata = {
  title: "Cowork.lk | Premium Coworking Space in Pannipitiya, Sri Lanka",
  description:
    "Discover hot desks, dedicated workspaces, and fully-equipped meeting rooms at Cowork Lanka (Pannipitiya). Book online with real-time availability.",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "Cowork.lk",
    title: "Cowork.lk | Premium Coworking Space in Pannipitiya, Sri Lanka",
    description:
      "Discover hot desks, dedicated workspaces, and fully-equipped meeting rooms at Cowork Lanka (Pannipitiya). Book online with real-time availability.",
    url: "/",
  },
};

export default function HomePage() {
  return (
    <div className="flex flex-col bg-background min-h-screen text-brand-dark pb-16">
      {/* Decorative Top Curve SVG decoration (from Figma Mockup) */}
      <div className="absolute top-0 right-0 pointer-events-none opacity-20 hidden md:block">
        <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
          <circle cx="300" cy="100" r="180" stroke="#F9A440" strokeWidth="2" />
          <circle cx="300" cy="100" r="130" stroke="#F9A440" strokeWidth="1.5" strokeDasharray="5 5" />
        </svg>
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl w-full px-4 pt-16 pb-20 relative">
        <div className="max-w-2xl space-y-6">
          <span className="text-xs uppercase font-extrabold tracking-widest text-brand-dark/40">
            Welcome
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl leading-[1.08] text-brand-dark">
            Work Solo,
            <br />
            Collaborate Together.
            <br />
            <span className="text-brand">Let&apos;s Cowork!</span>
          </h1>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Link
              href="/booking"
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-7 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-brand/95 hover:-translate-y-0.5"
            >
              Book a Space
              <span>→</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full border-2 border-brand flex items-center justify-center text-brand font-bold text-lg bg-white/50 cursor-pointer">
                ▶
              </div>
              <div>
                <p className="text-sm font-bold text-brand-dark">Cowork Tour</p>
                <p className="text-xs text-brand font-semibold uppercase tracking-wider">Coming Soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Our Offerings */}
      <section className="mx-auto max-w-6xl w-full px-4 py-16">
        <div className="flex items-end justify-between border-b border-brand-dark/10 pb-4">
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
            Explore Our Offerings
          </h2>
          <Link href="/booking" className="text-xs font-bold text-brand-dark/50 hover:text-brand transition-colors">
            View All
          </Link>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Workspace */}
          <div className="group rounded-2xl border border-brand-dark/5 bg-white p-6 text-center transition-all hover:border-brand/20 hover:shadow-md">
            <div className="mx-auto h-16 w-16 rounded-full bg-brand/5 text-brand flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              🪑
            </div>
            <h3 className="mt-4 text-base font-bold text-brand-dark">Workspace</h3>
            <p className="mt-1 text-xs text-brand-dark/45">Starting 699.00 LKR</p>
          </div>

          {/* Card 2: Meeting Room */}
          <div className="group rounded-2xl border border-brand-dark/5 bg-white p-6 text-center transition-all hover:border-brand/20 hover:shadow-md">
            <div className="mx-auto h-16 w-16 rounded-full bg-brand/5 text-brand flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              👥
            </div>
            <h3 className="mt-4 text-base font-bold text-brand-dark">Meeting Room</h3>
            <p className="mt-1 text-xs text-brand-dark/45">Starting 1,750.00 LKR</p>
          </div>

          {/* Card 3: Creative Studio */}
          <div className="group rounded-2xl border border-brand-dark/5 bg-white p-6 text-center transition-all hover:border-brand/20 hover:shadow-md">
            <div className="mx-auto h-16 w-16 rounded-full bg-brand/5 text-brand flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              🎬
            </div>
            <h3 className="mt-4 text-base font-bold text-brand-dark">Creative Studio</h3>
            <p className="mt-1 text-xs text-brand-dark/45">Starting 1,500.00 LKR</p>
          </div>

          {/* Card 4: Classroom */}
          <div className="group rounded-2xl border border-brand-dark/5 bg-white p-6 text-center transition-all hover:border-brand/20 hover:shadow-md">
            <div className="mx-auto h-16 w-16 rounded-full bg-brand/5 text-brand flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
              🎓
            </div>
            <h3 className="mt-4 text-base font-bold text-brand-dark">Classroom</h3>
            <p className="mt-1 text-xs text-brand-dark/45">Starting 4,990.00 LKR</p>
          </div>
        </div>
      </section>

      {/* Welcome to Cowork (Collaboration section) */}
      <section className="mx-auto max-w-6xl w-full px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Mock photo with rounded-2xl borders */}
          <div className="relative h-96 w-full rounded-[24px] overflow-hidden bg-white border border-brand-dark/10 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-dark/10 to-brand/10 z-10" />
            <Image
              src="/images/spaces/placeholder.svg"
              alt="Collaboration"
              fill
              className="object-cover"
            />
            {/* Overlay badge representation */}
            <div className="absolute bottom-6 left-6 z-20 bg-white/90 backdrop-blur rounded-xl p-4 shadow-sm border border-white max-w-xs">
              <p className="text-[10px] uppercase font-extrabold tracking-wider text-brand">Vibrant Community</p>
              <p className="text-xs font-bold text-brand-dark mt-1">Networking and events happen every month.</p>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl leading-tight">
              Welcome to <span className="text-brand">Cowork</span> Where Collaboration Thrives!
            </h2>
            <p className="text-sm leading-relaxed text-brand-dark/70">
              At Cowork, we foster creativity and connection in our vibrant coworking community. Join us to collaborate, innovate, and thrive together! We offer the premium utilities and amenities tailored to help you scale.
            </p>
            <div className="pt-2">
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-dark/20 px-5 py-2.5 text-sm font-bold text-brand-dark transition-colors hover:bg-brand-dark/5"
              >
                Learn More
                <span>→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Unlock Your Workspace Experience */}
      <section className="mx-auto max-w-6xl w-full px-4 py-16">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
            Unlock Your Workspace
          </h2>
          <p className="text-brand text-lg font-bold">Experience</p>
          <p className="text-xs uppercase font-extrabold tracking-widest text-brand-dark/40 pt-2">
            Discover Amenities, Features & Facilities
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Amenity 1 */}
          <div className="rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-4">
            <span className="text-2xl text-brand block">📡</span>
            <div>
              <h3 className="font-bold text-sm text-brand-dark">Free WiFi (Fiber)</h3>
              <p className="mt-1.5 text-xs text-brand-dark/60 leading-relaxed">
                SLT Mobitel Fiber lines will keep you connected the fastest way possible.
              </p>
            </div>
          </div>

          {/* Amenity 2 */}
          <div className="rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-4">
            <span className="text-2xl text-brand block">☕</span>
            <div>
              <h3 className="font-bold text-sm text-brand-dark">Free Unlimited Coffee / Tea</h3>
              <p className="mt-1.5 text-xs text-brand-dark/60 leading-relaxed">
                Unlimited Nescafé & Nest Tea for your refreshment.
              </p>
            </div>
          </div>

          {/* Amenity 3 */}
          <div className="rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-4">
            <span className="text-2xl text-brand block">🛋️</span>
            <div>
              <h3 className="font-bold text-sm text-brand-dark">Lounge Area Access</h3>
              <p className="mt-1.5 text-xs text-brand-dark/60 leading-relaxed">
                Be relaxed and enjoy the lobby area with all the bean bags and vibrant vibes.
              </p>
            </div>
          </div>

          {/* Amenity 4 */}
          <div className="rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-4">
            <span className="text-2xl text-brand block">🤝</span>
            <div>
              <h3 className="font-bold text-sm text-brand-dark">24/7 Customer Support</h3>
              <p className="mt-1.5 text-xs text-brand-dark/60 leading-relaxed">
                We&apos;ll be there in a minute to assist and guide you with your requirements.
              </p>
            </div>
          </div>

          {/* Amenity 5 */}
          <div className="rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-4">
            <span className="text-2xl text-brand block">⚽</span>
            <div>
              <h3 className="font-bold text-sm text-brand-dark">Play Area (Foosball)</h3>
              <p className="mt-1.5 text-xs text-brand-dark/60 leading-relaxed">
                Stressed & tired? Bond & Enjoy a fun game of Foosball.
              </p>
            </div>
          </div>

          {/* Amenity 6 */}
          <div className="rounded-2xl border border-brand-dark/5 bg-white p-6 space-y-4">
            <span className="text-2xl text-brand block">📅</span>
            <div>
              <h3 className="font-bold text-sm text-brand-dark">Networking & Events</h3>
              <p className="mt-1.5 text-xs text-brand-dark/60 leading-relaxed">
                We create more exciting opportunities to increase your network.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl w-full px-4 py-16">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-brand-dark sm:text-3xl">
            Frequently Asked Questions
          </h2>
        </div>
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

      {/* WhatsApp Community Banner */}
      <section className="mx-auto max-w-6xl w-full px-4 py-12">
        <div className="rounded-2xl border border-brand-dark/5 bg-white p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#25D366]">
              WhatsApp Community
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-brand-dark">
              Join Our Growing Community
            </h3>
            <p className="text-sm text-brand-dark/65 max-w-xl leading-relaxed">
              Stay connected with fellow Cowork members, get notified about upcoming events, exclusive offers, and be the first to know what&apos;s happening. It&apos;s free — just one tap away.
            </p>
          </div>
          <a
            href="https://chat.whatsapp.com/FUHL35hZvOs35O4oeyexpa"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#20BD5A] hover:shadow-sm whitespace-nowrap"
          >
            Join WhatsApp Community
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      </section>
    </div>
  );
}
