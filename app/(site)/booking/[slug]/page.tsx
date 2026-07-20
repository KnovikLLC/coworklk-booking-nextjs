import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpaceById, getActiveSpaceBySlug } from "@/lib/data/spaces";
import { slugify } from "@/lib/spaces";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { Badge } from "@/components/ui/badge";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type { SpaceDTO } from "@/lib/types/domain";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "https://cowork.lk";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Old space URLs were raw UUIDs (/booking/<uuid>) before slugs existed.
// Resolve by slug first; if that misses and the param looks like one of
// those old IDs, resolve by ID and 308-redirect to the real slug so any
// bookmarked/shared old links keep working and carry link equity forward.
async function resolveSpace(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<{ space: SpaceDTO; redirectTo: string | null } | null> {
  const bySlug = await getActiveSpaceBySlug(supabase, slug);
  if (bySlug) return { space: bySlug, redirectTo: null };

  if (UUID_RE.test(slug)) {
    const byId = await getActiveSpaceById(supabase, slug);
    if (byId) return { space: byId, redirectTo: `/booking/${slugify(byId.name)}` };
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const resolved = await resolveSpace(supabase, params.slug);
  if (!resolved) return {};
  const { space, redirectTo } = resolved;
  if (redirectTo) return {};

  const title = `${space.name} | Cowork.lk`;
  const description =
    space.description ??
    `Book the ${space.name} at Cowork.lk, Pannipitiya — real-time availability, instant online booking.`;
  const slug = slugify(space.name);

  return {
    title,
    description,
    alternates: { canonical: `/booking/${slug}` },
    openGraph: {
      siteName: "Cowork.lk",
      title,
      description,
      url: `/booking/${slug}`,
      images: [space.image_url || "/opengraph-image"],
    },
  };
}

export default async function SpaceDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();
  const resolved = await resolveSpace(supabase, params.slug);

  if (!resolved) notFound();
  const { space, redirectTo } = resolved;
  if (redirectTo) permanentRedirect(redirectTo);

  const lowestPrice = space.pricing.reduce(
    (min, p) => (p.price < min ? p.price : min),
    space.pricing[0]?.price ?? 0
  );
  const slug = slugify(space.name);
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: space.name,
    description: space.description ?? `${space.name} at Cowork.lk, Pannipitiya, Sri Lanka.`,
    image: space.image_url ? `${SITE_URL}${space.image_url}` : undefined,
    url: `${SITE_URL}/booking/${slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      price: lowestPrice,
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/booking/${slug}`,
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
