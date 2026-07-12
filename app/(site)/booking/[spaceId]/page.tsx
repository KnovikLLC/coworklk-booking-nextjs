import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpaceById } from "@/lib/data/spaces";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { Badge } from "@/components/ui/badge";

export default async function SpaceDetailPage({
  params,
}: {
  params: { spaceId: string };
}) {
  const supabase = createClient();
  const space = await getActiveSpaceById(supabase, params.spaceId);

  if (!space) notFound();

  return (
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
  );
}
