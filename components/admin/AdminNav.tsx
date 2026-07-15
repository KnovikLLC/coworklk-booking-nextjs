import Link from "next/link";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  return (
    <header className="border-b bg-brand-dark">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link href="/admin/dashboard" className="font-bold text-white">
          Cowork<span className="text-brand">.lk</span> Admin
        </Link>
        <nav className="flex gap-4">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm text-white/80 hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
