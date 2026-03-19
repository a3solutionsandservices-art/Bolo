"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  Mic, ArrowRight, Check, MessageSquare, Globe, Zap,
  ShoppingCart, BookOpen, Building2, ChevronRight,
  Star, Users, BarChart3, Play,
} from "lucide-react";

const LANGUAGES = [
  "हिंदी", "தமிழ்", "తెలుగు", "বাংলা",
  "ગુજરાતી", "मराठी", "ಕನ್ನಡ", "മലയാളം",
  "ਪੰਜਾਬੀ", "ଓଡ଼ିଆ", "English",
];

const STATS = [
  { value: "11", label: "Indian languages" },
  { value: "< 2s", label: "Average response time" },
  { value: "5 min", label: "Time to first bot" },
  { value: "70%", label: "Query deflection rate" },
];

const USE_CASES = [
  {
    icon: ShoppingCart,
    color: "from-brand-500 to-violet-500",
    bg: "bg-brand-50",
    iconColor: "text-brand-600",
    label: "D2C & E-commerce",
    headline: "Answer 70% of customer queries in their language—automatically.",
    bullets: [
      "Order status in Hindi, Tamil, Telugu",
      "Returns & refund policy in regional language",
      "24×7 support without hiring agents",
    ],
    cta: "See E-commerce Demo",
    href: "/register?template=ecommerce",
  },
  {
    icon: BookOpen,
    color: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    label: "EdTech",
    headline: "Explain concepts and answer student queries in their native language.",
    bullets: [
      "Doubt resolution in 11 Indian languages",
      "Audio explanations students actually understand",
      "Works with your existing course content",
    ],
    cta: "See EdTech Demo",
    href: "/register?template=edtech",
  },
  {
    icon: Building2,
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    label: "BFSI",
    headline: "Replace outdated IVR with a conversational voice AI agent.",
    bullets: [
      "KYC queries, EMI reminders, balance checks",
      "RBI-compliant with full transcript audit trail",
      "Supports Bharat's Tier 2 / Tier 3 customers",
    ],
    cta: "See BFSI Demo",
    href: "/register?template=bfsi",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Upload your business content",
    desc: "Upload FAQs, product catalogues, policy docs (PDF / DOCX). Bolo reads and indexes them automatically.",
    icon: BookOpen,
  },
  {
    step: "02",
    title: "Configure your AI agent",
    desc: "Pick a language, choose a voice, and set your widget colours. No code needed. Done in under 5 minutes.",
    icon: Zap,
  },
  {
    step: "03",
    title: "Embed one script tag",
    desc: "Copy a single <script> tag and paste it before </body> on your site — or connect via API.",
    icon: Globe,
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "₹49",
    period: "/month",
    tagline: "Perfect for trying Bolo",
    outcome: "Handle up to 1,000 customer queries",
    features: [
      "1,000 conversations / month",
      "3 Knowledge Bases",
      "11 Indian languages",
      "Text + voice responses",
      "Widget embed",
    ],
    cta: "Start free",
    href: "/register",
    highlight: false,
  },
  {
    name: "Growth",
    price: "₹199",
    period: "/month",
    tagline: "For scaling businesses",
    outcome: "Handle up to 10,000+ customer queries",
    features: [
      "10,000 conversations / month",
      "20 Knowledge Bases",
      "Voice Cloning (your brand voice)",
      "Voice Marketplace access",
      "Priority support",
    ],
    cta: "Start Growth",
    href: "/register?plan=growth",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    tagline: "Unlimited scale, SLA guaranteed",
    outcome: "Unlimited queries — zero cap",
    features: [
      "Unlimited conversations",
      "Dedicated infrastructure",
      "Custom SLA & uptime guarantee",
      "Dialect fine-tuning",
      "Dedicated account manager",
    ],
    cta: "Talk to sales",
    href: "mailto:sales@bolo.ai",
    highlight: false,
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeLang, setActiveLang] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    const t = setInterval(() => setActiveLang((p) => (p + 1) % LANGUAGES.length), 1800);
    return () => clearInterval(t);
  }, []);

  if (!mounted) return null;
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#060e1e] text-white">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06] backdrop-blur-xl bg-[#060e1e]/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-[17px] font-bold text-white tracking-tight">Bolo</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-lg shadow-brand-600/30"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(79,70,229,0.18),transparent)]" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-brand-600/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-violet-600/5 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Purpose-built for Indian languages
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-white mb-6">
            Handle customer support in
            <br />
            <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-brand-400 bg-clip-text text-transparent">
              11 Indian languages
            </span>
            <br />
            automatically.
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Add a voice AI agent to your website or WhatsApp in minutes.
            No coding required. Works with your FAQs and product docs.
            Speaks your customer&apos;s language.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              href="/register"
              className="group flex items-center gap-2 px-6 py-3.5 bg-brand-600 hover:bg-brand-500 text-white text-base font-semibold rounded-xl transition-all shadow-xl shadow-brand-600/30 hover:shadow-brand-500/40 hover:-translate-y-0.5"
            >
              Start free — no card required
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 px-6 py-3.5 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-base font-medium rounded-xl transition-all"
            >
              <Play className="w-4 h-4" />
              Watch 2-min demo
            </Link>
          </div>

          {/* Language ticker */}
          <div className="flex flex-wrap justify-center gap-2">
            {LANGUAGES.map((lang, i) => (
              <span
                key={lang}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-all duration-500 ${
                  i === activeLang
                    ? "bg-brand-600/20 border-brand-500/50 text-brand-300"
                    : "bg-white/[0.04] border-white/[0.08] text-slate-500"
                }`}
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white mb-1">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              One platform. Three powerful use cases.
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Same backend. Different packaging. Built for how Bharat actually works.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {USE_CASES.map(({ icon: Icon, color, bg: _, iconColor: __, label, headline, bullets, cta, href }) => (
              <div key={label} className="group relative bg-white/[0.03] border border-white/[0.08] rounded-2xl p-7 hover:bg-white/[0.05] hover:border-white/[0.14] transition-all duration-300">
                <div className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${color} items-center justify-center mb-5 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{label}</div>
                <h3 className="text-lg font-bold text-white leading-snug mb-4">{headline}</h3>
                <ul className="space-y-2.5 mb-6">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <Check className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href={href}
                  className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 font-semibold transition-colors group-hover:gap-2.5"
                >
                  {cta} <ChevronRight className="w-4 h-4 transition-all" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-28 px-6 bg-white/[0.02] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Up and running in under 5 minutes.
            </h2>
            <p className="text-slate-400 text-lg">No engineers required.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <span className="text-4xl font-black text-white/[0.06] leading-none">{step}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why not Google/Microsoft */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-medium mb-8">
            <Star className="w-3.5 h-3.5" />
            Why not Google or Microsoft?
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-snug">
            They give you APIs.
            <br />
            <span className="text-gradient bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
              We give you a working support agent.
            </span>
          </h2>
          <div className="grid sm:grid-cols-3 gap-5 mt-12 text-left">
            {[
              { icon: MessageSquare, title: "Indian-first", body: "Built specifically for Indian languages, accents, and dialects. Not a generic global model." },
              { icon: Zap, title: "No-code setup", body: "From zero to live support bot in 5 minutes. No ML expertise, no API stitching, no DevOps." },
              { icon: Users, title: "Full stack solution", body: "STT + Translation + LLM + TTS + Widget all in one subscription. No 5 different vendor bills." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5">
                <Icon className="w-5 h-5 text-brand-400 mb-3" />
                <h4 className="font-semibold text-white text-sm mb-1.5">{title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-28 px-6 bg-white/[0.02] border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, outcome-based pricing.</h2>
            <p className="text-slate-400 text-lg">Pay for resolved queries. Not for API calls or tokens.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map(({ name, price, period, tagline, outcome, features, cta, href, highlight }) => (
              <div
                key={name}
                className={`relative rounded-2xl p-7 border ${
                  highlight
                    ? "bg-gradient-to-b from-brand-600/20 to-brand-900/20 border-brand-500/40 shadow-xl shadow-brand-600/10"
                    : "bg-white/[0.03] border-white/[0.08]"
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-600 text-white text-xs font-bold rounded-full shadow-lg">
                    Most popular
                  </div>
                )}
                <div className="mb-5">
                  <h3 className="text-lg font-bold text-white">{name}</h3>
                  <p className="text-slate-500 text-sm mt-0.5">{tagline}</p>
                </div>
                <div className="mb-2">
                  <span className="text-4xl font-extrabold text-white">{price}</span>
                  <span className="text-slate-500 text-sm">{period}</span>
                </div>
                <div className="text-sm text-brand-400 font-semibold mb-6">{outcome}</div>
                <ul className="space-y-2.5 mb-7">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                      <Check className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {href.startsWith("mailto") ? (
                  <a
                    href={href}
                    className="block w-full py-3 text-center border border-brand-500/40 text-brand-400 hover:bg-brand-500/10 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {cta}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className={`block w-full py-3 text-center rounded-xl text-sm font-semibold transition-all ${
                      highlight
                        ? "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30"
                        : "border border-white/10 text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {cta}
                  </Link>
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-slate-600 text-sm mt-8">
            All plans include 11 Indian languages · Cancel anytime · No setup fee
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <span className="text-slate-400 text-sm">Join hundreds of Indian businesses already on Bolo</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Your customers speak Hindi.
            <br />
            <span className="text-gradient bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
              Your support bot should too.
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-10">
            Start free. No credit card. Live in 5 minutes.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white text-base font-bold rounded-xl transition-all shadow-2xl shadow-brand-600/30 hover:shadow-brand-500/40 hover:-translate-y-0.5"
          >
            Get started free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
              <Mic className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-400">Bolo</span>
          </div>
          <p className="text-slate-600 text-sm">© {new Date().getFullYear()} Bolo. Preserving Indian languages through AI.</p>
          <div className="flex items-center gap-5 text-sm text-slate-600">
            <a href="mailto:support@bolo.ai" className="hover:text-slate-400 transition-colors">support@bolo.ai</a>
            <Link href="/login" className="hover:text-slate-400 transition-colors">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
