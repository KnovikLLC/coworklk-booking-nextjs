export const metadata = {
  title: "Terms & Conditions | Cowork.lk",
  description: "Terms and conditions of Cowork Lanka coworking booking system, guidelines, behavior policies, and cancellations.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">Terms &amp; Conditions</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 13, 2026</p>

        <hr className="my-6" />

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-lg font-semibold text-brand-dark">1. General Workspace Usage</h2>
          <p>
            By booking a space at Cowork Lanka (Pvt) Ltd, you agree to respect the workspace, staff, and other members. Loud conversations, offensive behavior, and misuse of space equipment are strictly prohibited.
          </p>

          <h2 className="text-lg font-semibold text-brand-dark">2. Booking Cancellations &amp; Refunds</h2>
          <p>
            Cancellations are processed automatically based on the following schedule:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>24 hours or more in advance</strong>: 80% refund of the total booking amount.</li>
            <li><strong>Between 4 and 24 hours in advance</strong>: 50% refund of the total booking amount.</li>
            <li><strong>Less than 4 hours in advance</strong>: Not eligible for any refund.</li>
          </ul>

          <h2 className="text-lg font-semibold text-brand-dark">3. Payments &amp; Invoicing</h2>
          <p>
            All bookings must be paid in full to secure the reservation. Online payments are integrated via PayHere. For bank/QR manual transfers, bookings remain pending until verified and manually approved by the front desk.
          </p>

          <h2 className="text-lg font-semibold text-brand-dark">4. Limitation of Liability</h2>
          <p>
            Cowork Lanka is not liable for any loss, theft, or damage of personal belongings on the premises, nor for any interruptions in utility services (power, water, internet) beyond our control.
          </p>
        </div>
      </div>
    </main>
  );
}
