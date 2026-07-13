import Link from "next/link";
import Image from "next/image";
import { formatLKR } from "@/lib/utils";
import type { SpaceDTO } from "@/lib/types/domain";

export function SpaceCard({ space }: { space: SpaceDTO }) {
  const lowestPrice = space.pricing.reduce<number | null>((min, p) => {
    return min === null || p.price < min ? p.price : min;
  }, null);

  // Map space type to a clean category label
  let categoryLabel = "Workspace";
  if (space.type.startsWith("meeting_room")) {
    categoryLabel = "Meeting Rooms";
  } else if (space.type === "lobby") {
    categoryLabel = "Custom Area";
  } else if (space.type === "workspace") {
    categoryLabel = "Dedicated Space";
  }

  return (
    <div className="flex flex-col md:flex-row overflow-hidden rounded-[20px] border border-brand-dark/5 bg-white shadow-sm hover:shadow-md transition-all">
      {/* Space Image */}
      <div className="relative h-48 md:h-auto md:w-2/5 min-h-[180px] bg-brand-dark/5">
        <Image
          src={space.image_url ?? "/images/spaces/placeholder.svg"}
          alt={space.name}
          fill
          unoptimized={!space.image_url}
          className="object-cover"
        />
      </div>

      {/* Space Details */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <span className="text-[10px] uppercase font-extrabold tracking-wider text-brand">
            {categoryLabel}
          </span>
          <h3 className="text-lg font-bold text-brand-dark">{space.name}</h3>
          <p className="text-xs text-brand-dark/45">Up to {space.capacity} pax</p>
          {space.description ? (
            <p className="text-xs leading-relaxed text-brand-dark/65 mt-2 line-clamp-2">
              {space.description}
            </p>
          ) : null}
        </div>

        {/* Action and Pricing */}
        <div className="mt-6 pt-4 border-t border-brand-dark/5 flex items-center justify-between gap-4">
          <Link
            href={`/booking/${space.id}`}
            className="group flex items-center gap-1.5 rounded-xl border border-brand-dark/25 px-5 py-2.5 text-xs font-bold text-brand-dark transition-all hover:bg-brand-dark/5 hover:border-brand-dark"
          >
            Book Now
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <div className="text-right">
            <p className="text-[10px] font-bold text-brand-dark/30 uppercase tracking-wider">Starting</p>
            <p className="text-xs font-extrabold text-brand">
              {lowestPrice !== null ? formatLKR(lowestPrice) : "Contact Us"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
