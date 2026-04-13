"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight,
  ShoppingCart, GraduationCap, Landmark, Heart,
  Truck, Leaf, Radio, Building2,
} from "lucide-react";
import PublicNav from "@/components/layout/PublicNav";

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

export default function UseCasesPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#050a14" }}>

      <PublicNav active="use-cases" />

      {/* Hero */}
      <section className="relative pt-40 pb-16 px-6 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(79,70,229,0.15), transparent)" }} />
        <div className="relative max-w-3xl mx-auto">
          <p className="text-xs text-brand-400 font-semibold tracking-widest uppercase mb-4">Who It&apos;s For</p>
          <h1 className="font-serif text-5xl md:text-6xl text-white leading-[1.05] tracking-tight mb-4">
            Every industry.<br />
            <span className="italic text-white/45">Every Indian language.</span>
          </h1>
          <p className="text-white/40 text-lg leading-relaxed max-w-xl mx-auto">
            Bolo is not a generic chatbot. Here&apos;s exactly how each sector uses it — with real, specific examples.
          </p>
        </div>
      </section>

      {/* Verticals grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5">
            {USE_CASE_VERTICALS.map(({ icon: Icon, color, tag, headline, subhead, examples, href }) => (
              <Link
                key={tag}
                href={href}
                className="group block rounded-2xl p-7 border border-white/[0.07] hover:border-white/[0.15] transition-all duration-300"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest block mb-1" style={{ color: `${color}bb` }}>{tag}</span>
                    <h2 className="font-serif text-[19px] text-white leading-snug">{headline}</h2>
                    <p className="text-sm italic text-white/35 leading-snug">{subhead}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  {examples.map(({ title, desc }) => (
                    <div key={title} className="flex gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white/85 leading-tight">{title}</p>
                        <p className="text-xs text-white/40 leading-relaxed mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold transition-colors" style={{ color: `${color}99` }}>
                  Get started with this template
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 text-center rounded-2xl p-10" style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.08) 0%, rgba(79,70,229,0.06) 100%)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="font-serif text-3xl text-white mb-3">Don&apos;t see your industry?</h3>
            <p className="text-white/40 text-base mb-8 max-w-md mx-auto">Every business that talks to customers in India has a use case. Let&apos;s figure yours out together.</p>
            <a href="mailto:support@bolospeak.com" className="inline-flex items-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 text-[15px]" style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 4px 20px rgba(255,107,0,0.3)" }}>
              Contact us at support@bolospeak.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
