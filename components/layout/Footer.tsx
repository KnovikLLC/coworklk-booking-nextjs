import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t border-brand-dark/10 text-brand-dark">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand Info */}
          <div className="space-y-4 lg:col-span-5">
            <img
              src="/images/logos/cowork-logo.svg"
              alt="Cowork.lk"
              className="h-[26px] w-auto"
            />
            <p className="text-sm leading-relaxed text-brand-dark/70">
              Cowork is a dynamic community hub where collaboration meets productivity. With flexible workspace options and top-notch amenities, we provide the ideal environment for you to work and connect with like-minded individuals. Join us and thrive at Cowork.
            </p>
          </div>

          {/* Location & Map */}
          <div className="space-y-4 lg:col-span-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-dark/80">Location</h3>
            <p className="text-sm leading-relaxed text-brand-dark/70">
              <span className="text-brand font-bold mr-1.5">A</span>
              349/A/3 Avissawella Road, Pannipitiya 10230, Western Province, Sri Lanka <br />
              2nd Floor of Active Plus Building
            </p>
            {/* Map Placeholder Graphic */}
            {/* <div className="relative h-28 w-full overflow-hidden rounded-lg border border-brand-dark/10 bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#231f20_1px,transparent_1px)] [background-size:16px_16px]" />
              <span className="text-xs font-extrabold tracking-wider text-brand-dark/60 uppercase">Co Work Sri Lanka</span>
              <span className="text-[10px] text-brand-dark/40 mt-1">Pannipitiya Center</span>
            </div> */}
          </div>

          {/* Join Whatsapp Community */}
          <div className="space-y-4 lg:col-span-3 flex flex-col justify-start">
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-dark/80">Community</h3>
            <p className="text-xs text-brand-dark/60 leading-relaxed">
              Stay connected with other co-workers, get updates, and share offers. Join our WhatsApp Community.
            </p>
            <div className="pt-2">
              <a
                href="https://chat.whatsapp.com/FUHL35hZvOs35O4oeyexpa"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#20ba59] hover:-translate-y-0.5"
              >
                Join Whatsapp Community
                <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Sub-footer */}
      <div className="bg-brand-dark text-white/60 py-6 border-t border-white/5">
        <div className="mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <span>© {new Date().getFullYear()} Cowork Lanka (Private) Limited. All Rights Reserved</span>
            <span className="hidden md:inline text-white/20">|</span>
            <span>
              Designed by{" "}
              <a
                href="https://www.charithdesign.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-brand hover:underline transition-colors"
              >
                Charith Design
              </a>{" "}
              &amp; Developed by{" "}
              <a
                href="https://knovik.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-brand hover:underline transition-colors"
              >
                Knovik
              </a>
            </span>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white transition-colors">Terms &amp; Conditions</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

