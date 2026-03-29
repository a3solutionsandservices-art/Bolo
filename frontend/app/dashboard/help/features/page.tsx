"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic, FileText, Languages, MessageSquare, BookOpen,
  Copy, Store, BarChart3, CreditCard, Key, ArrowRight,
  ChevronDown, ChevronUp, CheckCircle2, Clock, Zap,
  IndianRupee, Users, Globe, Star, Database, Radio,
  TrendingUp, AlertCircle,
} from "lucide-react";
import { clsx } from "clsx";

interface IPOFeature {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  tagline: string;
  monetization: string;
  pricing: string;
  input: { label: string; detail: string }[];
  process: { label: string; detail: string }[];
  output: { label: string; detail: string }[];
  cta?: { label: string; href: string };
  status: "live" | "coming_soon";
}

const FEATURES: IPOFeature[] = [
  {
    id: "stt",
    icon: Mic,
    color: "bg-violet-600",
    title: "Speech-to-Text (STT)",
    tagline: "Convert any Indian-language audio into accurate text",
    monetization: "Metered — charged per audio second",
    pricing: "Included in all plans · Overage: ₹0.05 / min",
    status: "live",
    input: [
      { label: "Audio file", detail: "WAV, MP3, WebM, OGG up to 25 MB" },
      { label: "Language code", detail: "hi, ta, te, bn, gu, mr, kn, ml, pa, or, en" },
    ],
    process: [
      { label: "Upload", detail: "Audio sent to Sarvam saaras:v2 model" },
      { label: "Transcribe", detail: "AI recognises speech including accents, dialect variation" },
      { label: "Score", detail: "Returns confidence score (0–1) and duration in seconds" },
    ],
    output: [
      { label: "Transcript text", detail: "Verbatim text in the detected language" },
      { label: "Confidence", detail: "Number 0–1 (1 = perfect, <0.4 = noisy audio)" },
      { label: "Duration", detail: "Length of speech in seconds" },
    ],
    cta: { label: "Try in Conversations →", href: "/dashboard/conversations/new" },
  },
  {
    id: "tts",
    icon: Radio,
    color: "bg-brand-600",
    title: "Text-to-Speech (TTS)",
    tagline: "Turn text into natural-sounding Indian-language audio",
    monetization: "Metered — charged per character synthesised",
    pricing: "Included in all plans · Overage: ₹0.002 / character",
    status: "live",
    input: [
      { label: "Text string", detail: "Any text up to 500 characters per request" },
      { label: "Target language", detail: "hi, ta, te, bn, gu, mr, kn, ml, pa, or, en" },
      { label: "Voice ID (optional)", detail: "Use your cloned voice or a default Sarvam voice" },
    ],
    process: [
      { label: "Synthesise", detail: "Text sent to Sarvam bulbul:v1 model" },
      { label: "Render", detail: "AI generates natural speech with correct intonation" },
      { label: "Encode", detail: "Audio returned as Base64 or stored to media URL" },
    ],
    output: [
      { label: "Audio (Base64)", detail: "Ready to play directly in browser with <audio>" },
      { label: "Media URL", detail: "Persistent URL served via /media/ endpoint" },
      { label: "Character count", detail: "Logged against your usage quota" },
    ],
    cta: { label: "Try in Voice Playground →", href: "/dashboard/conversations/new" },
  },
  {
    id: "translation",
    icon: Languages,
    color: "bg-blue-600",
    title: "Voice Translation",
    tagline: "Translate speech or text across all 11 Indian languages",
    monetization: "Metered — charged per character translated",
    pricing: "Included in all plans · Overage: ₹0.001 / character",
    status: "live",
    input: [
      { label: "Source text", detail: "Text in any supported Indian language" },
      { label: "Source language", detail: "Language code of the input text (e.g. hi)" },
      { label: "Target language", detail: "Language code to translate into (e.g. ta)" },
    ],
    process: [
      { label: "Detect", detail: "Confirms source language if ambiguous" },
      { label: "Translate", detail: "Sarvam translate API — preserves nuance, idioms" },
      { label: "Log", detail: "Character count recorded for billing" },
    ],
    output: [
      { label: "Translated text", detail: "Accurate translation in target language" },
      { label: "Source lang confirmed", detail: "Returns detected source if auto-detect used" },
    ],
    cta: { label: "Try Translation →", href: "/dashboard/conversations/new" },
  },
  {
    id: "conversation",
    icon: MessageSquare,
    color: "bg-indigo-600",
    title: "AI Conversation Agent",
    tagline: "Full voice conversation — customer speaks, AI responds in their language",
    monetization: "Per-conversation + usage metering",
    pricing: "Starter: 1,000 conv/mo · Growth: 10,000 · Enterprise: unlimited",
    status: "live",
    input: [
      { label: "Conversation mode", detail: "CONVERSATION (AI agent) or TRANSLATION (live relay)" },
      { label: "Source language", detail: "Language the user speaks" },
      { label: "Target language", detail: "Language the AI responds in" },
      { label: "Knowledge Base ID (optional)", detail: "Link to a KB so the AI uses your documents" },
      { label: "Voice/text message", detail: "User's spoken or typed query" },
    ],
    process: [
      { label: "STT", detail: "Audio transcribed to text" },
      { label: "RAG lookup", detail: "If KB linked: top matching document chunks retrieved from Pinecone" },
      { label: "LLM", detail: "GPT-4o generates a contextual response using retrieved chunks" },
      { label: "Translate", detail: "If source ≠ target language: response translated" },
      { label: "TTS", detail: "Response spoken aloud in target language voice" },
      { label: "Sentiment", detail: "Intent + sentiment scored in background (gpt-4o-mini)" },
    ],
    output: [
      { label: "Text response", detail: "AI's answer as readable text" },
      { label: "Audio URL", detail: "MP3/WAV of the spoken response" },
      { label: "Sentiment score", detail: "Positive / negative / neutral + detected intent" },
      { label: "Transcript", detail: "Full conversation log downloadable as JSON or TXT" },
    ],
    cta: { label: "Start a Conversation →", href: "/dashboard/conversations/new" },
  },
  {
    id: "knowledge",
    icon: BookOpen,
    color: "bg-emerald-600",
    title: "Knowledge Base (RAG)",
    tagline: "Upload your documents — AI learns your business and answers questions from them",
    monetization: "Per query + storage",
    pricing: "Starter: 3 KBs · Growth: 20 KBs · Enterprise: unlimited",
    status: "live",
    input: [
      { label: "Documents", detail: "PDF, DOCX, TXT — up to 10 MB each" },
      { label: "Knowledge Base name", detail: "e.g. 'Return Policy', 'Product Catalogue'" },
      { label: "Languages", detail: "Tag which languages the documents are written in" },
    ],
    process: [
      { label: "Parse", detail: "Text extracted from PDF/DOCX using PyPDF + python-docx" },
      { label: "Chunk", detail: "Split into 500-token overlapping chunks" },
      { label: "Embed", detail: "Each chunk converted to vector via OpenAI text-embedding-ada-002" },
      { label: "Store", detail: "Vectors stored in Pinecone for fast similarity search" },
      { label: "Query", detail: "At conversation time: user question → top-3 matching chunks retrieved" },
    ],
    output: [
      { label: "Document status", detail: "PENDING → PROCESSING → READY (usually 1–3 min)" },
      { label: "Chunk count", detail: "How many searchable pieces your document was split into" },
      { label: "Query answer", detail: "AI response grounded in your document text" },
    ],
    cta: { label: "Create Knowledge Base →", href: "/dashboard/knowledge" },
  },
  {
    id: "voice-clone",
    icon: Copy,
    color: "bg-pink-600",
    title: "Voice Cloning",
    tagline: "Create a digital replica of your voice for your AI assistant",
    monetization: "Add-on per workspace",
    pricing: "Growth plan and above · ₹999/clone/month",
    status: "live",
    input: [
      { label: "Audio samples", detail: "3–10 min total of clear, natural speech in WAV/MP3" },
      { label: "Language", detail: "Primary language of the voice" },
      { label: "Clone name", detail: "e.g. 'Priya (Hindi Customer Support)'" },
    ],
    process: [
      { label: "Validate", detail: "Each sample checked: min 3s, min 40% STT confidence, speech present" },
      { label: "Upload", detail: "Samples stored securely (S3 or local media)" },
      { label: "Train", detail: "Sarvam voice model trained on your samples" },
      { label: "Activate", detail: "Set as default voice — used for all TTS in your workspace" },
    ],
    output: [
      { label: "Voice Clone ID", detail: "Unique ID to use in TTS requests" },
      { label: "Status", detail: "PENDING → TRAINING → READY" },
      { label: "Playback test", detail: "Listen to sample output before setting as default" },
    ],
    cta: { label: "Create Voice Clone →", href: "/dashboard/voice-clones" },
  },
  {
    id: "marketplace-license",
    icon: Store,
    color: "bg-amber-600",
    title: "Voice Marketplace — License a Voice",
    tagline: "Use celebrity and regional artist voices in your AI product",
    monetization: "Platform takes 20% commission on each license",
    pricing: "Personal: ₹999 · Commercial: ₹4,999 · Broadcast: ₹14,999 · Exclusive: ₹49,999",
    status: "live",
    input: [
      { label: "Browse artists", detail: "Filter by language, dialect, category (celebrity, narrator, etc.)" },
      { label: "Select tier", detail: "Personal / Commercial / Broadcast / Exclusive" },
      { label: "Content category", detail: "e.g. Customer Support, Advertising, Education" },
      { label: "Usage description", detail: "Brief description of how you'll use the voice" },
    ],
    process: [
      { label: "Request", detail: "License request sent to artist for approval" },
      { label: "Review", detail: "Artist approves or declines within 48 hours" },
      { label: "Payment", detail: "Stripe payment processed on approval" },
      { label: "Credit", detail: "80% goes to artist, 20% platform fee retained" },
    ],
    output: [
      { label: "License ID", detail: "Active license for your workspace" },
      { label: "Voice access", detail: "Licensed voice available for TTS in your conversations" },
      { label: "Usage tracking", detail: "Max usage count tracked against license terms" },
    ],
    cta: { label: "Browse Marketplace →", href: "/dashboard/marketplace" },
  },
  {
    id: "marketplace-contribute",
    icon: Database,
    color: "bg-teal-600",
    title: "Voice Marketplace — Contribute & Earn",
    tagline: "Record scripted sentences in your dialect and earn ₹2–5 per accepted recording",
    monetization: "Platform sells data packages to AI companies; artist earns per accepted recording",
    pricing: "₹2–₹5 per accepted recording · Paid to UPI",
    status: "live",
    input: [
      { label: "Data consent", detail: "Enable Language Preservation Programme in your artist profile" },
      { label: "Language selection", detail: "Choose which language / dialect you're recording in" },
      { label: "Read prompts aloud", detail: "Scripted sentences shown one at a time — read naturally" },
    ],
    process: [
      { label: "Record", detail: "Browser MediaRecorder captures audio (WebM)" },
      { label: "Transcribe", detail: "Sarvam STT transcribes your recording" },
      { label: "Quality check", detail: "CER (Character Error Rate) calculated: accepted if ≤35% error" },
      { label: "Store", detail: "Accepted recordings stored with speaker metadata (age, district, dialect)" },
    ],
    output: [
      { label: "Acceptance result", detail: "Instant pass/fail with clarity score shown" },
      { label: "Earnings credited", detail: "₹ logged against your artist profile" },
      { label: "Stats", detail: "Total submissions, accepted count, acceptance rate by language" },
    ],
    cta: { label: "Go to My Voice →", href: "/dashboard/marketplace/my-voice" },
  },
  {
    id: "analytics",
    icon: BarChart3,
    color: "bg-cyan-600",
    title: "Analytics Dashboard",
    tagline: "See what your customers are asking, in which language, and how fast the AI responds",
    monetization: "Included — drives retention and upsell to higher plans",
    pricing: "Included in all plans",
    status: "live",
    input: [
      { label: "Date range", detail: "Last 7, 14, 30, or 90 days" },
      { label: "Automatic", detail: "Every conversation, message, and language use is logged automatically" },
    ],
    process: [
      { label: "Aggregate", detail: "Conversations grouped by day (date_trunc, cross-DB compatible)" },
      { label: "Language breakdown", detail: "Message counts grouped by source language" },
      { label: "Latency", detail: "Response times grouped by hour to identify peak-load patterns" },
    ],
    output: [
      { label: "Overview metrics", detail: "Total conversations, messages, active users, avg sentiment" },
      { label: "Conversation chart", detail: "Daily volume line chart — spot trends at a glance" },
      { label: "Language chart", detail: "Bar chart of top languages used — see which regions are most active" },
      { label: "Latency chart", detail: "P50/P95 response times — verify SLA compliance" },
    ],
    cta: { label: "View Analytics →", href: "/dashboard/analytics" },
  },
  {
    id: "billing",
    icon: CreditCard,
    color: "bg-slate-600",
    title: "Subscription Plans",
    tagline: "Start free, scale as you grow",
    monetization: "Recurring monthly SaaS revenue",
    pricing: "Starter ₹49/mo · Growth ₹199/mo · Enterprise custom",
    status: "live",
    input: [
      { label: "Plan selection", detail: "Starter / Growth / Enterprise" },
      { label: "Payment method", detail: "Card via Stripe Checkout (INR supported)" },
    ],
    process: [
      { label: "Checkout", detail: "Stripe hosted checkout page — no card data touches your servers" },
      { label: "Webhook", detail: "Stripe notifies Bolo on payment success" },
      { label: "Activate", detail: "Subscription record updated; higher limits unlocked" },
    ],
    output: [
      { label: "Active subscription", detail: "Plan status shown in Billing settings" },
      { label: "Usage quota", detail: "Conversations, KBs, voice clones as per plan" },
      { label: "Portal", detail: "Manage, cancel or change plan via Stripe Customer Portal" },
    ],
    cta: { label: "View Billing →", href: "/dashboard/settings/billing" },
  },
  {
    id: "api",
    icon: Key,
    color: "bg-gray-700",
    title: "API Access",
    tagline: "Embed Bolo's voice AI directly into your own product via REST API",
    monetization: "Locks in developers — high retention, drives usage billing",
    pricing: "Included in all plans · Rate limited by tier",
    status: "live",
    input: [
      { label: "API key name", detail: "Descriptive label e.g. 'Production Server'" },
      { label: "Scopes (optional)", detail: "voice, conversations, knowledge, analytics" },
    ],
    process: [
      { label: "Generate", detail: "SHA-256 hashed key stored; raw key shown once" },
      { label: "Authenticate", detail: "Pass as Bearer token or X-API-Key header" },
      { label: "Rate limit", detail: "60 req/min on Starter, 300/min on Growth" },
    ],
    output: [
      { label: "API key (shown once)", detail: "Copy and store securely — cannot be retrieved again" },
      { label: "Full API access", detail: "All endpoints available at /api/v1/*" },
      { label: "OpenAPI docs", detail: "Interactive docs at /docs (Swagger UI)" },
    ],
    cta: { label: "Manage API Keys →", href: "/dashboard/api-keys" },
  },
];

