"use client";

import Link from "next/link";
import { Mic, Check, ArrowRight, Zap } from "lucide-react";

const PLANS = [
  {
    name: "Starter",
    price: "₹49",
    period: "/mo",
    tagline: "Handle up to 1,000 customer queries",
    features: [
      "1,000 conversations / month",
      "3 Knowledge Bases",
      "11 Indian languages",
      "Text + voice",
      "Widget embed",
      "Community support",
    ],
    cta: "Start free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Growth",
    price: "₹199",
    period: "/mo",
    tagline: "Handle up to 10,000+ customer queries",
    features: [
      "10,000 conversations / month",
      "20 Knowledge Bases",
      "Voice Cloning",
      "Voice Marketplace access",
      "Priority support",
      "Advanced analytics",
    ],
    cta: "Start Growth",
    href: "/register?plan=growth",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "Unlimited queries — zero cap",
    features: [
      "Unlimited conversations",
      "Dedicated infrastructure",
      "Custom SLA",
      "Dialect fine-tuning",
      "Data residency in India",
      "Dedicated account manager",
    ],
    cta: "Talk to sales",
    href: "mailto:sales@bolo.ai",
    highlight: false,
  },
];

const FAQS = [
  {
    q: "What counts as a conversation?",
    a: "One conversation is a complete session between a user and your Bolo agent — regardless of how many messages are exchanged within that session.",
  },
  {
    q: "Can I switch plans anytime?",
    a: "Yes. Upgrade or downgrade at any time. Charges are pro-rated automatically.",
  },
  {
    q: "Is there a free trial?",
    a: "The Starter plan is free to begin — no credit card required. Upgrade when you need more.",
  },
  {
    q: "Where is my data stored?",
    a: "All data is processed and stored within India. We comply with DPDP Act 2023.",
  },
  {
    q: "What languages are included?",
    a: "All 11 Indian languages (Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Odia, English) are available on every plan.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#050a14" }}>

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06]" style={{ backdropFilter: "blur(24px)", background: "rgba(5,10,20,0.88)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B00, #fbbf24)", boxShadow: "0 0 16px rgba(255,107,0,0.35)" }}>
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-[18px] text-white tracking-tight">Bolo</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/use-cases" className="hover:text-white transition-colors">Use Cases</Link>
            <Link href="/pricing" className="text-white font-medium">Pricing</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors font-medium">Sign in</Link>
            <Link href="/register" className="px-4 py-2.5 text-white text-sm font-semibold rounded-lg transition-all hover:-translate-y-px" style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 4px 16px rgba(255,107,0,0.3)" }}>
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(79,70,229,0.15), transparent)" }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 text-xs font-medium" style={{ borderColor: "rgba(99,102,241,0.25)", background: "rgba(99,102,241,0.08)", color: "#818cf8" }}>
            <Zap className="w-3 h-3" />
            Simple, outcome-based pricing
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-white leading-[1.05] tracking-tight mb-4">
            Pay for outcomes,<br />
            <span className="italic text-white/45">not API units.</span>
          </h1>
          <p className="text-white/40 text-lg leading-relaxed max-w-xl mx-auto">
            Every plan includes all 11 Indian languages, full STT + TTS + RAG pipeline, and widget embed. No hidden fees.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 relative transition-all ${
                  plan.highlight
                    ? "border-2 border-brand-500/50"
                    : "border border-white/[0.08]"
                }`}
                style={{
                  background: plan.highlight
                    ? "rgba(79,70,229,0.12)"
                    : "rgba(255,255,255,0.03)",
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-600 text-white text-[11px] font-semibold rounded-full">
                    Most popular
                  </div>
                )}
                <div className="mb-6">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">{plan.name}</p>
                  <div className="flex items-baseline gap-0.5 mb-1.5">
                    <span className="font-serif text-4xl text-white">{plan.price}</span>
                    <span className="text-sm text-white/40">{plan.period}</span>
                  </div>
                  <p className="text-xs text-brand-400 font-medium">{plan.tagline}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30 hover:-translate-y-0.5"
                      : "text-white/70 hover:text-white hover:-translate-y-0.5"
                  }`}
                  style={!plan.highlight ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" } : {}}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 pb-32 border-t border-white/[0.05] pt-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">Common questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-[14px] font-semibold text-white mb-2">{q}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-white/40 text-sm mb-4">Still have questions?</p>
            <Link href="mailto:sales@bolo.ai" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px" style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 4px 16px rgba(255,107,0,0.3)" }}>
              Talk to us
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-serif text-white text-[16px]">Bolo</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            <a href="mailto:support@bolo.ai" className="hover:text-white/60 transition-colors">support@bolo.ai</a>
          </div>
          <p className="text-xs text-white/20">© 2026 Bolo. Made for Bharat.</p>
        </div>
      </footer>
    </div>
  );
}
