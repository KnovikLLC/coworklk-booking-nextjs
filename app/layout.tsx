import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://cowork.lk";
const SITE_NAME = "Cowork.lk";
const DEFAULT_DESCRIPTION =
  "Book hot desks, dedicated workspaces, and meeting rooms at Cowork Lanka's coworking space in Pannipitiya, Sri Lanka. Real-time availability, instant online booking.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Cowork.lk | Coworking Space in Pannipitiya, Sri Lanka",
    template: `%s | ${SITE_NAME}`,
  },
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
  email: "hello@cowork.lk",
  priceRange: "LKR 699 - LKR 4990",
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
        {children}
        <Toaster richColors position="top-right" />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </body>
    </html>
  );
}
