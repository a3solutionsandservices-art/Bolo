"use client";

import Link from "next/link";
import {
  Mic, Globe, Zap, Shield, Database, Code2, BarChart3,
  Volume2, Lock, Webhook, RefreshCw, Layers, Clock, ArrowRight, Check,
} from "lucide-react";
import PublicNav from "@/components/layout/PublicNav";

const FEATURES = [
  {
    icon: Globe,
    title: "11 Indian Languages — Natively",
    desc: "Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Odia + English. Not translated — understood. Trained on native speech, regional accents, and Hinglish.",
    size: "col-span-2",
    accent: "from-brand-600 to-violet-600",
  },
  {
    icon: Zap,
    title: "< 500ms End-to-End Latency",
    desc: "Speech-to-text → reasoning → text-to-speech in under half a second. Fast enough to feel like a real human conversation.",
    size: "col-span-1",
    accent: "from-amber-500 to-orange-500",
  },
  {
    icon: Database,
    title: "RAG — Trained on Your Data",
    desc: "Upload FAQs, product catalogues, policy PDFs. Your assistant answers from your knowledge base — not the internet. Instant indexing.",
    size: "col-span-1",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    icon: Code2,
    title: "One Script Tag — 5-Minute Setup",
    desc: "Copy a single <script> tag before </body>. Or call our REST API. No engineering team needed to go live.",
    size: "col-span-1",
    accent: "from-brand-500 to-sky-500",
  },
  {
    icon: Shield,
    title: "Data Residency in India",
    desc: "All data processed and stored within India. Full audit trail per conversation. Compliant with DPDP Act 2023. SOC 2 in progress.",
    size: "col-span-1",
    accent: "from-violet-600 to-purple-600",
  },
  {
    icon: BarChart3,
    title: "Conversation Intelligence",
    desc: "Sentiment scoring, topic clustering, drop-off detection, and CSAT prediction — across every session, every language, in real time.",
    size: "col-span-1",
    accent: "from-rose-500 to-pink-500",
  },
  {
    icon: Mic,
    title: "Your Brand's Voice",
    desc: "Clone your own voice. License an Indian celebrity or RJ. Or choose from 10+ built-in personas — each tuned for regional tone and affect.",
    size: "col-span-1",
    accent: "from-saffron-500 to-amber-500",
  },
];

const DEEP_FEATURES = [
  {
    icon: Volume2,
    title: "Neural TTS with Voxtral & Sarvam",
    desc: "Powered by Mistral's Voxtral for Hindi and English. Sarvam AI for all 10 other Indian languages. Best-in-class naturalness for Indian accents.",
  },
  {
    icon: Lock,
    title: "JWT + API Key Auth",
    desc: "Secure every conversation with short-lived JWT tokens. Rotate API keys per environment. Role-based access for team members.",
  },
  {
    icon: Webhook,
    title: "Webhooks & Integrations",
    desc: "Push conversation events to Zapier, Slack, CRMs, or your own backend in real time. Pre-built templates for Shopify, Salesforce, WhatsApp.",
  },
  {
    icon: RefreshCw,
    title: "Real-time WebSocket Streaming",
    desc: "Live voice streaming over WebSocket. Transcription and response streamed as the user speaks — no wait for full utterance.",
  },
  {
    icon: Layers,
    title: "Multi-turn Conversation Memory",
    desc: "Context preserved across the full conversation. Users can ask follow-up questions, change language mid-session, and the AI keeps up.",
  },
  {
    icon: Clock,
    title: "Async Transcription & Search",
    desc: "Post-call transcription available within seconds. Full-text search across all conversations. Export to CSV or connect to your data warehouse.",
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#050a14" }}>

      <PublicNav active="features" />

      {/* Hero */}
      <section className="relative pt-40 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(255,107,0,0.12), transparent)" }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs text-saffron-400 font-semibold tracking-widest uppercase mb-4">Platform</p>
          <h1 className="font-serif text-5xl md:text-6xl text-white leading-[1.05] tracking-tight mb-4">
            Built for Bharat.<br />
            <span className="italic text-white/45">Ready for the world.</span>
          </h1>
          <p className="text-white/40 text-lg leading-relaxed max-w-xl mx-auto">
            Everything in one platform — STT, translation, LLM reasoning, TTS, analytics, and integrations — tuned for Indian languages from day one.
          </p>
        </div>
      </section>

      {/* Bento grid */}
      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc, size, accent }) => (
              <div key={title} className={`${size} rounded-2xl p-7 group hover:bg-white/[0.06] transition-all duration-300`} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
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

      {/* Deep features */}
      <section className="px-6 pb-24 border-t border-white/[0.05] pt-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-3">Under the Hood</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white">What makes it enterprise-ready</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {DEEP_FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.18)" }}>
                  <Icon className="w-4 h-4" style={{ color: "#fb923c" }} />
                </div>
                <h3 className="text-[14px] font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 border-t border-white/[0.05]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs text-white/30 font-semibold tracking-widest uppercase mb-4">Getting Started</p>
            <h2 className="font-serif text-4xl md:text-5xl text-white leading-tight">
              Live in{" "}
              <span className="italic bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">5 minutes</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { n: "01", title: "Upload your docs", desc: "Drop in FAQs, product catalogs, policy PDFs. Bolo indexes them instantly." },
              { n: "02", title: "Configure your agent", desc: "Pick languages, choose a voice, set your colors. No code. Done in 2 minutes." },
              { n: "03", title: "Embed one script tag", desc: "Copy a single <script> tag and paste before </body>. Or call our API." },
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

      {/* ── WHY BOLO ── */}
      <section className="py-20 px-6 border-t border-white/[0.05] pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="glass-dark rounded-3xl p-10 md:p-14 text-center">
            <p className="text-xs text-white/30 uppercase tracking-widest mb-6 font-semibold">The honest pitch</p>
            <h2 className="font-serif text-3xl md:text-4xl text-white mb-6 leading-snug">
              Google and Azure give you APIs.<br />
              <span className="italic text-brand-400">Bolo gives you a working product.</span>
            </h2>
            <p className="text-white/45 text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Stitching together STT + Translation + LLM + TTS + voice UI takes months.
              Bolo ships the full stack, tuned for Indian languages and accents, in a single platform.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {["Indian-first STT & TTS", "RAG on your own data", "Sub-500ms latency", "Data stays in India", "No engineering team needed"].map((f) => (
                <span key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm text-white/60" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                  {f}
                </span>
              ))}
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all shadow-xl shadow-brand-600/30 hover:-translate-y-0.5">
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
