export function Footer() {
  return (
    <footer className="mt-24 border-t border-[#061738] bg-[#020b2f] pt-12 pb-8 text-slate-100">
      <div className="fp-container space-y-10 text-sm text-slate-200/90">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-xs font-semibold text-[#020b2f]">
                FP
              </div>
              <span className="text-sm font-semibold tracking-wide">
                FreightPOP
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              AI supply chain software that unifies WMS, OMS, and TMS into a
              single end-to-end solution.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              FreightPOP
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>FreightPOP Intelligence</li>
              <li>Operational Planning</li>
              <li>Transportation Management</li>
              <li>Tracking Intelligence</li>
              <li>Invoice Auditing</li>
              <li>Analytics</li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              Resources
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>Blog</li>
              <li>eBooks</li>
              <li>Customer Success Stories</li>
              <li>ROI Calculator</li>
              <li>Glossary</li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              About
            </p>
            <ul className="mt-3 space-y-1.5">
              <li>In the News</li>
              <li>Awards and Recognition</li>
              <li>FreightPOP Gives Back</li>
              <li>Careers</li>
              <li>Contact Us</li>
              <li>FAQs</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-300 md:flex-row md:items-center">
          <p>© 2026 FreightPOP. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="hover:text-white">
              Software Terms and Conditions
            </button>
            <button type="button" className="hover:text-white">
              Freight Terms and Conditions
            </button>
            <button type="button" className="hover:text-white">
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

