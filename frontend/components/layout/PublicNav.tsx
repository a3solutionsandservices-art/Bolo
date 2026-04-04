"use client";

import Link from "next/link";
import { useState } from "react";
import { Mic, Menu, X, ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/features", label: "Features" },
  { href: "/use-cases", label: "Use Cases" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/demo", label: "Demo", highlight: true },
];

interface PublicNavProps {
  active?: "home" | "features" | "use-cases" | "pricing" | "about" | "demo";
}

export default function PublicNav({ active }: PublicNavProps) {
  const [open, setOpen] = useState(false);

  const activeHref =
    active === "home" ? "/" :
    active === "features" ? "/features" :
    active === "use-cases" ? "/use-cases" :
    active === "pricing" ? "/pricing" :
    active === "about" ? "/about" :
    active === "demo" ? "/demo" : null;

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06]"
        style={{ backdropFilter: "blur(24px)", background: "rgba(5,10,20,0.92)" }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #FF6B00, #fbbf24)", boxShadow: "0 0 16px rgba(255,107,0,0.35)" }}
            >
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-[18px] text-white tracking-tight">Bolo</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            {NAV_LINKS.map(({ href, label, highlight }) => (
              highlight ? (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:-translate-y-px"
                  style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 2px 12px rgba(255,107,0,0.3)" }}
                >
                  {label}
                </Link>
              ) : (
                <Link
                  key={href}
                  href={href}
                  className={`transition-colors ${href === activeHref ? "text-white font-medium" : "hover:text-white"}`}
                >
                  {label}
                </Link>
              )
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-all hover:-translate-y-px"
              style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 4px 16px rgba(255,107,0,0.3)" }}
            >
              Start free
            </Link>
          </div>

          {/* Mobile: Sign in + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 text-sm text-white/60 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.1] text-white/60 hover:text-white hover:border-white/20 transition-all"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div
            className="md:hidden border-t border-white/[0.06] px-6 py-4 flex flex-col gap-1"
            style={{ background: "rgba(5,10,20,0.97)" }}
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`py-3 text-[15px] font-medium border-b border-white/[0.04] transition-colors ${
                  href === activeHref ? "text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 4px 16px rgba(255,107,0,0.25)" }}
            >
              Start free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </nav>
    </>
  );
}
