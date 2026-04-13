"use client";

import Link from "next/link";
import { ArrowRight, Shield, Users, Globe, Heart, BookOpen, Zap, Mic } from "lucide-react";
import PublicNav from "@/components/layout/PublicNav";

const PRINCIPLES = [
  {
    icon: Globe,
    title: "Linguistic Integrity",
    body: "We never 'translate' at the cost of meaning. We prioritize native intent and regional nuance.",
  },
  {
    icon: Shield,
    title: "Data Sovereignty",
    body: "Your data stays in India. We respect the privacy of the businesses we serve and the citizens they talk to.",
  },
  {
    icon: Users,
    title: "Artist Rights",
    body: "Our Voice Marketplace is built on a foundation of consent, ensuring regional voice artists are fairly compensated for their digital heritage.",
  },
];

function SectionDivider() {
  return (
    <div className="flex items-center gap-4 my-14">
      <div className="flex-1 h-px" style={{ background: "rgba(255,107,0,0.12)" }} />
      <div className="w-2 h-2 rounded-full" style={{ background: "rgba(255,107,0,0.3)" }} />
      <div className="flex-1 h-px" style={{ background: "rgba(255,107,0,0.12)" }} />
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen text-white" style={{ background: "#050a14" }}>

      <PublicNav active="about" />

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(255,107,0,0.12), transparent)" }} />
        <div className="absolute top-40 left-1/3 w-96 h-96 rounded-full blur-3xl" style={{ background: "rgba(255,107,0,0.05)" }} />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-10 text-xs font-medium tracking-wide" style={{ borderColor: "rgba(255,107,0,0.25)", background: "rgba(255,107,0,0.08)", color: "#fb923c" }}>
            <Heart className="w-3 h-3" />
            Our Story
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-white leading-[1.0] tracking-tight mb-4">
            Speaking the Heart
          </h1>
          <h1 className="font-serif italic text-5xl md:text-6xl lg:text-7xl leading-[1.0] tracking-tight mb-8" style={{ background: "linear-gradient(135deg, #FF6B00, #fbbf24, #f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            of Bharat
          </h1>
          <p className="text-lg text-white/40 leading-relaxed font-light max-w-xl mx-auto">
            Because Communication is a Birthright, Not a Privilege.
          </p>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 pb-32">

        {/* Opening */}
        <div className="rounded-2xl p-8 mb-10" style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.12)" }}>
          <p className="text-white/70 text-lg leading-relaxed mb-5">
            In the next decade, the heartbeat of the global economy will pulse through the Tier 2 and Tier 3 cities of India. Yet, for too long, a <span className="text-white font-medium">&ldquo;Digital Language Divide&rdquo;</span> has stood in the way. Most voice platforms treat Indian languages as a secondary translation task — a robotic layer that strips away the soul, dialect, and dignity of the speaker.
          </p>
          <p className="text-white/70 text-lg leading-relaxed">
            At <span className="font-bold text-white">Bolo</span>, we believe that every Indian has the right to be understood in the language they think in. We aren&apos;t just building a voice platform; we are building a bridge to{" "}
            <span className="font-semibold" style={{ color: "#fb923c" }}>Linguistic Sovereignty.</span>
          </p>
        </div>

        <SectionDivider />

        {/* Mission */}
        <div className="mb-10">
          <h2 className="font-serif text-3xl text-white mb-2">Our Mission</h2>
          <p className="text-white/35 text-sm mb-8">Preserving the Voices of India</p>
          <p className="text-white/60 text-base leading-relaxed mb-8">
            Urbanization and commercialization should not come at the cost of our identity. We are building for the social fabric of India as much as its economy.
          </p>
          <div className="space-y-5">
            {[
              {
                title: "Cultural Guardianship",
                body: "While others focus on 'Standard' versions of major languages, we are committed to capturing the thousands of dialects and local bolis that define our heritage.",
              },
              {
                title: "Linguistic Inclusion",
                body: "We empower the farmer in Odisha and the shopkeeper in Tamil Nadu to navigate the digital world with the same ease as a tech professional in Bangalore.",
              },
              {
                title: "Preventing Language Extinction",
                body: "By making regional dialects economically viable for modern business, we ensure they remain vibrant and functional. Through our Voice Marketplace, we allow the sounds of our ancestors to build the businesses of the future.",
                link: { label: "Voice Marketplace", href: "/dashboard/marketplace" },
              },
            ].map(({ title, body, link }) => (
              <div key={title} className="flex gap-4 p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-1 rounded-full shrink-0 mt-1 self-stretch" style={{ background: "linear-gradient(180deg, #FF6B00, rgba(255,107,0,0.2))" }} />
                <div>
                  <p className="text-white font-semibold mb-1.5">{title}</p>
                  <p className="text-white/50 text-sm leading-relaxed">
                    {link ? body.replace(link.label, "") : body}
                    {link && <Link href={link.href} className="underline underline-offset-2 transition-colors" style={{ color: "#fb923c" }}>{link.label}</Link>}
                    {link && body.split(link.label)[1]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SectionDivider />

        {/* Commercial edge */}
        <div className="mb-10">
          <h2 className="font-serif text-3xl text-white mb-2">The Commercial Edge</h2>
          <p className="text-white/35 text-sm mb-8">10x Your Reach, Not Your Overhead</p>
          <p className="text-white/60 text-base leading-relaxed mb-8">
            For businesses, &ldquo;Bharat&rdquo; is the ultimate growth frontier. But you cannot win a market you cannot speak to.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Heart,
                title: "Exponential Value",
                body: "By speaking the heart of your customers, you build a level of trust that converts one-time users into lifelong advocates.",
              },
              {
                icon: Zap,
                title: "Native Intelligence",
                body: "Understands Hinglish, regional slang, and intent — responding in under 500ms so your customers never feel like they're talking to a machine.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: "rgba(255,107,0,0.12)", border: "1px solid rgba(255,107,0,0.2)" }}>
                  <Icon className="w-4 h-4" style={{ color: "#fb923c" }} />
                </div>
                <p className="text-white font-semibold mb-2">{title}</p>
                <p className="text-white/50 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <SectionDivider />

        {/* Engineering for everyone */}
        <div className="mb-10">
          <h2 className="font-serif text-3xl text-white mb-2">Engineering for Everyone</h2>
          <p className="text-white/35 text-sm mb-8">The End of the &ldquo;AI Tax&rdquo;</p>
          <p className="text-white/60 text-base leading-relaxed mb-8">
            High-level voice intelligence shouldn&apos;t require a high-level engineering budget. We have eliminated the complexity of stitching together fragmented, expensive pipelines.
          </p>
          <div className="space-y-4">
            {[
              {
                icon: Zap,
                title: "The 5-Minute Promise",
                body: "Our highly customizable widget integrates with a single script tag. You don't need a massive development team to go live.",
              },
              {
                icon: BookOpen,
                title: "Plug-and-Play Sovereignty",
                body: "Simply upload your FAQs, product catalogs, or policy PDFs. Our RAG engine creates a localized expert on your business in seconds — keeping your data secure and your brand voice consistent.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 p-5 rounded-xl items-start" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,0,0.12)", border: "1px solid rgba(255,107,0,0.2)" }}>
                  <Icon className="w-4 h-4" style={{ color: "#fb923c" }} />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1.5">{title}</p>
                  <p className="text-white/50 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SectionDivider />

        {/* Our Difference */}
        <div className="mb-10">
          <h2 className="font-serif text-3xl text-white mb-2">Our Difference</h2>
          <p className="text-white/35 text-sm mb-8">Product-First. Bharat-First.</p>
          <div className="rounded-2xl p-8" style={{ background: "rgba(255,107,0,0.05)", border: "1px solid rgba(255,107,0,0.12)" }}>
            <p className="text-white/70 text-base leading-relaxed mb-5">
              While global giants offer generic APIs, <span className="font-bold text-white">Bolo</span> offers a working product designed specifically for the Indian context. We provide data residency in India and full audit trails for Enterprise and BFSI compliance, ensuring your growth never compromises your security.
            </p>
            <p className="text-white/70 text-base leading-relaxed">
              We are building a future where language is no longer a barrier to opportunity, but a gateway to it. Whether you are a startup looking to scale or an enterprise ready to dominate the regional market, the journey starts with a simple word.
            </p>
            <p className="font-serif text-2xl text-white mt-6 italic" style={{ color: "#fb923c" }}>
              Bolo. Speak the Heart of Bharat.
            </p>
          </div>
        </div>

        <SectionDivider />

        {/* Core Principles */}
        <div className="mb-16">
          <h2 className="font-serif text-3xl text-white mb-2">Our Core Principles</h2>
          <p className="text-white/35 text-sm mb-8">What we stand for, always</p>
          <div className="space-y-4">
            {PRINCIPLES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4 p-6 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,0,0.1)", border: "1px solid rgba(255,107,0,0.18)" }}>
                  <Icon className="w-5 h-5" style={{ color: "#fb923c" }} />
                </div>
                <div>
                  <p className="text-white font-semibold mb-1.5">{title}</p>
                  <p className="text-white/55 text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center rounded-2xl p-10" style={{ background: "linear-gradient(135deg, rgba(255,107,0,0.1) 0%, rgba(251,191,36,0.05) 100%)", border: "1px solid rgba(255,107,0,0.18)" }}>
          <h3 className="font-serif text-3xl text-white mb-3">Ready to speak their language?</h3>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:support@bolospeak.com" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white font-semibold rounded-xl transition-all hover:-translate-y-0.5 text-[15px]" style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)", boxShadow: "0 4px 20px rgba(255,107,0,0.3)" }}>
              Contact us at support@bolospeak.com
            </a>
            <Link href="/" className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-white/70 hover:text-white font-medium rounded-xl transition-all text-[15px]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
