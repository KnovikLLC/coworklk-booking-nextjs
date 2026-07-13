import Link from "next/link";

type NavLink = {
  href: string;
  label: string;
  comingSoon?: boolean;
  external?: boolean;
};

const NAV_LINKS: NavLink[] = [
  { href: "/booking", label: "Booking" },
  { href: "/about", label: "About" },
  { href: "https://chat.whatsapp.com/FUHL35hZvOs35O4oeyexpa", label: "Community", external: true },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export function Header({ isSignedIn = false }: { isSignedIn?: boolean }) {
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
                  className="text-sm font-semibold text-brand-dark/70 hover:text-brand transition-colors"
                >
                  {link.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Link
            href={isSignedIn ? "/profile" : "/login"}
            className="text-sm font-semibold text-brand-dark/70 hover:text-brand transition-colors"
          >
            {isSignedIn ? "My Account" : "Sign In"}
          </Link>
          <Link
            href={isSignedIn ? "/booking" : "/signup"}
            className="group flex items-center gap-1.5 rounded-lg bg-brand-dark px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-dark/95 hover:shadow-sm"
          >
            {isSignedIn ? "Book Now" : "Register"}
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