const REMAINING: { title: string; detail: string; priority: "high" | "medium" | "low" }[] = [
  { title: "UPI / Stripe Connect Payouts", detail: "Artist earnings are tracked but no automated payout flow exists. Needs Stripe Connect onboarding or UPI API integration to actually transfer ₹ to artists.", priority: "high" },
  { title: "WhatsApp Business webhook handler", detail: "The integration wizard shows instructions, but the backend has no endpoint to receive and respond to WhatsApp messages. Needs a /webhooks/whatsapp endpoint + Twilio/360dialog connector.", priority: "high" },
  { title: "Forgot Password / Email Verification", detail: "Registration creates accounts but no email is sent. Password reset requires DB access currently. Needs SMTP integration (SendGrid / SES).", priority: "high" },
  { title: "Plan-based feature gating", detail: "All features are accessible regardless of subscription plan. The billing model and quota fields exist but are not enforced in API routes.", priority: "high" },
  { title: "Admin Panel (Platform-level)", detail: "No UI for platform admins to review marketplace artist applications, moderate content, view cross-tenant analytics, or manage payouts.", priority: "medium" },
  { title: "Webhook Delivery System", detail: "The Webhook model exists in the DB but there is no worker that delivers event payloads to customer URLs. Needed for real CRM/Shopify integrations.", priority: "medium" },
  { title: "Peer Validation for Voice Contributions", detail: "is_peer_validated column exists in DataContribution but no API endpoint or UI to let validators review and approve recordings.", priority: "medium" },
  { title: "Multi-user Workspace", detail: "Only one admin per tenant currently. No invite flow, no role management UI, no team members list.", priority: "medium" },
  { title: "Conversation Export (CSV / Excel)", detail: "Transcripts are available per-conversation but no bulk export for CRM import or compliance archiving.", priority: "low" },
  { title: "Custom Widget Domain", detail: "Widget embed code uses the Bolo domain. White-label customers need to serve the widget from their own domain.", priority: "low" },
  { title: "Mobile SDK (React Native)", detail: "Mentioned in roadmap but no SDK code exists. Would allow native iOS/Android apps to embed real-time voice.", priority: "low" },
  { title: "A/B Testing for Widget Config", detail: "No way to test different welcome messages, languages, or voices against each other to optimise conversion.", priority: "low" },
];

