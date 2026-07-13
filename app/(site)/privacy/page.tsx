export const metadata = {
  title: "Privacy Policy | Cowork.lk",
  description: "Privacy policy of Cowork Lanka coworking booking system, details on how customer data is processed and stored safely.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 md:py-20">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: July 13, 2026</p>

        <hr className="my-6" />

        <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-lg font-semibold text-brand-dark">1. Information We Collect</h2>
          <p>
            When you register or book a space as a guest, we collect basic contact information including your full name, email address, phone number, and any custom notes you provide.
          </p>

          <h2 className="text-lg font-semibold text-brand-dark">2. How We Use Your Data</h2>
          <p>
            Your information is used solely to manage your bookings, process payments, generate Zoho Books invoices, send transactional email confirmations via Resend, and calculate member loyalty discounts.
          </p>

          <h2 className="text-lg font-semibold text-brand-dark">3. Data Sharing &amp; Third-Party Sync</h2>
          <p>
            We synchronize customer details and invoice payments with <strong>Zoho Books</strong> and route payments via <strong>PayHere</strong>. We do not sell or distribute your data to any other third parties.
          </p>

          <h2 className="text-lg font-semibold text-brand-dark">4. Database Protection</h2>
          <p>
            Customer profiles and bookings are protected using PostgreSQL Row-Level Security (RLS) policies within our Supabase database, ensuring only authorized owners and workspace staff have access.
          </p>
        </div>
      </div>
    </main>
  );
}
