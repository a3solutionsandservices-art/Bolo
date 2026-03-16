import type { TourStep } from "@/components/ui/product-tour";

export const DASHBOARD_TOUR: TourStep[] = [
  {
    target: "[data-tour='sidebar-dashboard']",
    title: "Welcome to BoloAI! 👋",
    body: "This is your dashboard — your control centre. Every time you log in you'll land here to see how your voice assistant is performing.",
    placement: "right",
    icon: "🏠",
  },
  {
    target: "[data-tour='sidebar-integrations']",
    title: "Build your widget here",
    body: "Click Integrations to create your voice widget. You pick your language, colours, and which platform you want to put it on — no coding needed.",
    placement: "right",
    icon: "🧩",
  },
  {
    target: "[data-tour='sidebar-knowledge']",
    title: "Teach your AI assistant",
    body: "Upload PDFs, Word docs, or text files here. Your AI will read them and use that knowledge to answer customer questions accurately.",
    placement: "right",
    icon: "📚",
  },
  {
    target: "[data-tour='sidebar-conversations']",
    title: "See every conversation",
    body: "Every time someone talks to your widget it appears here. You can read the full transcript and see what language they spoke in.",
    placement: "right",
    icon: "💬",
  },
  {
    target: "[data-tour='sidebar-analytics']",
    title: "Track your impact",
    body: "See how many people are using your widget, which languages are most popular, and how fast your AI responds.",
    placement: "right",
    icon: "📊",
  },
  {
    target: "[data-tour='sidebar-settings']",
    title: "Customise your branding",
    body: "Set your company name, logo, and brand colours so the widget matches your website perfectly.",
    placement: "right",
    icon: "🎨",
  },
  {
    target: "[data-tour='sidebar-api-keys']",
    title: "Share with your developer",
    body: "If you have a developer, give them an API key from here and they can connect BoloAI to any system you use.",
    placement: "right",
    icon: "🔑",
  },
  {
    target: "[data-tour='quick-actions']",
    title: "You're all set! 🚀",
    body: "The fastest way to get started is to click 'Build a widget integration' below. It only takes 3 minutes to have your voice assistant live on your website.",
    placement: "top",
    icon: "🚀",
  },
];

export const INTEGRATION_TOUR: TourStep[] = [
  {
    target: "[data-tour='integration-tabs']",
    title: "Two ways to get started",
    body: "The Widget Builder walks you through setup step by step. Platform Connectors gives you the exact code for Shopify, WordPress, WhatsApp, and more.",
    placement: "bottom",
    icon: "🧩",
  },
  {
    target: "[data-tour='use-case-grid']",
    title: "Step 1 — Pick your business type",
    body: "Choose the option that best describes your business. This sets up the right AI mode and language defaults for you automatically.",
    placement: "bottom",
    icon: "🎯",
  },
];

export const KNOWLEDGE_TOUR: TourStep[] = [
  {
    target: "[data-tour='kb-create']",
    title: "Create a knowledge base",
    body: "Think of this like a folder for your documents. Give it a name — for example 'Product FAQ' or 'Return Policy'.",
    placement: "bottom",
    icon: "📁",
  },
  {
    target: "[data-tour='kb-list']",
    title: "Your knowledge bases",
    body: "Once created, click on any knowledge base to upload documents into it. Your AI reads these and uses them to answer questions.",
    placement: "right",
    icon: "📚",
  },
];
