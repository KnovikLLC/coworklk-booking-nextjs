import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatLKR } from "@/lib/utils";
import type { SpaceDTO } from "@/lib/types/domain";

export function SpaceCard({ space }: { space: SpaceDTO }) {
  const lowestPrice = space.pricing.reduce<number | null>((min, p) => {
    return min === null || p.price < min ? p.price : min;
  }, null);

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative h-40 w-full bg-brand-dark/5">
        <Image
          src={space.image_url ?? "/images/spaces/placeholder.svg"}
          alt={space.name}
          fill
          unoptimized={!space.image_url}
          className="object-cover"
        />
      </div>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-brand-dark">{space.name}</h3>
          <Badge variant="secondary">Up to {space.capacity} pax</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {space.description ? (
          <p className="text-sm text-muted-foreground">{space.description}</p>
        ) : null}
        {space.amenities.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {space.amenities.map((amenity) => (
              <Badge key={amenity} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div>
          {lowestPrice !== null ? (
            <>
              <span className="text-xs text-muted-foreground">From </span>
              <span className="font-semibold text-brand-dark">{formatLKR(lowestPrice)}</span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Contact for pricing</span>
          )}
        </div>
        <Link
          href={`/booking/${space.id}`}
          className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
        >
          View &amp; Book
        </Link>
      </CardFooter>
    </Card>
  );
}
