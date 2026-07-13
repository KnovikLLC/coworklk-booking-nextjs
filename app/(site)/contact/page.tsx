import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata = {
  title: "Contact Us | Cowork.lk",
  description: "Get in touch with Cowork Lanka. Send us a message, find our phone number, email address, and Google Map location.",
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
              <h3 className="text-base font-semibold text-brand-dark mb-1">Phone Number</h3>
              <p className="text-sm text-muted-foreground">+94 77 488 4040</p>
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
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
