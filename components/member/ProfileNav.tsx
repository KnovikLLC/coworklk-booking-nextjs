"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/profile", label: "Overview", icon: LayoutDashboard },
  { href: "/profile/bookings", label: "Booking History", icon: History },
  { href: "/profile/settings", label: "Settings", icon: Settings },
];

export function ProfileNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-1 overflow-x-auto border-b border-brand-dark/10">
      {LINKS.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              isActive
                ? "border-brand text-brand"
                : "border-transparent text-brand-dark/60 hover:border-brand-dark/20 hover:text-brand-dark"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
