import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-brand-dark/15 bg-brand-dark/[0.02] px-6 py-10 text-center">
      <Icon className="h-8 w-8 text-brand-dark/25" />
      <p className="font-medium text-brand-dark">{title}</p>
      <p className="max-w-xs text-sm text-brand-dark/50">{description}</p>
      {ctaHref && ctaLabel ? (
        <Link
          href={ctaHref}
          className="mt-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand/90"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
