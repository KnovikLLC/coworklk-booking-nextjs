import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpaceById } from "@/lib/data/spaces";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { Badge } from "@/components/ui/badge";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://cowork.lk";

export async function generateMetadata({
  params,
}: {
  params: { spaceId: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const space = await getActiveSpaceById(supabase, params.spaceId);
  if (!space) return {};

  const title = `${space.name} | Cowork.lk`;
  const description =
    space.description ??
    `Book the ${space.name} at Cowork.lk, Pannipitiya — real-time availability, instant online booking.`;

  return {
    title,
    description,
    alternates: { canonical: `/booking/${space.id}` },
    openGraph: { siteName: "Cowork.lk", title, description, url: `/booking/${space.id}` },
  };
}

export default async function SpaceDetailPage({
  params,
}: {
  params: { spaceId: string };
}) {
  const supabase = createClient();
  const space = await getActiveSpaceById(supabase, params.spaceId);

  if (!space) notFound();

  const lowestPrice = space.pricing.reduce(
    (min, p) => (p.price < min ? p.price : min),
    space.pricing[0]?.price ?? 0
  );
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: space.name,
    description: space.description ?? `${space.name} at Cowork.lk, Pannipitiya, Sri Lanka.`,
    image: space.image_url ? `${SITE_URL}${space.image_url}` : undefined,
    url: `${SITE_URL}/booking/${space.id}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: lowestPrice,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/booking/${space.id}`,
    },
  };

  return (
    <>
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
    />
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative h-64 w-full overflow-hidden rounded-xl bg-brand-dark/5">
            <Image
              src={space.image_url ?? "/images/spaces/placeholder.svg"}
              alt={space.name}
              fill
              unoptimized={!space.image_url}
              className="object-cover"
            />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-brand-dark">{space.name}</h1>
          <Badge variant="secondary" className="mt-2">
            Up to {space.capacity} pax
          </Badge>
          {space.description ? (
            <p className="mt-4 text-muted-foreground">{space.description}</p>
          ) : null}
          {space.amenities.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {space.amenities.map((amenity) => (
                <Badge key={amenity} variant="outline">
                  {amenity}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <BookingWidget space={space} />
        </div>
      </div>
    </main>
    </>
  );
}
