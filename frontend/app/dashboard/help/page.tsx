"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  MessageSquare,
  BookOpen,
  Puzzle,
  BarChart3,
  Mic,
  Globe,
  CheckCircle,
} from "lucide-react";

const GUIDES = [
  {
    id: "get-started",
    icon: "🚀",
    title: "Get started in 5 minutes",
    subtitle: "From zero to a live voice widget on your website",
    color: "from-brand-500 to-violet-600",
    steps: [
      {
        emoji: "1️⃣",
        title: "Create your account",
        body: "You've already done this — great! Your account is ready to go.",
        done: true,
      },
      {
        emoji: "2️⃣",
        title: "Go to Integrations",
        body: "Click 'Integrations' in the left sidebar. This is where you'll build your voice widget.",
        action: { label: "Go to Integrations", href: "/dashboard/integrations" },
      },
      {
        emoji: "3️⃣",
        title: "Pick your business type",
        body: "Choose E-Commerce, BFSI, Healthcare, or whichever fits your business. This sets up the right language settings automatically.",
      },
      {
        emoji: "4️⃣",
        title: "Choose your languages",
        body: "Select the language your customers speak (e.g. Hindi) and the language you want the AI to respond in (e.g. English).",
      },
      {
        emoji: "5️⃣",
        title: "Customise the look",
        body: "Set your brand colour and widget name. You can see a live preview on the right — it updates as you type.",
      },
      {
        emoji: "6️⃣",
        title: "Copy the embed code",
        body: "Click 'Next' until you reach the Embed step. Copy the code snippet and paste it into your website just before </body>. That's it — your widget is live!",
        action: { label: "Widget Builder →", href: "/dashboard/integrations" },
      },
    ],
  },
  {
    id: "teach-ai",
    icon: "📚",
    title: "Teach your AI about your business",
    subtitle: "Upload your own documents so the AI gives accurate answers",
    color: "from-emerald-500 to-teal-600",
    steps: [
      {
        emoji: "1️⃣",
        title: "Go to Knowledge Bases",
        body: "Click 'Knowledge Bases' in the sidebar.",
        action: { label: "Go to Knowledge Bases", href: "/dashboard/knowledge" },
      },
      {
        emoji: "2️⃣",
        title: "Create a knowledge base",
        body: "Click the 'New Knowledge Base' button. Give it a name like 'Product FAQ' or 'Return Policy'.",
      },
      {
        emoji: "3️⃣",
        title: "Upload your documents",
        body: "Click on your knowledge base, then upload PDF, Word, or text files. You can upload as many as you like — your pricing plan, product catalogue, FAQs, anything.",
      },
      {
        emoji: "4️⃣",
        title: "Wait for processing",
        body: "BoloAI reads your documents automatically. Each file usually takes 1–2 minutes. You'll see the status change to 'Ready' when done.",
      },
      {
        emoji: "5️⃣",
        title: "Connect to your widget",
        body: "When building your widget in Integrations → Widget Builder → Step 2, select this knowledge base from the dropdown. Your AI will now use it to answer questions.",
      },
    ],
  },
  {
    id: "conversations",
    icon: "💬",
    title: "Read your conversation history",
    subtitle: "See what your customers are asking and in what language",
    color: "from-amber-500 to-orange-600",
    steps: [
      {
        emoji: "1️⃣",
        title: "Go to Conversations",
        body: "Click 'Conversations' in the sidebar. You'll see a list of every chat session.",
        action: { label: "Go to Conversations", href: "/dashboard/conversations" },
      },
      {
        emoji: "2️⃣",
        title: "Click on any conversation",
        body: "Click any row to open it. You'll see the full transcript — what the customer said in their language and what the AI replied.",
      },
      {
        emoji: "3️⃣",
        title: "Download the transcript",
        body: "Use the 'Export transcript' button to download a conversation as a text or JSON file — useful for audit trails or training data.",
      },
    ],
  },
  {
    id: "analytics",
    icon: "📊",
    title: "Understanding your analytics",
    subtitle: "Track usage, languages, and response times",
    color: "from-purple-500 to-pink-600",
    steps: [
      {
        emoji: "📈",
        title: "Overview numbers",
        body: "The dashboard homepage shows total conversations, messages sent, average response time, and how many characters were translated. These update every time someone uses your widget.",
      },
      {
        emoji: "🌐",
        title: "Language breakdown",
        body: "In the Analytics page, the Languages chart shows which Indian languages your customers are using most — useful for deciding which languages to prioritise.",
        action: { label: "View Analytics", href: "/dashboard/analytics" },
      },
      {
        emoji: "⚡",
        title: "Response latency",
        body: "The Latency chart shows how fast BoloAI is responding. Under 2000ms (2 seconds) is excellent. If you see high latency, the Sarvam AI service may be under load.",
      },
    ],
  },
  {
    id: "branding",
    icon: "🎨",
    title: "Make it look like your brand",
    subtitle: "Set colours, name, and the embed code for your website",
    color: "from-rose-500 to-red-600",
    steps: [
      {
        emoji: "1️⃣",
        title: "Go to Settings",
        body: "Click 'Settings' in the sidebar.",
        action: { label: "Go to Settings", href: "/dashboard/settings" },
      },
      {
        emoji: "2️⃣",
        title: "Change your company name",
        body: "Type your company name and click elsewhere — it saves automatically. This name appears inside the widget.",
      },
      {
        emoji: "3️⃣",
        title: "Set your brand colour",
        body: "Click the colour box and pick your brand colour. The widget button and header will use this colour.",
      },
      {
        emoji: "4️⃣",
        title: "Get your embed code",
        body: "Scroll down to 'Embed Widget' and copy the code snippet. Share this with whoever manages your website.",
      },
    ],
  },
];

