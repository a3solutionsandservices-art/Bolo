"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import {
  Mic, ArrowRight, Check, Globe, Zap, Shield,
  ShoppingCart, BookOpen, Building2, Play, ChevronRight,
  Volume2, Sparkles, Database, Code2, BarChart3,
  Heart, GraduationCap, Landmark, Truck, Leaf, Radio, Film, Users,
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

const BENTO_FEATURES = [
  {
    icon: Globe,
    title: "11 Indian Languages — Natively",
    desc: "Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Odia + English. Not translated. Understood.",
    size: "col-span-2",
    accent: "from-brand-600 to-violet-600",
  },
  {
    icon: Zap,
    title: "< 500ms Response",
    desc: "Sub-half-second voice replies. Fast enough to feel like a real conversation.",
    size: "col-span-1",
    accent: "from-fire-500 to-amber-500",
  },
  {
    icon: Database,
    title: "Trained on Your Data",
    desc: "Upload FAQs, PDFs, product docs. Your assistant answers from your knowledge — not the internet.",
    size: "col-span-1",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: Code2,
    title: "One Script Tag",
    desc: "Copy. Paste before </body>. Done. No engineering team needed.",
    size: "col-span-1",
    accent: "from-brand-500 to-sky-500",
  },
  {
    icon: Shield,
    title: "Data Stays in India",
    desc: "Full data residency. Audit trail for every conversation. SOC 2 in progress.",
    size: "col-span-1",
    accent: "from-violet-600 to-purple-600",
  },
  {
    icon: BarChart3,
    title: "Conversation Intelligence",
    desc: "Sentiment scoring, topic clustering, drop-off detection — across every session, every language.",
    size: "col-span-1",
    accent: "from-rose-500 to-pink-500",
  },
  {
    icon: Mic,
    title: "Your Brand's Voice",
    desc: "Clone a voice. License a regional celebrity. Or choose from 10+ built-in personas.",
    size: "col-span-1",
    accent: "from-amber-500 to-orange-500",
  },
];