function IPOCard({ feature, expanded, onToggle }: { feature: IPOFeature; expanded: boolean; onToggle: () => void }) {
  const Icon = feature.icon;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-5 flex items-center gap-4 hover:bg-white/[0.04]/60 transition-colors">
        <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", feature.color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
            {feature.status === "live" ? (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded-full">LIVE</span>
            ) : (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">COMING SOON</span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 truncate">{feature.tagline}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
            <IndianRupee className="w-3 h-3" />
            {feature.monetization.split("—")[0].trim()}
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/35" /> : <ChevronDown className="w-4 h-4 text-white/35" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-5 space-y-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium text-emerald-800">{feature.pricing}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Input</span>
              </div>
              {feature.input.map((item, i) => (
                <div key={i} className="bg-blue-50/60 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-900">{item.label}</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <span className="text-xs font-bold text-violet-700 uppercase tracking-wider">Process</span>
              </div>
              {feature.process.map((item, i) => (
                <div key={i} className="bg-violet-50/60 border border-violet-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-violet-900">{item.label}</p>
                  <p className="text-[11px] text-violet-700 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Output</span>
              </div>
              {feature.output.map((item, i) => (
                <div key={i} className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-emerald-900">{item.label}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {feature.cta && (
            <div className="flex justify-end">
              <Link href={feature.cta.href} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                {feature.cta.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function FeatureGuidePage() {
  const [expanded, setExpanded] = useState<string | null>("conversation");
  const [remainingFilter, setRemainingFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const filtered = REMAINING.filter((r) => remainingFilter === "all" || r.priority === remainingFilter);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Link href="/dashboard/help" className="text-xs text-white/30 hover:text-slate-600 transition-colors">Help Centre</Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs text-slate-600 font-medium">Feature Guide</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Feature Guide</h1>
        <p className="text-sm text-slate-500 mt-1">Input → Process → Output for every monetizable feature on Bolo</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle2, label: "Live Features", value: FEATURES.filter(f => f.status === "live").length.toString(), color: "text-emerald-600", bg: "bg-emerald-50" },
          { icon: Clock, label: "Coming Soon", value: REMAINING.length.toString(), color: "text-amber-600", bg: "bg-amber-50" },
          { icon: IndianRupee, label: "Revenue Streams", value: "8", color: "text-brand-600", bg: "bg-brand-50" },
          { icon: Globe, label: "Languages", value: "11", color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className={clsx("rounded-2xl border border-slate-200/60 p-4", s.bg)}>
            <s.icon className={clsx("w-5 h-5 mb-2", s.color)} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Live Features</h2>
          <span className="text-xs text-white/30">Click any feature to expand</span>
        </div>
        <div className="space-y-3">
          {FEATURES.map((f) => (
            <IPOCard
              key={f.id}
              feature={f}
              expanded={expanded === f.id}
              onToggle={() => setExpanded(expanded === f.id ? null : f.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Remaining Features</h2>
            <p className="text-xs text-slate-500 mt-0.5">What&apos;s not yet built — and what it takes</p>
          </div>
          <div className="flex items-center gap-2">
            {(["all", "high", "medium", "low"] as const).map((p) => (
              <button key={p} onClick={() => setRemainingFilter(p)} className={clsx(
                "px-3 py-1 rounded-full text-xs font-semibold border transition-colors capitalize",
                remainingFilter === p ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:bg-white/[0.04]"
              )}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((item, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                  <span className={clsx("px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider", PRIORITY_STYLES[item.priority])}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 bg-brand-50 border border-brand-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-brand-900">Priority build order</p>
              <p className="text-xs text-brand-700 mt-1">
                For MVP investor demo: focus on <strong>UPI payouts</strong> + <strong>email verification</strong> + <strong>plan gating</strong>.
                For enterprise sales: add <strong>webhook delivery</strong> + <strong>multi-user workspace</strong>.
                For marketplace growth: add <strong>peer validation</strong> + <strong>admin panel</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
