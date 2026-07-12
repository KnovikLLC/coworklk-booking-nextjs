import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-brand-dark text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="text-lg font-bold">
              Cowork<span className="text-brand">.lk</span>
            </div>
            <p className="mt-2 text-sm text-white/70">
              279 Avissawella Road, Pannipitiya 10230
              <br />
              Western Province, Sri Lanka
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-white/50">
              Contact
            </div>
            <p className="mt-2 text-sm text-white/70">
              +94 77 488 4040
              <br />
              hello@cowork.lk
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wide text-white/50">
              Links
            </div>
            <div className="mt-2 flex flex-col gap-1 text-sm text-white/70">
              <Link href="/terms" className="hover:text-white">
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy" className="hover:text-white">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6 text-xs text-white/50">
          © {new Date().getFullYear()} Cowork Lanka (Private) Limited. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
