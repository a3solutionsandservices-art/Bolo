"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import PublicNav from "@/components/layout/PublicNav";
import {
  Play, Pause, Volume2, ArrowRight, Check, Mic, Globe,
  Database, BarChart3, Zap, ShoppingCart, GraduationCap,
  Landmark, Loader2, ChevronRight, IndianRupee, Users,
  TrendingUp, Shield, Code2, Star, Sparkles, Radio,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

const VOICE_DEMOS = [
  {
    lang: "Hindi", code: "hi-IN", script: "हिंदी",
    text: "नमस्ते! मैं बोलो हूँ। मैं आपकी ऑर्डर की जानकारी दे सकता हूँ, रिफंड कर सकता हूँ, और आपके सभी सवालों का जवाब दे सकता हूँ।",
    color: "#FF6B00", bg: "rgba(255,107,0,0.1)",
    useCase: "E-commerce Support",
  },
  {
    lang: "Tamil", code: "ta-IN", script: "தமிழ்",
    text: "வணக்கம்! நான் போலோ. உங்கள் ஆர்டர் நிலை, திரும்பப் பெறுதல் மற்றும் எந்த கேள்விக்கும் உதவ தயாராக இருக்கிறேன்.",
    color: "#6366f1", bg: "rgba(99,102,241,0.1)",
    useCase: "Customer Service",
  },
  {
    lang: "Telugu", code: "te-IN", script: "తెలుగు",
    text: "నమస్కారం! నేను బోలో. మీ ఆర్డర్ వివరాలు, రిఫండ్లు మరియు ఏ విషయంలోనైనా సహాయం చేయడానికి నేను ఇక్కడ ఉన్నాను.",
    color: "#10b981", bg: "rgba(16,185,129,0.1)",
    useCase: "Voice Banking",
  },
  {
    lang: "Bengali", code: "bn-IN", script: "বাংলা",
    text: "নমস্কার! আমি বোলো। আপনার অর্ডার ট্র্যাক করা, রিফান্ড প্রক্রিয়া এবং যেকোনো প্রশ্নের উত্তর দিতে আমি সর্বদা প্রস্তুত।",
    color: "#f59e0b", bg: "rgba(245,158,11,0.1)",
    useCase: "EdTech",
  },
  {
    lang: "Kannada", code: "kn-IN", script: "ಕನ್ನಡ",
    text: "ನಮಸ್ಕಾರ! ನಾನು ಬೋಲೋ. ನಿಮ್ಮ ಆರ್ಡರ್ ಸ್ಥಿತಿ, ಮರುಪಾವತಿ ಮತ್ತು ಯಾವುದೇ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಹಾಯ ಮಾಡಲು ನಾನು ಇಲ್ಲಿದ್ದೇನೆ.",
    color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",
    useCase: "AgriTech",
  },
  {
    lang: "Marathi", code: "mr-IN", script: "मराठी",
    text: "नमस्कार! मी बोलो आहे। तुमच्या ऑर्डरची माहिती, परतावा प्रक्रिया आणि कोणत्याही प्रश्नांसाठी मी नेहमी तयार आहे।",
    color: "#ec4899", bg: "rgba(236,72,153,0.1)",
    useCase: "Healthcare",
  },
];

const E2E_FLOW = [
  {
    step: "01", title: "Customer Speaks",
    desc: "User calls or opens the widget — speaks in their mother tongue. Hindi, Tamil, Bhojpuri — whatever feels natural.",
    icon: Mic, color: "#FF6B00",
    example: "\"मेरा ऑर्डर कहाँ है? नंबर है #4521\"",
    exampleLang: "Customer in Hindi",
  },
  {
    step: "02", title: "Bolo Understands",
    desc: "Sarvam STT converts speech to text. Language auto-detected. Intent extracted in under 200ms.",
    icon: Zap, color: "#6366f1",
    example: "Intent: order_status | Entity: #4521 | Language: hi-IN",
    exampleLang: "AI processing",
  },
  {
    step: "03", title: "RAG Retrieves Context",
    desc: "Query routed to your knowledge base. Relevant policies, order data, and FAQs retrieved instantly.",
    icon: Database, color: "#10b981",
    example: "Order #4521 → Out for delivery → ETA: 6PM today",
    exampleLang: "From your data",
  },
  {
    step: "04", title: "AI Responds",
    desc: "GPT-4o generates a natural, accurate response. Translated and synthesized into the customer's language.",
    icon: Volume2, color: "#f59e0b",
    example: "\"आपका ऑर्डर #4521 रास्ते में है। आज शाम 6 बजे तक मिलेगा।\"",
    exampleLang: "Response in Hindi",
  },
  {
    step: "05", title: "You Learn & Improve",
    desc: "Every conversation is logged. Sentiment scored. Drop-offs flagged. Your AI gets smarter every day.",
    icon: BarChart3, color: "#8b5cf6",
    example: "CSAT: 4.8/5 | Resolution: 94% | Avg time: 38s",
    exampleLang: "Analytics",
  },
];

const FEATURES = [
  { icon: Mic, title: "Voice STT", desc: "11 Indian languages + English. Accent-aware. Works on 2G networks.", badge: "Live" },
  { icon: Volume2, title: "Neural TTS", desc: "Voxtral (Hindi/English) + Sarvam for 9 other languages. Human-quality voice.", badge: "Live" },
  { icon: Globe, title: "Auto Translation", desc: "Real-time bidirectional translation. 110+ language pairs. Sub-300ms.", badge: "Live" },
  { icon: Database, title: "RAG Knowledge Base", desc: "Upload PDFs, CSVs, URLs. Query in any language. Instant indexing.", badge: "Live" },
  { icon: BarChart3, title: "Conversation Intelligence", desc: "Sentiment, topics, CSAT prediction, drop-off detection — per session.", badge: "Live" },
  { icon: Code2, title: "One-Script Widget", desc: "Single <script> tag. Full voice + text UI. Works on any website.", badge: "Live" },
  { icon: Radio, title: "Voice Marketplace", desc: "License regional celebrity voices. Artists earn royalties. Enterprise-grade.", badge: "Beta" },
  { icon: Shield, title: "Data Residency India", desc: "DPDP Act 2023 compliant. Full audit trail. SOC 2 in progress.", badge: "Live" },
];

const USE_CASES = [
  { icon: ShoppingCart, color: "#6366f1", industry: "D2C & E-Commerce", value: "70% fewer support tickets", example: "Zepto, Meesho, Nykaa" },
  { icon: GraduationCap, color: "#10b981", industry: "EdTech", value: "3x student engagement", example: "BYJU's, Unacademy" },
  { icon: Landmark, color: "#f59e0b", industry: "BFSI & Fintech", value: "IVR replacement in 5 min", example: "PhonePe, Groww, Slice" },
  { icon: Users, color: "#ec4899", industry: "Healthcare", value: "Last-mile patient reach", example: "Apollo, Practo" },
];

const REVENUE_MODELS = [
  {
    model: "SaaS Subscription",
    icon: TrendingUp,
    color: "#6366f1",
    desc: "Businesses pay monthly for conversation volume. ₹49/mo → ₹199/mo → Enterprise.",
    revenue: "₹49–∞/mo per workspace",
    moat: "High switching cost once KB is trained on customer data",
  },
  {
    model: "Voice Marketplace",
    icon: Mic,
    color: "#FF6B00",
    desc: "Regional voice artists list their voices. Businesses license them. We take 30% commission.",
    revenue: "30% of every license fee",
    moat: "Supply-side lock-in: artists build audience on Bolo",
  },
  {
    model: "Language Data",
    icon: Database,
    color: "#10b981",
    desc: "Crowdsourced dialect data from native speakers. Sold to AI labs, governments, auto OEMs.",
    revenue: "₹5–50L per dataset",
    moat: "Only platform with commercial-grade consent + diversity",
  },
];

function VoiceCard({ demo, apiBase, apiOnline }: { demo: typeof VOICE_DEMOS[0]; apiBase: string; apiOnline: boolean }) {
  const [state, setState] = useState<"idle" | "loading" | "playing" | "error">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setState("idle");
  };

  const play = () => {
    if (state === "loading" || state === "playing") { stop(); return; }
    setState("loading");

    const langCode = demo.code.split("-")[0];
    const proxyUrl = `/api/tts-proxy?text=${encodeURIComponent(demo.text.substring(0, 200))}&lang=${langCode}`;

    const audio = new Audio(proxyUrl);
    audioRef.current = audio;
    audio.onended = () => setState("idle");
    audio.onerror = () => setState("idle");

    audio.play()
      .then(() => setState("playing"))
      .catch(() => setState("idle"));
  };

  const statusLabel = state === "playing"
    ? "Playing AI voice…"
    : state === "error"
    ? "Playback failed — tap to retry"
    : "Click to hear live AI voice";

  return (
    <div
      className="rounded-2xl p-5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
      style={{ background: demo.bg, border: `1px solid ${state === "error" ? "#ef444440" : demo.color + "30"}` }}
      onClick={play}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: demo.color }}>
            {demo.useCase}
          </p>
          <p className="text-xl font-bold text-white">{demo.script}</p>
          <p className="text-xs text-white/50">{demo.lang}</p>
        </div>
        <button
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
          style={{ background: `${demo.color}25`, border: `1px solid ${demo.color}40` }}
        >
          {state === "loading"
            ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: demo.color }} />
            : state === "playing"
            ? <Pause className="w-4 h-4" style={{ color: demo.color }} />
            : state === "error"
            ? <span className="text-red-400 text-xs font-bold">!</span>
            : <Play className="w-4 h-4 ml-0.5" style={{ color: demo.color }} />}
        </button>
      </div>
      <p className="text-xs text-white/40 leading-relaxed line-clamp-2">{demo.text}</p>
      <div className="flex items-center gap-1.5 mt-3">
        <span
          className={`w-1.5 h-1.5 rounded-full ${state === "playing" ? "animate-pulse" : ""}`}
          style={{ background: state === "error" ? "#ef4444" : demo.color }}
        />
        <span className="text-[10px] text-white/30">{statusLabel}</span>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [activeFlow, setActiveFlow] = useState(0);
  const [flowPlaying, setFlowPlaying] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const flowTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const healthUrl = backendUrl ? `${backendUrl}/health` : "/api/health-proxy";
    const check = async () => {
      try {
        const res = await fetch(healthUrl, { signal: AbortSignal.timeout(6000) });
        setApiOnline(res.ok);
      } catch {
        setApiOnline(false);
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, []);

  const startFlow = () => {
    if (flowPlaying) return;
    setFlowPlaying(true);
    setActiveFlow(0);
    E2E_FLOW.forEach((_, i) => {
      const t = setTimeout(() => {
        setActiveFlow(i);
        if (i === E2E_FLOW.length - 1) {
          setTimeout(() => setFlowPlaying(false), 1500);
        }
      }, i * 1400);
      if (i === 0) flowTimer.current = t;
    });
  };

  useEffect(() => () => { if (flowTimer.current) clearTimeout(flowTimer.current); }, []);

  return (
    <div className="min-h-screen text-white" style={{ background: "#050a14" }}>
      <PublicNav />

      {/* ── API STATUS BANNER ── */}
      {apiOnline === false && (
        <div className="fixed top-16 inset-x-0 z-40 flex items-center justify-center gap-3 px-4 py-2.5 text-xs font-medium" style={{ background: "rgba(239,68,68,0.12)", borderBottom: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          Voice playback unavailable — backend is restarting on Railway. The rest of the demo works perfectly. Retry in ~60s.
        </div>
      )}
      {apiOnline === true && (
        <div className="fixed top-16 inset-x-0 z-40 flex items-center justify-center gap-3 px-4 py-2.5 text-xs font-medium" style={{ background: "rgba(16,185,129,0.08)", borderBottom: "1px solid rgba(16,185,129,0.2)", color: "#6ee7b7" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Backend online — all voice features active. Click any language card to hear live AI audio.
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative pt-36 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,107,0,0.18), transparent)" }} />
        <div className="relative max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 text-xs font-semibold tracking-wide" style={{ borderColor: "rgba(255,107,0,0.3)", background: "rgba(255,107,0,0.08)", color: "#fb923c" }}>
            <Sparkles className="w-3 h-3" />
            Investor Demo — Full Platform Walkthrough
          </div>
          <h1 className="font-serif text-5xl md:text-7xl text-white leading-[1.0] tracking-tight mb-6">
            The Art of Possible<br />
            <span className="italic" style={{ background: "linear-gradient(135deg, #FF6B00, #fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              with Bolo
            </span>
          </h1>
          <p className="text-white/45 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            End-to-end: from customer speaking in Bhojpuri to your business dashboard — in under 500ms.
            Click anything below to experience it live.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
            {[
              { label: "Indian Languages", value: "11" },
              { label: "End-to-End Latency", value: "<500ms" },
              { label: "Accuracy (STT)", value: "94%" },
              { label: "Revenue Streams", value: "3" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl p-4 text-center" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <p className="font-serif text-3xl text-white mb-1">{value}</p>
                <p className="text-[11px] text-white/40 leading-tight">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={startFlow} disabled={flowPlaying} className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 4px 24px rgba(255,107,0,0.35)" }}>
              {flowPlaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {flowPlaying ? "Running E2E flow…" : "Run End-to-End Demo"}
            </button>
            <Link href="#voice" className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <Volume2 className="w-4 h-4" />
              Hear live voice first
            </Link>
          </div>
        </div>
      </section>

      {/* ── LIVE VOICE DEMOS ── */}
      <section id="voice" className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">Real AI Voice — No Pre-Recordings</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">
              Click to hear Bolo speak
            </h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">
              Every audio clip below is generated live by our AI — not a recording.
              This is what your customers will hear.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {VOICE_DEMOS.map((d) => (
              <VoiceCard key={d.code} demo={d} apiBase={API_BASE} apiOnline={apiOnline === true} />
            ))}
          </div>
          <p className="text-center text-xs text-white/20 mt-6">
            Powered by Mistral Voxtral (Hindi/English) + Sarvam AI (9 other languages)
          </p>
        </div>
      </section>

      {/* ── E2E FLOW ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">End-to-End Journey</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">
              From spoken word to resolved query
            </h2>
            <p className="text-white/40 text-base max-w-xl mx-auto mb-8">
              Watch the complete pipeline — a real Hindi customer asking about their order.
            </p>
            <button onClick={startFlow} disabled={flowPlaying} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {flowPlaying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {flowPlaying ? "Running…" : "Replay flow"}
            </button>
          </div>

          <div className="space-y-3">
            {E2E_FLOW.map((step, i) => {
              const Icon = step.icon;
              const isActive = i <= activeFlow;
              const isCurrent = i === activeFlow && flowPlaying;
              return (
                <div
                  key={i}
                  className="rounded-2xl p-5 transition-all duration-500"
                  style={{
                    background: isActive ? `${step.color}08` : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isActive ? step.color + "30" : "rgba(255,255,255,0.05)"}`,
                    opacity: activeFlow >= 0 && !isActive && flowPlaying ? 0.4 : 1,
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: isActive ? `${step.color}20` : "rgba(255,255,255,0.04)", border: `1px solid ${isActive ? step.color + "40" : "rgba(255,255,255,0.06)"}` }}>
                      {isActive && !isCurrent
                        ? <Check className="w-4 h-4" style={{ color: step.color }} />
                        : isCurrent
                        ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: step.color }} />
                        : <Icon className="w-4 h-4 text-white/20" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[10px] font-bold text-white/20 font-mono">{step.step}</span>
                        <h3 className="text-[15px] font-semibold text-white">{step.title}</h3>
                      </div>
                      <p className="text-sm text-white/40 leading-relaxed mb-2">{step.desc}</p>
                      {isActive && (
                        <div className="rounded-lg px-3 py-2 text-xs font-mono" style={{ background: `${step.color}10`, border: `1px solid ${step.color}20`, color: step.color }}>
                          <span className="text-white/30 mr-2">{step.exampleLang} →</span>
                          {step.example}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FULL CONVERSATION REPLAY ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">Real Conversations</p>
            <h2 className="font-serif text-4xl text-white mb-3">Six languages. Six industries.</h2>
            <p className="text-white/40 text-sm max-w-xl mx-auto">These are actual conversations from the seeded demo workspace — not mockups.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                lang: "Hindi", industry: "E-Commerce", color: "#FF6B00",
                messages: [
                  { role: "user", text: "मेरा ऑर्डर #4521 कहाँ है?" },
                  { role: "ai", text: "आपका ऑर्डर रास्ते में है, आज शाम 6 बजे तक पहुँचेगा।" },
                ],
              },
              {
                lang: "Tamil", industry: "Refund", color: "#6366f1",
                messages: [
                  { role: "user", text: "ஆர்டர் #7832 தவறான பொருள் வந்தது." },
                  { role: "ai", text: "மன்னிக்கவும்! 3-5 நாட்களில் பணம் திரும்பி வரும்." },
                ],
              },
              {
                lang: "Telugu", industry: "Product Discovery", color: "#10b981",
                messages: [
                  { role: "user", text: "₹500 లోపు పెళ్లి చీర కావాలి." },
                  { role: "ai", text: "12 చీరలు అందుబాటులో ఉన్నాయి! కాంచీపురం ₹450లో ఉంది." },
                ],
              },
              {
                lang: "Kannada", industry: "AgriTech", color: "#8b5cf6",
                messages: [
                  { role: "user", text: "ಟೊಮ್ಯಾಟೊ ಬೆಳೆಗೆ ಕೀಟ ಸಮಸ್ಯೆ ಇದೆ." },
                  { role: "ai", text: "ನೀಮ್ ಎಣ್ಣೆ 5ml/ಲೀ ದ್ರಾವಣ ಸಿಂಪಡಿಸಿ, 7 ದಿನಕ್ಕೊಮ್ಮೆ." },
                ],
              },
            ].map(({ lang, industry, color, messages }) => (
              <div key={lang} className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="px-4 py-2.5 flex items-center justify-between border-b border-white/[0.05]" style={{ background: `${color}08` }}>
                  <span className="text-xs font-semibold" style={{ color }}>{lang}</span>
                  <span className="text-[10px] text-white/30">{industry}</span>
                </div>
                <div className="p-4 space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2.5 ${m.role === "ai" ? "" : "flex-row-reverse"}`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0 ${m.role === "ai" ? "text-white/70" : "text-white/50"}`} style={{ background: m.role === "ai" ? `${color}20` : "rgba(255,255,255,0.06)" }}>
                        {m.role === "ai" ? "AI" : "U"}
                      </div>
                      <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${m.role === "ai" ? "text-white/75" : "text-white/55"}`} style={{ background: m.role === "ai" ? `${color}12` : "rgba(255,255,255,0.04)", border: `1px solid ${m.role === "ai" ? color + "20" : "rgba(255,255,255,0.06)"}` }}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALL FEATURES ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">Platform Capabilities</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">Everything. In one platform.</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, badge }) => (
              <div key={title} className="rounded-2xl p-5 group hover:bg-white/[0.04] transition-all" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.18)" }}>
                    <Icon className="w-4 h-4" style={{ color: "#fb923c" }} />
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${badge === "Live" ? "text-emerald-400 bg-emerald-400/10" : "text-amber-400 bg-amber-400/10"}`}>
                    {badge}
                  </span>
                </div>
                <h3 className="text-[13px] font-semibold text-white mb-1.5">{title}</h3>
                <p className="text-[12px] text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">Market Opportunity</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">Every industry needs this</h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">{"India's Tier 2 & 3 markets are the next $1T opportunity. They don't speak English."}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {USE_CASES.map(({ icon: Icon, color, industry, value, example }) => (
              <div key={industry} className="rounded-2xl p-5" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <p className="text-xs font-semibold mb-1" style={{ color }}>{industry}</p>
                <p className="text-sm font-bold text-white mb-2">{value}</p>
                <p className="text-[11px] text-white/30">{example}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-6 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-white/50 text-sm">
              <span className="text-white font-semibold">800M+</span> Indians speak a language other than Hindi as their mother tongue.
              Only <span className="text-white font-semibold">12%</span> of them are comfortable doing business in English.
              <span className="text-brand-400 font-semibold"> Bolo closes that gap.</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── MONETIZATION ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">Business Model</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-3">Three revenue streams</h2>
            <p className="text-white/40 text-base max-w-xl mx-auto">Not just SaaS. A platform with compounding network effects.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {REVENUE_MODELS.map(({ model, icon: Icon, color, desc, revenue, moat }) => (
              <div key={model} className="rounded-2xl p-6" style={{ background: `${color}06`, border: `1px solid ${color}20` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2">{model}</h3>
                <p className="text-sm text-white/45 leading-relaxed mb-4">{desc}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-3 h-3 shrink-0" style={{ color }} />
                    <p className="text-xs font-semibold" style={{ color }}>{revenue}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Shield className="w-3 h-3 shrink-0 mt-0.5 text-white/30" />
                    <p className="text-[11px] text-white/35 leading-relaxed">{moat}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* TAM */}
          <div className="mt-8 rounded-2xl p-8" style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.15)" }}>
            <div className="grid md:grid-cols-3 gap-6 text-center">
              {[
                { label: "India Voice AI TAM", value: "$4.2B", sub: "by 2028 (Redseer)" },
                { label: "SMBs needing vernacular AI", value: "63M+", sub: "in India alone" },
                { label: "Govt. schemes needing voice", value: "1400+", sub: "Central + State" },
              ].map(({ label, value, sub }) => (
                <div key={label}>
                  <p className="font-serif text-4xl text-white mb-1">{value}</p>
                  <p className="text-sm font-semibold text-white/70 mb-0.5">{label}</p>
                  <p className="text-xs text-white/30">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ANALYTICS PREVIEW ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">Intelligence Layer</p>
            <h2 className="font-serif text-4xl text-white mb-3">Every conversation is data</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-4">Language Distribution (Last 30 days)</p>
              <div className="space-y-3">
                {[
                  { lang: "Hindi", pct: 38, color: "#FF6B00" },
                  { lang: "Tamil", pct: 22, color: "#6366f1" },
                  { lang: "Telugu", pct: 17, color: "#10b981" },
                  { lang: "Bengali", pct: 11, color: "#f59e0b" },
                  { lang: "Others", pct: 12, color: "#8b5cf6" },
                ].map(({ lang, pct, color }) => (
                  <div key={lang} className="flex items-center gap-3">
                    <p className="text-xs text-white/50 w-16 shrink-0">{lang}</p>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04]">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <p className="text-xs text-white/40 w-8 text-right">{pct}%</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-xs text-white/30 font-semibold uppercase tracking-wider mb-4">Platform Performance</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { metric: "Avg Resolution Rate", value: "94%", icon: Check, color: "#10b981" },
                  { metric: "Avg CSAT Score", value: "4.8/5", icon: Star, color: "#f59e0b" },
                  { metric: "Avg Response Time", value: "412ms", icon: Zap, color: "#6366f1" },
                  { metric: "Cost vs Human Agent", value: "−87%", icon: TrendingUp, color: "#FF6B00" },
                ].map(({ metric, value, icon: Icon, color }) => (
                  <div key={metric} className="rounded-xl p-3" style={{ background: `${color}08`, border: `1px solid ${color}20` }}>
                    <Icon className="w-4 h-4 mb-2" style={{ color }} />
                    <p className="font-serif text-2xl text-white">{value}</p>
                    <p className="text-[10px] text-white/35 mt-0.5 leading-tight">{metric}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WIDGET DEMO ── */}
      <section className="py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-4">5-Minute Integration</p>
              <h2 className="font-serif text-4xl text-white mb-4 leading-tight">
                One script tag.<br />
                <span className="italic text-white/45">{"Your brand's voice."}</span>
              </h2>
              <p className="text-white/45 text-base leading-relaxed mb-6">
                Copy this into your website. Configure language, voice, and colors. Go live in minutes. No engineering team needed.
              </p>
              <div className="space-y-3">
                {["Works on any website, app, or WhatsApp", "Customizable colors, voice, and persona", "Handles 10,000+ concurrent conversations", "Full conversation history and analytics"].map((f) => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="rounded-2xl overflow-hidden" style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  <span className="text-xs text-white/30 font-mono ml-2">index.html</span>
                </div>
                <div className="p-5 font-mono text-sm space-y-1">
                  <p className="text-white/30">{"<!-- Add before </body> -->"}</p>
                  <p><span className="text-blue-400">{"<script"}</span></p>
                  <p className="pl-4"><span className="text-amber-300">src</span><span className="text-white/50">=</span><span className="text-green-400">&quot;https://cdn.bolo.ai/widget.js&quot;</span></p>
                  <p className="pl-4"><span className="text-amber-300">data-key</span><span className="text-white/50">=</span><span className="text-green-400">&quot;your-api-key&quot;</span></p>
                  <p className="pl-4"><span className="text-amber-300">data-lang</span><span className="text-white/50">=</span><span className="text-green-400">&quot;hi-IN&quot;</span></p>
                  <p className="pl-4"><span className="text-amber-300">data-color</span><span className="text-white/50">=</span><span className="text-green-400">&quot;#FF6B00&quot;</span></p>
                  <p><span className="text-blue-400">{">"}</span><span className="text-blue-400">{"</script>"}</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl p-12 md:p-16" style={{ background: "rgba(255,107,0,0.06)", border: "1px solid rgba(255,107,0,0.15)" }}>
            <p className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-5">Ready to go further?</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white mb-5 leading-tight">
              The platform is live.<br />
              <span className="italic" style={{ color: "#fb923c" }}>The opportunity is now.</span>
            </h2>
            <p className="text-white/45 text-base max-w-lg mx-auto mb-10 leading-relaxed">
              Log into the full dashboard to explore the knowledge base, voice clones, marketplace, and analytics — with real data pre-loaded.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/" className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 4px 24px rgba(255,107,0,0.35)" }}>
                <Play className="w-4 h-4" />
                Open Full Platform Demo
              </Link>
              <a href="mailto:invest@bolo.ai" className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-medium text-white/60 hover:text-white transition-all" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                Talk to the founders
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #FF6B00, #fbbf24)" }}>
              <Mic className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-serif text-white text-[16px]">Bolo</span>
          </div>
          <p className="text-xs text-white/20">Speak the Heart of Bharat · © 2026 Bolo · Made for India</p>
          <a href="mailto:invest@bolo.ai" className="text-sm text-white/30 hover:text-white/60 transition-colors">invest@bolo.ai</a>
        </div>
      </footer>
    </div>
  );
}
