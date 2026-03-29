"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  Mic, ArrowRight, Play,
  Volume2, Sparkles,
} from "lucide-react";

const LANGUAGES = [
  { name: "हिंदी", label: "Hindi" },
  { name: "தமிழ்", label: "Tamil" },
  { name: "తెలుగు", label: "Telugu" },
  { name: "বাংলা", label: "Bengali" },
  { name: "ગુજરાતી", label: "Gujarati" },
  { name: "मराठी", label: "Marathi" },
  { name: "ಕನ್ನಡ", label: "Kannada" },
  { name: "മലയാളം", label: "Malayalam" },
  { name: "ਪੰਜਾਬੀ", label: "Punjabi" },
  { name: "ଓଡ଼ିଆ", label: "Odia" },
  { name: "English", label: "English" },
];

const DEMO_CONVERSATION = [
  { role: "user", text: "मेरा ऑर्डर कहाँ है?", lang: "Hindi", delay: 0 },
  { role: "ai", text: "आपका ऑर्डर #4521 रास्ते में है और कल शाम तक पहुँच जाएगा।", lang: "Hindi", delay: 900 },
  { role: "user", text: "என் ஆர்டர் எங்கே இருக்கிறது?", lang: "Tamil", delay: 1800 },
  { role: "ai", text: "உங்கள் ஆர்டர் #4521 வழியில் உள்ளது, நாளை மாலைக்குள் வரும்.", lang: "Tamil", delay: 2700 },
];

const COMPANIES = ["Razorpay", "Zepto", "PhonePe", "CRED", "Meesho", "Groww", "Slice", "Fi Money", "Nykaa", "Boat", "Lenskart", "Zomato"];

function WaveformVisualizer({ active }: { active: boolean }) {
  const bars = [4, 8, 14, 10, 18, 12, 20, 9, 15, 11, 7, 16, 13, 19, 8];
  return (
    <div className="flex items-center gap-[3px] h-8">
      {bars.map((height, i) => (
        <span
          key={i}
          className="waveform-bar"
          style={{
            height: active ? `${height}px` : "4px",
            animationDelay: `${i * 80}ms`,
            animationPlayState: active ? "running" : "paused",
            background: "rgba(99,102,241,0.8)",
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeLang, setActiveLang] = useState(0);
  const [demoStep, setDemoStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const demoTimers = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (mounted && isAuthenticated) router.push("/dashboard");
  }, [mounted, isAuthenticated, router]);

  useEffect(() => {
    const t = setInterval(() => setActiveLang((p) => (p + 1) % LANGUAGES.length), 1600);
    return () => clearInterval(t);
  }, []);

  const runDemo = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setDemoStep(-1);
    demoTimers.current.forEach(clearTimeout);
    DEMO_CONVERSATION.forEach((msg, i) => {
      const t = setTimeout(() => {
        setDemoStep(i);
        if (i === DEMO_CONVERSATION.length - 1) {
          setTimeout(() => setIsPlaying(false), 1200);
        }
      }, msg.delay + 400);
      demoTimers.current.push(t);
    });
  };

  if (!mounted || isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#050a14] text-white overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/[0.06]" style={{ backdropFilter: "blur(24px)", background: "rgba(5,10,20,0.85)" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-600/40">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-[18px] font-normal text-white tracking-tight">Bolo</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/50">
            <Link href="/" className="text-white font-medium">Home</Link>
            <Link href="/features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/use-cases" className="hover:text-white transition-colors">Use Cases</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors font-medium">
              Sign in
            </Link>
            <Link href="/register" className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-brand-600/30 hover:-translate-y-px">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-20 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-5%,rgba(79,70,229,0.2),transparent)]" />
        <div className="absolute top-40 left-1/4 w-80 h-80 bg-brand-600/8 rounded-full blur-3xl" />
        <div className="absolute top-32 right-1/4 w-64 h-64 bg-violet-600/8 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/25 bg-brand-500/10 text-brand-300 text-xs font-medium tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
              Purpose-built for Indian languages
              <Sparkles className="w-3 h-3" />
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-center mb-8">
            <span className="block font-serif text-6xl md:text-7xl lg:text-8xl text-white leading-[0.95] tracking-tight mb-2">
              Speak the Heart of Bharat
            </span>
            <span className="block font-serif italic text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight bg-gradient-to-r from-saffron-400 via-turmeric-400 to-fire-400 bg-clip-text text-transparent">
              in {LANGUAGES[activeLang].name}
            </span>
          </h1>

          <p className="text-center text-lg md:text-xl text-white/45 max-w-xl mx-auto mb-12 leading-relaxed font-light">
            The hyper-personalized voice platform that converts every interaction
            into exponential growth.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/register" className="group flex items-center gap-2.5 px-7 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-brand-600/30 hover:shadow-brand-500/40 hover:-translate-y-0.5 text-[15px]">
              Start building free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              onClick={runDemo}
              className="flex items-center gap-2.5 px-7 py-3.5 glass-dark hover:bg-white/[0.07] text-white/80 hover:text-white font-medium rounded-xl transition-all text-[15px]"
            >
              <Play className="w-4 h-4 text-brand-400" />
              Watch live demo
            </button>
          </div>

          {/* Interactive Demo Card */}
          <div className="max-w-2xl mx-auto">
            <div className="glass-dark rounded-2xl overflow-hidden">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                <span className="ml-3 text-xs text-white/30 font-mono">bolo — live conversation demo</span>
                <div className="ml-auto">
                  <WaveformVisualizer active={isPlaying} />
                </div>
              </div>

              {/* Conversation replay */}
              <div className="p-6 space-y-4 min-h-[220px]">
                {demoStep === -1 && !isPlaying && (
                  <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center">
                      <Volume2 className="w-6 h-6 text-brand-400" />
                    </div>
                    <p className="text-sm text-white/40 text-center">
                      Click <span className="text-white/70 font-medium">Watch live demo</span> to see Bolo handle customer queries<br />across Hindi and Tamil — automatically.
                    </p>
                  </div>
                )}
                {DEMO_CONVERSATION.map((msg, i) => {
                  if (i > demoStep) return null;
                  return (
                    <div key={i} className={`flex gap-3 animate-fade-in ${msg.role === "ai" ? "flex-row" : "flex-row-reverse"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${msg.role === "ai" ? "bg-brand-600/30 text-brand-300 border border-brand-500/30" : "bg-white/10 text-white/60"}`}>
                        {msg.role === "ai" ? "AI" : "U"}
                      </div>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-xl text-sm leading-relaxed ${msg.role === "ai" ? "bg-brand-600/15 border border-brand-500/20 text-white/85" : "bg-white/[0.06] border border-white/[0.08] text-white/70"}`}>
                        <p>{msg.text}</p>
                        <p className="text-[10px] mt-1 opacity-50">{msg.lang}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer bar */}
              <div className="px-5 py-3 border-t border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {LANGUAGES.slice(0, 5).map((l, i) => (
                    <span key={i} className="text-[11px] text-white/30 font-mono">{l.name}</span>
                  ))}
                  <span className="text-[11px] text-white/20">+6 more</span>
                </div>
                <span className="text-[11px] text-emerald-400/70 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  &lt;500ms
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee logo strip */}
      <section className="border-y border-white/[0.05] py-5 overflow-hidden bg-white/[0.01]">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...COMPANIES, ...COMPANIES].map((c, i) => (
            <span key={i} className="mx-8 text-sm text-white/20 font-medium tracking-wide">{c}</span>
          ))}
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
