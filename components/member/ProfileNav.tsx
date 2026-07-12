import Link from "next/link";

const LINKS = [
  { href: "/profile", label: "Overview" },
  { href: "/profile/bookings", label: "Booking History" },
  { href: "/profile/settings", label: "Settings" },
];

export function ProfileNav() {
  return (
    <nav className="mb-6 flex gap-4 border-b text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="border-b-2 border-transparent pb-2 text-brand-dark hover:border-brand"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
