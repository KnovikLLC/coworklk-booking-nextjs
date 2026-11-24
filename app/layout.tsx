import type { Metadata } from "next";
import Script from "next/script";
import { Red_Hat_Text, Red_Hat_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { BUSINESS, BUSINESS_ID, FROM_PRICES, SITE_URL, lkr } from "@/lib/seo/business";

const redHatText = Red_Hat_Text({ subsets: ["latin"], variable: "--font-sans" });
const redHatDisplay = Red_Hat_Display({ subsets: ["latin"], variable: "--font-display" });

const SITE_NAME = "Cowork Sri Lanka";
const DEFAULT_DESCRIPTION =
  "Book hot desks, dedicated workspaces, and meeting rooms at Cowork Lanka's coworking space in Kottawa, Pannipitiya, Sri Lanka. Real-time availability, instant online booking.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Every page in this app already bakes "| Cowork.lk" into its own title
  // string, so no title.template here — it would double up the suffix.
  title: "Cowork.lk | Coworking Space in Kottawa, Pannipitiya, Sri Lanka",
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "coworking space Sri Lanka",
    "coworking space Pannipitiya",
    "coworking space Kottawa",
    "hot desk Colombo",
    "meeting room rental Sri Lanka",
    "shared office space Pannipitiya",
  ],
  openGraph: {
    type: "website",
    locale: "en_LK",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Cowork.lk | Coworking Space in Kottawa, Pannipitiya, Sri Lanka",
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Cowork.lk | Coworking Space in Kottawa, Pannipitiya, Sri Lanka",
    description: DEFAULT_DESCRIPTION,
  },
  // No site-wide canonical: a root-level canonical is inherited by every page
  // that doesn't set its own (terms, privacy, login...), telling Google they
  // are duplicates of the home page. Pages set their own canonical instead.
  icons: {
    icon: "/favicon.png",
  },
};

// Site-wide entity signal for Google/AI answer engines: who this business is,
// where it is, and how to reach it. Kept in the root layout so it's present
// on every page; other pages reference it by BUSINESS_ID rather than
// redeclaring it. All facts come from lib/seo/business.ts.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LocalBusiness",
      "@id": BUSINESS_ID,
      additionalType: "https://en.wikipedia.org/wiki/Coworking",
      name: BUSINESS.brandName,
      legalName: BUSINESS.legalName,
      alternateName: BUSINESS.alternateNames,
      description:
        "Coworking space in Kottawa, Pannipitiya, Sri Lanka, 20 m from Red Bell Kottawa and 100 m from Taco Bell and Lyceum School Kottawa, 5 minutes from Kottawa town and 10 minutes from Maharagama, offering hot desks, workspace seats and private meeting rooms bookable online by the half-day or day, with 1 Gbps SLT fiber plus Starlink internet and a backup generator.",
      slogan: "Work Solo, Collaborate Together.",
      url: SITE_URL,
      logo: `${SITE_URL}/images/logos/cowork-logo.svg`,
      image: [`${SITE_URL}/opengraph-image`, `${SITE_URL}/images/spaces/co-work-area.png`],
      telephone: BUSINESS.phone,
      email: BUSINESS.email,
      priceRange: `${lkr(FROM_PRICES.hotDesk)} - ${lkr(FROM_PRICES.max)}`,
      currenciesAccepted: "LKR",
      paymentAccepted: "Credit Card, Debit Card, Bank Transfer",
      hasMap: BUSINESS.mapUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: `${BUSINESS.address.building}, ${BUSINESS.address.street}`,
        addressLocality: BUSINESS.address.locality,
        postalCode: BUSINESS.address.postalCode,
        addressRegion: BUSINESS.address.region,
        addressCountry: BUSINESS.address.country,
      },
      // Real proximity facts published on the About page (Kottawa town 5 min,
      // Maharagama 10 min, Kadawatha ~30 min via expressway).
      areaServed: [
        { "@type": "City", name: "Pannipitiya" },
        { "@type": "City", name: "Kottawa" },
        { "@type": "City", name: "Maharagama" },
        { "@type": "City", name: "Kadawatha" },
        { "@type": "AdministrativeArea", name: "Colombo District" },
        { "@type": "Country", name: "Sri Lanka" },
      ],
      knowsAbout: [
        "Coworking",
        "Hot desking",
        "Shared office space",
        "Meeting room rental",
        "Day office rental",
      ],
      founder: BUSINESS.founders.map((name) => ({ "@type": "Person", name })),
      amenityFeature: [
        "Free WiFi: 1 Gbps SLT Fiber",
        "Starlink Satellite Internet (second connection)",
        "Air Conditioning",
        "Backup Power Generator",
        "Free Coffee & Tea",
        "Lounge Area",
        "On-Site Parking",
        "Private Meeting Rooms",
      ].map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
      openingHoursSpecification: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: BUSINESS.hours.opens,
        closes: BUSINESS.hours.closes,
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: BUSINESS.phone,
        email: BUSINESS.email,
        contactType: "customer service",
        availableLanguage: ["English"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: BUSINESS.brandName,
      inLanguage: "en-LK",
      publisher: { "@id": BUSINESS_ID },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${redHatText.variable} ${redHatDisplay.variable}`}>
      <body className="font-sans antialiased">
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LKDEVT7T3Z"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LKDEVT7T3Z');
          `}
        </Script>
        {children}
        <Toaster richColors position="top-right" />
        <SpeedInsights />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
      </body>
    </html>
  );
}