const FAQS = [
  {
    q: "Do I need a developer to set up the widget?",
    a: "No. You just copy one snippet of code (like a YouTube embed) and paste it into your website. If your site runs on Shopify or WordPress, the Platform Connectors tab in Integrations gives you exact step-by-step instructions with no coding required.",
  },
  {
    q: "Which languages does BoloAI support?",
    a: "Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, and English. You can set any of these as the 'user speaks' language and any as the AI response language.",
  },
  {
    q: "How does the AI know about my products?",
    a: "Upload your product catalogue, FAQ document, or pricing PDF to a Knowledge Base. The AI reads these documents and uses them to answer customer questions accurately. Without a knowledge base, the AI acts as a general assistant.",
  },
  {
    q: "Will the widget work on mobile phones?",
    a: "Yes. The widget is fully responsive and works on iOS and Android browsers. Voice recording uses the browser's built-in microphone, which modern mobile browsers support.",
  },
  {
    q: "How do I remove the widget from my site?",
    a: "Simply delete the embed code snippet from your website. The widget will stop appearing immediately.",
  },
  {
    q: "Is my customers' voice data stored?",
    a: "Audio is transcribed in real time and not permanently stored. Conversation transcripts (text only) are stored so you can review them in the Conversations tab. You can delete individual conversations at any time.",
  },
  {
    q: "What happens if the AI doesn't know the answer?",
    a: "The AI will politely say it doesn't have that information and suggest the customer contact you directly. You can customise this fallback message in Settings.",
  },
  {
    q: "How do I share access with my team?",
    a: "Currently each account supports one login. Multi-user team access is coming soon. For developer access, create an API key in the API Keys page and share only that key.",
  },
];

function GuideCard({ guide }: { guide: typeof GUIDES[number] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left"
      >
        <div className={`bg-gradient-to-r ${guide.color} p-5 flex items-center gap-4`}>
          <span className="text-3xl">{guide.icon}</span>
          <div className="flex-1">
            <div className="font-bold text-white text-base">{guide.title}</div>
            <div className="text-white/80 text-sm mt-0.5">{guide.subtitle}</div>
          </div>
          <div className="text-white/70">
            {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="p-5 space-y-5">
          {guide.steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="text-2xl shrink-0 mt-0.5">{step.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900 text-sm">{step.title}</span>
                  {"done" in step && step.done && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>
                {"action" in step && step.action && (
                  <Link
                    href={step.action.href}
                    className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-brand-600 hover:underline"
                  >
                    {step.action.label} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 text-sm pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

const SHORTCUTS = [
  { icon: Puzzle, label: "Build my first widget", href: "/dashboard/integrations", color: "text-brand-600 bg-brand-50" },
  { icon: BookOpen, label: "Upload documents", href: "/dashboard/knowledge", color: "text-emerald-600 bg-emerald-50" },
  { icon: MessageSquare, label: "View conversations", href: "/dashboard/conversations", color: "text-amber-600 bg-amber-50" },
  { icon: BarChart3, label: "See analytics", href: "/dashboard/analytics", color: "text-purple-600 bg-purple-50" },
  { icon: Mic, label: "Clone a voice", href: "/dashboard/voice-clones", color: "text-red-600 bg-red-50" },
  { icon: Globe, label: "Widget settings", href: "/dashboard/settings", color: "text-blue-600 bg-blue-50" },
];

export default function HelpPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Help Centre</h1>
        </div>
        <p className="text-gray-500">Step-by-step guides for getting the most out of BoloAI — no technical knowledge needed.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {SHORTCUTS.map(({ icon: Icon, label, href, color }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-gray-700 leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">Step-by-step guides</h2>
      <div className="space-y-3 mb-10">
        {GUIDES.map((guide) => (
          <GuideCard key={guide.id} guide={guide} />
        ))}
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently asked questions</h2>
      <div className="space-y-2 mb-10">
        {FAQS.map((faq) => (
          <FaqItem key={faq.q} q={faq.q} a={faq.a} />
        ))}
      </div>

      <div className="bg-gradient-to-r from-brand-600 to-violet-600 rounded-2xl p-6 text-white text-center">
        <div className="text-2xl mb-2">Still stuck? 🤝</div>
        <p className="text-brand-100 text-sm mb-4">
          If you have a question that isn&apos;t answered here, email us at{" "}
          <a href="mailto:support@boloai.com" className="underline font-medium">support@boloai.com</a>
          {" "}and we&apos;ll get back to you within 24 hours.
        </p>
        <Link
          href="/dashboard/integrations"
          className="inline-flex items-center gap-2 bg-white text-brand-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-colors"
        >
          Start building your widget <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