const USE_CASE_VERTICALS = [
  {
    icon: ShoppingCart,
    color: "#6366f1",
    tag: "D2C & E-Commerce",
    headline: "Cut support costs by 70%",
    subhead: "without losing your customer's trust",
    examples: [
      { title: "Order Status Bot", desc: "Customer asks \"मेरा पार्सल कहाँ है?\" — agent replies in Hindi with live tracking." },
      { title: "Returns & Refunds", desc: "Voice-guided return flow in Tamil or Telugu — zero agent involvement." },
      { title: "Product Discovery", desc: "\"Saree under ₹500 for wedding\" — multilingual catalogue search by voice." },
    ],
    href: "/register?template=ecommerce",
  },
  {
    icon: GraduationCap,
    color: "#10b981",
    tag: "EdTech & Learning",
    headline: "Remove the language barrier from learning",
    subhead: "so every student can reach their potential",
    examples: [
      { title: "Doubt Resolution", desc: "Students ask questions in Bhojpuri or Odia — AI explains in their mother tongue, 24×7." },
      { title: "Voice Assessments", desc: "Spoken language tests for regional schools — auto-scored with accent awareness." },
      { title: "Parent Engagement", desc: "Progress updates delivered in the language parents actually read and hear." },
    ],
    href: "/register?template=edtech",
  },
  {
    icon: Landmark,
    color: "#f59e0b",
    tag: "BFSI & Fintech",
    headline: "Replace IVR with real conversations",
    subhead: "in the language your customer thinks in",
    examples: [
      { title: "Loan Onboarding", desc: "Walk first-time borrowers through applications in Marathi or Gujarati — drop-off eliminated." },
      { title: "KYC & Compliance", desc: "Voice-collected declarations with full audit trail — regulator ready." },
      { title: "Fraud Alerts", desc: "Instant outbound calls in the customer's language — faster response than SMS." },
    ],
    href: "/register?template=bfsi",
  },
  {
    icon: Heart,
    color: "#ec4899",
    tag: "Healthcare",
    headline: "Bridge the last mile in rural healthcare",
    subhead: "where English is not the patient's language",
    examples: [
      { title: "Symptom Triage", desc: "Patient describes symptoms in Kannada — AI categorises severity and books appointment." },
      { title: "Medication Reminders", desc: "Outbound voice reminders in the patient's dialect — higher adherence than text." },
      { title: "Post-Discharge Follow-up", desc: "Automated care check-ins in Telugu or Malayalam — reducing readmissions." },
    ],
    href: "/register?template=healthcare",
  },
  {
    icon: Truck,
    color: "#FF6B00",
    tag: "Logistics & Supply Chain",
    headline: "Keep delivery agents informed in their own language",
    subhead: "not yours",
    examples: [
      { title: "Driver Dispatch", desc: "Route instructions delivered by voice in Punjabi or Hindi — no app reading required." },
      { title: "Customer Delivery Updates", desc: "\"Aapka package 30 minute mein aayega\" — localised proactive notifications." },
      { title: "Warehouse Query Bot", desc: "Ground-level staff ask inventory questions by voice — answers in seconds." },
    ],
    href: "/register?template=logistics",
  },
  {
    icon: Leaf,
    color: "#22c55e",
    tag: "AgriTech & Rural India",
    headline: "Reach the farmer in the field",
    subhead: "not just the farmer with a smartphone",
    examples: [
      { title: "Crop Advisory", desc: "Farmer calls in Bhojpuri about pest outbreak — AI responds with actionable advice." },
      { title: "Mandi Price Updates", desc: "Daily commodity prices read out in the local boli — no literacy required." },
      { title: "Government Scheme Guidance", desc: "PM-KISAN eligibility explained by voice — farmers get what they're owed." },
    ],
    href: "/register?template=agritech",
  },
  {
    icon: Radio,
    color: "#8b5cf6",
    tag: "Media & Entertainment",
    headline: "Create content at the speed of Bharat",
    subhead: "in every language, every dialect",
    examples: [
      { title: "Regional Dubbing", desc: "License authentic celebrity voices for OTT dubbing — faster and cheaper than studios." },
      { title: "Podcast Localisation", desc: "Auto-translate and re-voice national podcasts into 11 regional languages." },
      { title: "Voice Character Cloning", desc: "Game studios create consistent voice personas across Hindi, Tamil, and Bengali." },
    ],
    href: "/register?template=media",
  },
  {
    icon: Building2,
    color: "#06b6d4",
    tag: "Government & Public Services",
    headline: "Make citizen services accessible to every citizen",
    subhead: "not just those who speak English",
    examples: [
      { title: "Grievance Redressal", desc: "Citizens file complaints by voice in their mother tongue — no form-filling." },
      { title: "Scheme Awareness", desc: "IVR replacement that actually answers questions about Aadhaar, ration cards, pensions." },
      { title: "Emergency Response", desc: "Multilingual helplines that understand regional accents under stress." },
    ],
    href: "/register?template=government",
  },
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
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#usecases" className="hover:text-white transition-colors">Use cases</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
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

      {/* ── BENTO FEATURES ── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-saffron-400 font-semibold tracking-widest uppercase mb-3">Platform</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-4 leading-tight">
              Built for Bharat.<br />
              <span className="italic text-white/50">Ready for the world.</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {BENTO_FEATURES.map(({ icon: Icon, title, desc, size, accent }) => (
              <div key={title} className={`${size} glass-dark rounded-2xl p-6 group hover:bg-white/[0.06] transition-all duration-300`}>
                <div className={`inline-flex w-10 h-10 rounded-xl bg-gradient-to-br ${accent} items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2 leading-tight">{title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section id="usecases" className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-brand-400 font-semibold tracking-widest uppercase mb-3">Who It&apos;s For</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
              Every industry.<br />
              <span className="italic text-white/50">Every Indian language.</span>
            </h2>
            <p className="text-white/40 text-base mt-5 max-w-xl mx-auto">
              Bolo is not a generic chatbot. Here&apos;s exactly how each sector uses it — with real examples.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {USE_CASE_VERTICALS.map(({ icon: Icon, color, tag, headline, subhead, examples, href }) => (
              <Link
                key={tag}
                href={href}
                className="group block glass-dark rounded-2xl p-6 border border-white/[0.07] hover:border-white/[0.14] transition-all duration-300"
              >
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20`, border: `1px solid ${color}35` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: `${color}cc` }}>{tag}</span>
                    <h3 className="font-serif text-[17px] text-white leading-snug">{headline}</h3>
                    <p className="text-sm italic text-white/35 leading-snug">{subhead}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-5">
                  {examples.map(({ title, desc }) => (
                    <div key={title} className="flex gap-3">
                      <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: color }} />
                      <div>
                        <p className="text-[13px] font-semibold text-white/80 leading-tight">{title}</p>
                        <p className="text-xs text-white/40 leading-relaxed mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: `${color}99` }}>
                  Get started with this template
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-white/30 text-sm mb-4">Don&apos;t see your industry?</p>
            <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-px" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
              Talk to us — we&apos;ll build it together
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
              Live in{" "}
              <span className="italic bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">5 minutes</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "01", title: "Upload your docs", desc: "Drop in FAQs, product catalogs, policy PDFs. Bolo indexes them instantly." },
              { n: "02", title: "Configure your agent", desc: "Pick languages, choose a voice, set your colors. No code. Done in 2 minutes." },
              { n: "03", title: "Embed one script tag", desc: "Copy a single <script> and paste before </body>. Or call our API." },
            ].map(({ n, title, desc }) => (
              <div key={n} className="relative">
                <div className="text-[56px] font-serif text-white/[0.06] leading-none mb-4 select-none">{n}</div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY NOT GOOGLE/MSFT ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="glass-dark rounded-3xl p-10 md:p-14 text-center">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-6 font-semibold">The honest pitch</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-6 leading-snug">
              Google and Azure give you APIs.<br />
              <span className="italic text-brand-400">Bolo gives you a working product.</span>
            </h2>
            <p className="text-white/45 text-base max-w-xl mx-auto mb-10 leading-relaxed">
              Stitching together STT + Translation + LLM + TTS + voice UI takes months.
              Bolo ships the full stack, tuned for Indian languages and accents, in a single platform.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-brand-600/30 hover:-translate-y-0.5">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">Simple pricing</h2>
            <p className="text-white/40 text-base">Pay for outcomes, not API units.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: "Starter", price: "₹49", period: "/mo",
                tagline: "Handle up to 1,000 customer queries",
                features: ["1,000 conversations / month", "3 Knowledge Bases", "11 Indian languages", "Text + voice", "Widget embed"],
                cta: "Start free", href: "/register", highlight: false,
              },
              {
                name: "Growth", price: "₹199", period: "/mo",
                tagline: "Handle up to 10,000+ customer queries",
                features: ["10,000 conversations / month", "20 Knowledge Bases", "Voice Cloning", "Voice Marketplace", "Priority support"],
                cta: "Start Growth", href: "/register?plan=growth", highlight: true,
              },
              {
                name: "Enterprise", price: "Custom", period: "",
                tagline: "Unlimited queries — zero cap",
                features: ["Unlimited conversations", "Dedicated infrastructure", "Custom SLA", "Dialect fine-tuning", "Account manager"],
                cta: "Talk to sales", href: "mailto:sales@bolo.ai", highlight: false,
              },
            ].map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-7 relative transition-all ${plan.highlight ? "bg-brand-600/20 border-2 border-brand-500/50" : "glass-dark border border-white/[0.08]"}`}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-600 text-white text-[11px] font-semibold rounded-full">
                    Most popular
                  </div>
                )}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">{plan.name}</p>
                  <div className="flex items-baseline gap-0.5 mb-1">
                    <span className="font-serif text-4xl text-white">{plan.price}</span>
                    <span className="text-sm text-white/40">{plan.period}</span>
                  </div>
                  <p className="text-xs text-brand-400 font-medium">{plan.tagline}</p>
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/55">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-2.5 rounded-xl text-sm font-semibold transition-all ${plan.highlight ? "bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/30" : "glass-dark hover:bg-white/[0.08] text-white/70 hover:text-white"}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
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
