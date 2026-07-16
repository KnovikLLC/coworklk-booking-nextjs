"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

type NavLink = {
  href: string;
  label: string;
  comingSoon?: boolean;
  external?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: "/booking", label: "Booking" },
  { href: "/about", label: "About" },
  { href: "/tour", label: "Cowork Tour" },
  { href: "/community", label: "Community" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export function Header({ user = null }: { user?: SupabaseUser | null }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const email = user?.email || "";
  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    email.split("@")[0] ||
    "User";
  
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="sticky top-0 z-40 border-b border-brand-dark/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img
            src="/images/logos/cowork-logo.svg"
            alt="Cowork.lk"
            className="h-[26px] w-auto"
          />
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <div key={link.label} className="relative group">
              {link.comingSoon ? (
                <>
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-extrabold uppercase tracking-widest text-brand whitespace-nowrap">
                    Coming Soon
                  </span>
                  <span className="cursor-not-allowed text-sm font-semibold text-brand-dark/40">
                    {link.label}
                  </span>
                </>
              ) : link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-brand-dark/70 hover:text-brand transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className={`text-sm font-semibold transition-colors ${
                    pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href))
                      ? "text-brand"
                      : "text-brand-dark/70 hover:text-brand"
                  }`}
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-9 w-9 cursor-pointer border border-brand-dark/10 transition-transform hover:scale-105">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                  <AvatarFallback className="bg-brand text-xs font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-1 bg-white">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold text-brand-dark leading-none">{name}</p>
                    <p className="text-xs text-brand-dark/50 leading-none">{email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex w-full items-center gap-2 text-sm font-medium text-brand-dark/80 hover:text-brand cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    My Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 focus:text-red-700 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            ) : (
              <Link
                href="/login"
                className="text-sm font-semibold text-brand-dark/70 hover:text-brand transition-colors"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/booking"
              className="group flex items-center gap-1.5 rounded-lg bg-brand-dark px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-dark/95 hover:shadow-sm"
            >
              Book a Space
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
      </div>
    </header>
  );
}

