import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata = {
  title: "Contact Us | Cowork.lk",
  description: "Get in touch with Cowork Lanka. Send us a message, find our phone number, email address, and Google Map location.",
  alternates: { canonical: "/contact" },
  openGraph: {
    siteName: "Cowork.lk",
    title: "Contact Us | Cowork.lk",
    description: "Get in touch with Cowork Lanka. Send us a message, find our phone number, email address, and Google Map location.",
    url: "/contact",
    images: ["/opengraph-image"],
  },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 md:py-20">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">Contact Us</h1>
        <p className="text-lg text-muted-foreground">
          Have questions about our workspaces, bookings, or amenities? Drop us a line or visit us.
        </p>

        <hr className="my-8" />

        <div className="grid gap-10 md:grid-cols-2">
          {/* Contact Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-brand-dark mb-2">Cowork Lanka (Pvt) Ltd</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                279 Avissawella Road,
                <br />
                Pannipitiya 10230,
                <br />
                Sri Lanka.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-dark mb-1">Phone &amp; WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                <a href="tel:+94774884040" className="hover:text-brand transition-colors">
                  +94 77 488 4040
                </a>
              </p>
              <div className="mt-3">
                <a
                  href="https://wa.me/94774884040?text=Hi%20Cowork%20Lanka,%20I%20have%20a%20question%20about%20your%20spaces."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 transition-colors"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.197 1.45 4.817 1.451 5.463 0 9.909-4.444 9.912-9.91.002-2.65-1.02-5.139-2.877-6.998C16.643 1.838 14.156 1.8 11.514 1.8c-5.469 0-9.915 4.444-9.919 9.91-.001 1.745.459 3.447 1.336 4.965l-.982 3.582 3.698-.973zm12.67-5.761c-.322-.162-1.91-.942-2.206-1.05-.297-.109-.513-.162-.73.162-.216.324-.838 1.05-1.028 1.267-.19.216-.379.243-.702.08-.323-.162-1.362-.502-2.596-1.602-.96-.856-1.607-1.912-1.796-2.236-.19-.324-.02-.5-.181-.661-.146-.145-.323-.379-.485-.568-.162-.189-.216-.324-.324-.54-.108-.217-.054-.405-.027-.567.027-.162.216-.513.324-.676.108-.162.146-.27.217-.459.072-.189.036-.351-.018-.513-.054-.162-.513-1.242-.703-1.702-.186-.447-.372-.387-.513-.394-.132-.007-.284-.008-.436-.008s-.401.057-.61.286c-.21.229-.798.784-.798 1.91 0 1.127.818 2.217.932 2.37.114.153 1.61 2.458 3.901 3.45.545.235.97.375 1.302.48.548.174 1.047.15 1.442.09.44-.067 1.91-.78 2.18-1.536.27-.756.27-1.405.19-1.536-.082-.136-.298-.217-.62-.379z"/>
                  </svg>
                  Chat on WhatsApp
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-brand-dark mb-1">Email Address</h3>
              <p className="text-sm text-muted-foreground">hello@cowork.lk</p>
            </div>
            <div className="rounded-lg bg-muted/40 p-4 border text-xs text-muted-foreground">
              <strong>Operating Hours:</strong> Monday – Sunday: 8:00 AM – 8:00 PM
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-brand-dark mb-4">Send a Message</h2>
            <form className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john@example.com" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" rows={4} placeholder="How can we help you?" />
              </div>
              <Button type="submit" className="w-full bg-brand text-white hover:bg-brand/90">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
