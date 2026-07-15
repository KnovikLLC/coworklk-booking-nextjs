import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://cowork.lk";
const SITE_NAME = "Cowork.lk";
const DEFAULT_DESCRIPTION =
  "Book hot desks, dedicated workspaces, and meeting rooms at Cowork Lanka's coworking space in Pannipitiya, Sri Lanka. Real-time availability, instant online booking.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Every page in this app already bakes "| Cowork.lk" into its own title
  // string, so no title.template here — it would double up the suffix.
  title: "Cowork.lk | Coworking Space in Pannipitiya, Sri Lanka",
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "coworking space Sri Lanka",
    "coworking space Pannipitiya",
    "hot desk Colombo",
    "meeting room rental Sri Lanka",
    "shared office space Pannipitiya",
  ],
  openGraph: {
    type: "website",
    locale: "en_LK",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Cowork.lk | Coworking Space in Pannipitiya, Sri Lanka",
    description: DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Cowork.lk | Coworking Space in Pannipitiya, Sri Lanka",
    description: DEFAULT_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: "/favicon.png",
  },
};

// Site-wide entity signal for Google/AI answer engines: who this business is,
// where it is, and how to reach it. Kept in the root layout so it's present
// on every page rather than duplicated per-route.
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Cowork Lanka (Pvt) Ltd",
  alternateName: "Cowork.lk",
  url: SITE_URL,
  logo: `${SITE_URL}/images/logos/cowork-logo.svg`,
  image: `${SITE_URL}/opengraph-image`,
  telephone: "+94774884040",
  email: "admin@cowork.lk",
  priceRange: "LKR 490 - LKR 6750",
  address: {
    "@type": "PostalAddress",
    streetAddress: "279 Avissawella Road",
    addressLocality: "Pannipitiya",
    postalCode: "10230",
    addressRegion: "Western Province",
    addressCountry: "LK",
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    opens: "08:00",
    closes: "20:00",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </body>
    </html>
  );
}
