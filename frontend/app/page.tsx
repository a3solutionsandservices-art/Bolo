"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  PhoneMissed, ArrowRight, Mic, CheckCircle2, Phone,
  TrendingUp, IndianRupee, Zap, Shield, Globe, Timer, Play,
} from "lucide-react";
import PublicNav from "@/components/layout/PublicNav";
import MissedCallSimulator from "@/components/MissedCallSimulator";

const LANGUAGES = [
  "हिंदी", "தமிழ்", "తెలుగు", "বাংলা", "ਪੰਜਾਬੀ", "ಕನ್ನಡ", "മലയാളം", "ଓଡ଼ିଆ", "English",
];

const TRUST_POINTS = [
  { icon: Phone, text: "Works with Exotel & your existing phone system" },
  { icon: Globe, text: "Supports Hindi + 10 regional Indian languages" },
  { icon: Zap, text: "Setup in under 30 minutes — no app required" },
  { icon: Shield, text: "Data residency in India · DPDP compliant" },
  { icon: Timer, text: "Average callback time: 3–5 seconds" },
  { icon: CheckCircle2, text: "No app required for clinic staff" },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeLang, setActiveLang] = useState(0);
  const [showSim, setShowSim] = useState(false);

  // Revenue calculator state
  const [missedPerDay, setMissedPerDay] = useState(10);
  const [avgBookingValue, setAvgBookingValue] = useState(500);
  const recoveryRate = 0.65;
  const workingDays = 26;
  const monthlyLoss = missedPerDay * avgBookingValue * workingDays;
  const monthlyRecoverable = Math.round(monthlyLoss * recoveryRate);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && isAuthenticated) router.push("/dashboard");
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    const t = setInterval(() => setActiveLang((p) => (p + 1) % LANGUAGES.length), 1800);
    return () => clearInterval(t);
  }, []);

  if (!mounted || isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#050a14] text-white overflow-x-hidden">
      <PublicNav active="home" />

      {showSim && <MissedCallSimulator onClose={() => setShowSim(false)} />}

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-24 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(79,70,229,0.18),transparent)]" />
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-brand-600/6 rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-72 h-72 bg-violet-600/6 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="flex justify-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 text-brand-300 text-xs font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Missed Call Revenue Recovery System
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-[1.05] tracking-tight mb-6">
            Turn Every Missed Call Into a<br />
            <span className="bg-gradient-to-r from-saffron-400 via-turmeric-400 to-fire-400 bg-clip-text text-transparent">
              Booked Appointment in 5 Seconds
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/45 max-w-2xl mx-auto mb-4 leading-relaxed font-light">
            Bolo automatically calls back patients the moment they miss your clinic call —
            and converts their intent into confirmed bookings.
            Speaks{" "}
            <span className="text-white/75 font-medium transition-all duration-500">
              {LANGUAGES[activeLang]}
            </span>{" "}
            and 10 more Indian languages.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-12 text-sm">
            {[
              { label: "Callback time", value: "3–5 sec" },
              { label: "Avg recovery rate", value: "65%" },
              { label: "Languages", value: "11" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="font-bold text-white text-base">{s.value}</span>
                <span className="text-white/35">{s.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowSim(true)}
              className="group flex items-center gap-2.5 px-8 py-4 text-white font-semibold rounded-xl transition-all text-[15px]"
              style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 4px 24px rgba(255,107,0,0.35)" }}
            >
              <Play className="w-4 h-4" />
              See Live Demo
            </button>
            <Link
              href="/register"
              className="group flex items-center gap-2.5 px-8 py-4 glass-dark hover:bg-white/[0.07] text-white/70 hover:text-white font-medium rounded-xl transition-all text-[15px]"
            >
              Start free — no card needed
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── BEFORE vs AFTER ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center font-serif text-3xl md:text-4xl text-white mb-4">
            The Problem Bolo Solves
          </h2>
          <p className="text-center text-white/40 text-sm mb-14 max-w-lg mx-auto">
            Every missed call is a patient lost — and revenue gone. Until now.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* BEFORE */}
            <div className="rounded-2xl bg-red-500/[0.06] border border-red-500/15 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <PhoneMissed className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-red-400 font-semibold text-sm uppercase tracking-wider">Before Bolo</span>
              </div>
              <ul className="space-y-4">
                {[
                  "Phone rings unanswered — patient gives up",
                  "Staff too busy to follow up later",
                  "Patient books with a competitor",
                  "Lost revenue — zero visibility",
                  "Repeat every single day",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/55 text-sm">
                    <span className="text-red-500 mt-0.5 shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AFTER */}
            <div className="rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/15 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">After Bolo</span>
              </div>
              <ul className="space-y-4">
                {[
                  "Call missed → Bolo detects in real-time",
                  "AI calls back in 3–5 seconds automatically",
                  "Patient hears their own language — Hindi, Tamil, Telugu…",
                  "Intent captured: booking, inquiry, complaint",
                  "Appointment confirmed — zero staff effort",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-white/75 text-sm">
                    <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => setShowSim(true)}
              className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors underline underline-offset-4"
            >
              <Play className="w-3.5 h-3.5" />
              See exactly how it works — 45 second demo
            </button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (3-step) ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center font-serif text-3xl md:text-4xl text-white mb-14">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: PhoneMissed,
                color: "text-red-400",
                bg: "bg-red-500/10 border-red-500/20",
                title: "Missed Call Detected",
                desc: "Bolo monitors your Exotel/Twilio number 24×7. The instant a call is missed, it fires.",
              },
              {
                step: "02",
                icon: Phone,
                color: "text-brand-400",
                bg: "bg-brand-600/10 border-brand-500/20",
                title: "AI Calls Back in 3–5 Seconds",
                desc: "Bolo dials the patient automatically — faster than any human — and greets them in their language.",
              },
              {
                step: "03",
                icon: CheckCircle2,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
                title: "Appointment Booked",
                desc: "Patient speaks their intent. Bolo understands, responds, and confirms the booking — end to end.",
              },
            ].map(({ step, icon: Icon, color, bg, title, desc }) => (
              <div key={step} className={`rounded-2xl bg-white/[0.03] border border-white/[0.07] p-7 relative`}>
                <span className="absolute top-5 right-6 font-mono text-white/10 text-3xl font-bold">{step}</span>
                <div className={`w-10 h-10 rounded-xl ${bg} border flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVENUE CALCULATOR ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-4">
              How Much Revenue Are You Losing?
            </h2>
            <p className="text-white/40 text-sm">Adjust the numbers below — see your real impact.</p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-8 space-y-8">
            {/* Inputs */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-white/50 mb-3">
                  Missed calls per day
                  <span className="ml-2 text-white font-bold text-base">{missedPerDay}</span>
                </label>
                <input
                  type="range" min={1} max={100} step={1}
                  value={missedPerDay}
                  onChange={(e) => setMissedPerDay(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/25 mt-1">
                  <span>1</span><span>100</span>
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-3">
                  Avg booking value (₹)
                  <span className="ml-2 text-white font-bold text-base">₹{avgBookingValue}</span>
                </label>
                <input
                  type="range" min={100} max={5000} step={100}
                  value={avgBookingValue}
                  onChange={(e) => setAvgBookingValue(Number(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
                <div className="flex justify-between text-xs text-white/25 mt-1">
                  <span>₹100</span><span>₹5,000</span>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-red-500/[0.08] border border-red-500/15 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-red-400 uppercase tracking-wider font-medium">Monthly Loss</span>
                </div>
                <p className="text-2xl font-bold text-red-300">
                  ₹{monthlyLoss.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-white/30 mt-1">{missedPerDay} calls/day × ₹{avgBookingValue} × {workingDays} days</p>
              </div>

              <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/15 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <IndianRupee className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-400 uppercase tracking-wider font-medium">Recoverable with Bolo</span>
                </div>
                <p className="text-2xl font-bold text-emerald-300">
                  ₹{monthlyRecoverable.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-white/30 mt-1">At 65% conversion rate</p>
              </div>
            </div>

            <div className="text-center pt-2">
              <Link
                href="/register"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-white text-sm transition-all"
                style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", boxShadow: "0 4px 20px rgba(255,107,0,0.3)" }}
              >
                Recover This Revenue Automatically
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST LAYER ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center font-serif text-3xl text-white mb-4">
            Built for Indian Clinics. Ready Today.
          </h2>
          <p className="text-center text-white/40 text-sm mb-14">
            No integration hell. No months of setup. Just plug in and recover revenue.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TRUST_POINTS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-brand-600/15 border border-brand-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <p className="text-white/65 text-sm leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center mb-8 shadow-2xl shadow-brand-500/30">
            <PhoneMissed className="w-8 h-8 text-white" />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
            Stop Losing Patients<br />to Missed Calls
          </h2>
          <p className="text-white/40 mb-10 text-lg leading-relaxed max-w-lg mx-auto">
            Every missed call is a lost appointment. Bolo recovers them automatically —
            in the patient's own language, in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setShowSim(true)}
              className="flex items-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white text-[15px] transition-all"
              style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", boxShadow: "0 4px 24px rgba(255,107,0,0.35)" }}
            >
              <Play className="w-4 h-4" />
              See Live Demo
            </button>
            <Link
              href="/register"
              className="flex items-center gap-2.5 px-8 py-4 glass-dark hover:bg-white/[0.07] text-white/70 hover:text-white font-medium rounded-xl transition-all text-[15px]"
            >
              Start free today
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.05] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-serif text-white text-[16px]">Bolo</span>
            <span className="text-white/25 text-xs ml-1">— Missed Call Revenue Recovery</span>
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
