"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Lightbulb, ChevronDown, ChevronUp, ArrowRight, Search,
  MessageSquare, BookOpen, Puzzle, BarChart3, Mic, Globe,
  CheckCircle, CreditCard, Key, Store, Phone, Zap, Shield,
  Users, Settings, Play, Upload, Languages, TrendingUp, Bell,
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All Topics" },
  { id: "start", label: "Getting Started" },
  { id: "widget", label: "Widget & Integrations" },
  { id: "knowledge", label: "Knowledge Base" },
  { id: "conversations", label: "Conversations" },
  { id: "voice", label: "Voice & Cloning" },
  { id: "marketplace", label: "Voice Marketplace" },
  { id: "analytics", label: "Analytics" },
  { id: "billing", label: "Billing & Plans" },
  { id: "account", label: "Account & Settings" },
];

const GUIDES = [
  {
    id: "get-started",
    category: "start",
    icon: "🚀",
    title: "Get started in 5 minutes",
    subtitle: "From zero to a live voice widget on your website",
    color: "from-brand-500 to-violet-600",
    steps: [
      { emoji: "1️⃣", title: "Create your account", body: "You've already done this — great! Your Bolo workspace is ready to go.", done: true },
      { emoji: "2️⃣", title: "Go to Integrations", body: "Click 'Integrations' in the left sidebar. This is where you'll build your voice widget.", action: { label: "Go to Integrations", href: "/dashboard/integrations" } },
      { emoji: "3️⃣", title: "Pick your business type", body: "Choose E-Commerce, BFSI, Healthcare, Hospitality, or Education. This sets up the right default language settings for your industry automatically." },
      { emoji: "4️⃣", title: "Choose your languages", body: "Select the language your customers speak (e.g. Hindi, Tamil, Telugu) and the language you want the AI to respond in (e.g. English or the same language)." },
      { emoji: "5️⃣", title: "Customise the look", body: "Set your brand colour and widget name. You can see a live preview on the right side of the screen — it updates as you type." },
      { emoji: "6️⃣", title: "Copy the embed code", body: "Click 'Next' through the steps until you reach the Embed tab. Copy the single line of code and paste it into your website just before the </body> tag. That's it — your widget is live!", action: { label: "Widget Builder →", href: "/dashboard/integrations" } },
    ],
  },
  {
    id: "what-is-bolo",
    category: "start",
    icon: "🌟",
    title: "What is Bolo and what can it do?",
    subtitle: "A plain-English explanation of the whole platform",
    color: "from-indigo-500 to-blue-600",
    steps: [
      { emoji: "🎙️", title: "Voice AI for Indian languages", body: "Bolo lets your customers speak to your business in 11 languages — Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Odia, and English — and get instant AI-powered responses in their language." },
      { emoji: "💬", title: "Answer customer questions automatically", body: "Once you upload your product catalogue, FAQs, or pricing document, the AI learns from it. When a customer asks 'What is your return policy?' in Hindi, the AI answers from your documents — automatically, 24/7." },
      { emoji: "🔌", title: "Works on your website, WhatsApp, and phone", body: "Embed the widget on any website with one line of code. Or connect to WhatsApp Business, your phone IVR system, or a Shopify/WordPress site — no developer needed for most options." },
      { emoji: "🎤", title: "Voice Cloning (for creators and businesses)", body: "Record your own voice and create a digital clone. Use it in your widget so customers hear you — not a generic AI voice. Regional celebrities and voice artists can also license their voice to brands via the Voice Marketplace." },
      { emoji: "📊", title: "See what customers are asking", body: "Every conversation is logged. You can see exactly what questions are being asked, in which language, and how the AI is responding — giving you real business intelligence about your customers." },
    ],
  },
  {
    id: "widget-guide",
    category: "widget",
    icon: "🔌",
    title: "Building your voice widget",
    subtitle: "Complete guide to the Widget Builder, step by step",
    color: "from-blue-500 to-cyan-600",
    steps: [
      { emoji: "📋", title: "Step 1 — Business Type", body: "Choose your industry. This isn't permanent — it just pre-fills sensible defaults. You can change every setting manually in the steps that follow." },
      { emoji: "🌐", title: "Step 2 — Languages", body: "'User speaks' is the language your customers use. 'AI responds in' is what language the AI will reply in. Tip: set both to the same language (e.g. both Hindi) for a fully Hindi experience." },
      { emoji: "📚", title: "Step 3 — Knowledge Base", body: "Link a Knowledge Base here (optional). If you skip this, the AI is a general assistant. If you add one, it uses your documents to give specific answers about your business." },
      { emoji: "🎨", title: "Step 4 — Appearance", body: "Set the widget name (e.g. 'Priya from MedPlus'), your brand colour (paste a hex code like #FF5733), and the welcome message customers see first." },
      { emoji: "💻", title: "Step 5 — Embed Code", body: "Copy the code snippet and paste it into your website's HTML, just before </body>. On Shopify: Online Store → Themes → Edit Code → theme.liquid. On WordPress: Appearance → Theme Editor → footer.php." },
      { emoji: "🔗", title: "Platform Connectors", body: "The 'Platform Connectors' tab has ready-made guides for Shopify, WordPress, WhatsApp Business, Twilio IVR, React apps, and REST API — with exact copy-paste instructions for each platform.", action: { label: "Platform Connectors →", href: "/dashboard/integrations" } },
    ],
  },
  {
    id: "shopify-guide",
    category: "widget",
    icon: "🛍️",
    title: "Adding Bolo to Shopify",
    subtitle: "No code needed — done in under 3 minutes",
    color: "from-green-500 to-emerald-600",
    steps: [
      { emoji: "1️⃣", title: "Get your embed code", body: "Go to Integrations → Widget Builder → complete the steps → copy the embed code from Step 5.", action: { label: "Widget Builder →", href: "/dashboard/integrations" } },
      { emoji: "2️⃣", title: "Open Shopify Admin", body: "Log in to your Shopify store. Go to: Online Store → Themes → click the three dots '...' next to your active theme → Edit Code." },
      { emoji: "3️⃣", title: "Find the right file", body: "In the left file panel, look for 'Layout' and click 'theme.liquid'. This is your store's main template." },
      { emoji: "4️⃣", title: "Paste the code", body: "Scroll to the very bottom of the file. Find the </body> tag. Click just before it and paste your Bolo embed code on a new line." },
      { emoji: "5️⃣", title: "Save and test", body: "Click 'Save'. Open your Shopify store in a new tab. You should see the Bolo button in the bottom-right corner of every page. Click it to test!" },
      { emoji: "⚠️", title: "If you don't see the button", body: "Check that you saved the file. Also make sure your browser allows microphone access (it will ask the first time a visitor clicks the widget)." },
    ],
  },
  {
    id: "whatsapp-guide",
    category: "widget",
    icon: "💬",
    title: "Connecting to WhatsApp Business",
    subtitle: "Let customers talk to your AI via WhatsApp",
    color: "from-green-600 to-teal-600",
    steps: [
      { emoji: "📋", title: "What you need", body: "A WhatsApp Business account (not just WhatsApp — the Business version), a phone number that isn't already linked to WhatsApp, and your Bolo API key." },
      { emoji: "🔑", title: "Get your Bolo API key", body: "Go to API Keys in the sidebar and click 'Create API Key'. Copy the key — you'll need it in the next steps.", action: { label: "Get API Key →", href: "/dashboard/api-keys" } },
      { emoji: "📱", title: "Set up Twilio or 360dialog", body: "WhatsApp integrations go through a messaging provider. In Integrations → Platform Connectors → select WhatsApp. Follow the step-by-step instructions shown there to connect your WhatsApp number.", action: { label: "WhatsApp Connector →", href: "/dashboard/integrations" } },
      { emoji: "🔗", title: "Paste your webhook", body: "Your Bolo webhook URL is shown in the Platform Connector. Copy it and paste it into your WhatsApp Business API settings as the 'message webhook'. This tells WhatsApp to send all messages to Bolo." },
      { emoji: "✅", title: "Test it", body: "Send a WhatsApp message to your business number. You should get an AI response within a few seconds. Try sending a voice note — Bolo will transcribe it and reply in the same language." },
    ],
  },
  {
    id: "teach-ai",
    category: "knowledge",
    icon: "📚",
    title: "Teaching your AI about your business",
    subtitle: "Upload documents so the AI gives accurate answers",
    color: "from-emerald-500 to-teal-600",
    steps: [
      { emoji: "1️⃣", title: "Go to Knowledge Bases", body: "Click 'Knowledge Bases' in the sidebar.", action: { label: "Go to Knowledge Bases", href: "/dashboard/knowledge" } },
      { emoji: "2️⃣", title: "Create a knowledge base", body: "Click 'New Knowledge Base'. Give it a clear name like 'Product Catalogue', 'Return Policy', or 'Hospital Services'. You can create multiple knowledge bases for different topics." },
      { emoji: "3️⃣", title: "Upload your documents", body: "Click on your knowledge base, then drag-and-drop or click to upload files. Supported formats: PDF (.pdf), Word documents (.docx), and plain text (.txt)." },
      { emoji: "4️⃣", title: "What documents work best?", body: "FAQ pages (the best!), product descriptions, pricing documents, return/refund policies, opening hours, service lists, how-to guides. Write your documents in the same language your customers use." },
      { emoji: "5️⃣", title: "Wait for processing", body: "Bolo reads and indexes each document automatically. Files usually take 1–3 minutes. The status changes from 'Processing' to 'Ready' when done." },
      { emoji: "6️⃣", title: "Connect to your widget", body: "In Widget Builder → Step 3 (Knowledge Base), select this knowledge base from the dropdown. Your AI will now use your documents to answer customer questions accurately.", action: { label: "Widget Builder →", href: "/dashboard/integrations" } },
    ],
  },
  {
    id: "knowledge-tips",
    category: "knowledge",
    icon: "💡",
    title: "Tips for better AI answers",
    subtitle: "How to format your documents for the best results",
    color: "from-yellow-500 to-amber-600",
    steps: [
      { emoji: "✅", title: "Use clear headings", body: "Break your document into sections with headings. E.g. 'Return Policy', 'Shipping Times', 'Payment Methods'. The AI uses headings to understand what each section is about." },
      { emoji: "✅", title: "Write in Q&A format", body: "The best knowledge base is one that already has questions and answers. Example: Q: What is your return policy? A: We accept returns within 30 days with original receipt." },
      { emoji: "✅", title: "Include full details", body: "Don't use shorthand. Instead of 'Free shipping on orders 500+', write 'We offer free shipping on all orders above ₹500 within India'." },
      { emoji: "❌", title: "Avoid tables and images", body: "The AI reads text. Tables in PDFs sometimes confuse it. If you have a pricing table, convert it to plain text bullet points." },
      { emoji: "❌", title: "Avoid scanned documents", body: "Scanned PDFs (photos of paper) can't be read. Use digital PDFs — the ones you can highlight and copy text from." },
      { emoji: "🔄", title: "Update regularly", body: "If your prices or policies change, upload a new version of the document. Delete the old one to avoid the AI giving outdated answers." },
    ],
  },
  {
    id: "conversations",
    category: "conversations",
    icon: "💬",
    title: "Reading your conversation history",
    subtitle: "See what your customers are asking and understand their needs",
    color: "from-amber-500 to-orange-600",
    steps: [
      { emoji: "1️⃣", title: "Open Conversations", body: "Click 'Conversations' in the sidebar. You'll see a list of every session, sorted by most recent first.", action: { label: "Go to Conversations", href: "/dashboard/conversations" } },
      { emoji: "2️⃣", title: "What each column means", body: "'Language' shows what language the customer spoke. 'Messages' shows how many turns the conversation had. 'Duration' is the total session length. 'Status' is Active (ongoing) or Completed." },
      { emoji: "3️⃣", title: "Read a conversation", body: "Click any row to open the full transcript. Customer messages appear on the left in their original language. AI responses appear on the right." },
      { emoji: "4️⃣", title: "Download a transcript", body: "Click 'Export transcript' to download the conversation as a text file. Useful for sharing with your team or for audit/compliance purposes." },
      { emoji: "💡", title: "What to look for", body: "Look for questions that come up repeatedly — these are gaps in your Knowledge Base. If customers keep asking 'What are your timings?' and the AI is unsure, add your timings to your knowledge base document." },
    ],
  },
  {
    id: "voice-clone",
    category: "voice",
    icon: "🎤",
    title: "Creating your voice clone",
    subtitle: "Record your voice once — use it everywhere, forever",
    color: "from-red-500 to-pink-600",
    steps: [
      { emoji: "📋", title: "What is a voice clone?", body: "A voice clone is a digital copy of your real voice. Once created, your widget can speak in your voice instead of a generic AI voice. Customers hear you — building instant trust." },
      { emoji: "1️⃣", title: "Go to Voice Clones", body: "Click 'Voice Clones' in the sidebar. Click 'Create New Clone'.", action: { label: "Voice Clones →", href: "/dashboard/voice-clones" } },
      { emoji: "2️⃣", title: "Record your samples", body: "Read aloud the sample sentences shown on screen. Record at least 5 minutes of clear speech for the best quality. Use a quiet room and a decent microphone (even a phone headset works)." },
      { emoji: "3️⃣", title: "Tips for a good recording", body: "Speak naturally at your normal pace. Don't rush. Keep the microphone 15–20cm from your mouth. Avoid background noise like fans or traffic. Do multiple takes if needed." },
      { emoji: "4️⃣", title: "Wait for training", body: "After uploading, Bolo trains your voice clone. This takes 10–30 minutes. You'll see the status change to 'Ready'." },
      { emoji: "5️⃣", title: "Use it in your widget", body: "When building your widget, select your voice clone in the Appearance step. Now your widget speaks in your voice!" },
    ],
  },
  {
    id: "marketplace-buyer",
    category: "marketplace",
    icon: "🎭",
    title: "Licensing a celebrity or artist voice",
    subtitle: "Use a professional Indian voice for your brand",
    color: "from-violet-500 to-purple-600",
    steps: [
      { emoji: "🎯", title: "Why license a voice?", body: "Instead of a generic AI voice, your widget can speak in the voice of a regional celebrity, professional RJ, or voice artist. This creates an immediate emotional connection with your regional audience." },
      { emoji: "1️⃣", title: "Browse the Marketplace", body: "Click 'Voice Marketplace' in the sidebar. Browse by language, category (Celebrity, RJ, Singer, etc.), or search by name.", action: { label: "Voice Marketplace →", href: "/dashboard/marketplace" } },
      { emoji: "2️⃣", title: "Preview voices", body: "Click the Play button on any artist card to hear a sample. Take your time — you're choosing the voice your customers will hear on every interaction." },
      { emoji: "3️⃣", title: "Choose a licence tier", body: "Personal: for demos and internal use. Commercial: for customer-facing products (most popular). Broadcast: for TV, radio, OTT. Exclusive: sole rights — the artist cannot be licensed to anyone else." },
      { emoji: "4️⃣", title: "Request a licence", body: "Click 'License This Voice', choose your tier, describe how you'll use it, and submit. The artist reviews and approves (usually within 24 hours). Free-tier licences are approved instantly." },
      { emoji: "5️⃣", title: "Use the voice", body: "Once approved, the licensed voice appears in your widget's Appearance settings. Select it from the voice dropdown." },
    ],
  },
  {
    id: "marketplace-artist",
    category: "marketplace",
    icon: "💰",
    title: "Earning from your voice (Artist Guide)",
    subtitle: "List your voice and earn every time a brand uses it",
    color: "from-amber-500 to-yellow-500",
    steps: [
      { emoji: "💡", title: "Who can join?", body: "Anyone with a good voice! Celebrities, radio jockeys, singers, dubbing artists, narrators, podcasters, and community speakers. If you speak a regional Indian language clearly, there's demand for your voice." },
      { emoji: "1️⃣", title: "Register your voice", body: "Go to Voice Marketplace → My Voice → 'List My Voice'. Fill in your details: name, category, languages you speak, dialects, and specialties.", action: { label: "Register My Voice →", href: "/dashboard/marketplace/my-voice" } },
      { emoji: "2️⃣", title: "Set your pricing", body: "Set different prices for each tier. Example: ₹2,000 for Personal, ₹10,000 for Commercial, ₹50,000 for Broadcast, ₹2,00,000 for Exclusive. You keep 80% — Bolo takes 20%." },
      { emoji: "3️⃣", title: "Provide consent", body: "You must tick the consent checkbox confirming you are the rights holder of your voice. This protects you legally. Your voice will only be used by brands you approve." },
      { emoji: "4️⃣", title: "Verification", body: "The Bolo team reviews your profile within 2–5 business days. Once verified, your profile goes live and brands can find you." },
      { emoji: "5️⃣", title: "Approve licences", body: "When a brand requests your voice, you get a notification. Go to My Voice → pending licences, review the request, and approve or decline. You're always in control.", action: { label: "My Voice Dashboard →", href: "/dashboard/marketplace/my-voice" } },
      { emoji: "💸", title: "Getting paid", body: "Earnings are credited to your Bolo wallet when a licence is approved. You can withdraw to your UPI ID or bank account monthly. Minimum withdrawal: ₹500." },
    ],
  },
  {
    id: "analytics",
    category: "analytics",
    icon: "📊",
    title: "Understanding your analytics",
    subtitle: "Know your customers better through data",
    color: "from-purple-500 to-pink-600",
    steps: [
      { emoji: "🏠", title: "Dashboard overview", body: "The main dashboard shows: Total Conversations (how many sessions), Total Messages (how many turns), Average Response Time (how fast the AI replies), and usage breakdowns by AI operation type.", action: { label: "View Dashboard →", href: "/dashboard" } },
      { emoji: "🌐", title: "Language analytics", body: "The Analytics page shows which Indian languages your customers are using most. If 70% speak Tamil, maybe you should improve your Tamil knowledge base or add a Tamil-speaking voice clone.", action: { label: "View Analytics →", href: "/dashboard/analytics" } },
      { emoji: "⚡", title: "Response latency", body: "The Latency chart shows how fast Bolo responds in milliseconds. Under 1,000ms = excellent. 1,000–2,000ms = good. Over 3,000ms = slow, usually due to network conditions." },
      { emoji: "📈", title: "Conversation trends", body: "The Conversations chart shows usage over time. Spikes mean something drove customers to your site — correlate with marketing campaigns or news events." },
      { emoji: "💡", title: "What to act on", body: "Sort conversations by length — short ones (1–2 messages) often mean the AI didn't help. Read those transcripts and add the missing information to your knowledge base." },
    ],
  },
  {
    id: "api-keys",
    category: "account",
    icon: "🔑",
    title: "API Keys — for developers and integrations",
    subtitle: "Share access with your developer without giving your password",
    color: "from-slate-600 to-gray-700",
    steps: [
      { emoji: "❓", title: "What is an API key?", body: "An API key is a special password that gives a developer or an external service access to Bolo on your behalf — without them needing your email and password." },
      { emoji: "1️⃣", title: "Create an API key", body: "Go to API Keys in the sidebar. Click 'Create API Key'. Give it a name so you remember what it's for (e.g. 'My Developer', 'Shopify Integration').", action: { label: "API Keys →", href: "/dashboard/api-keys" } },
      { emoji: "2️⃣", title: "Copy and share safely", body: "Copy the key immediately — you can only see it once. Share it with your developer or paste it into the integration platform. Treat it like a password — don't post it publicly." },
      { emoji: "3️⃣", title: "Revoke if needed", body: "If a developer leaves your company or a key is compromised, click the trash icon next to the key to delete it. Create a new one if needed. This won't affect your widget embed code." },
      { emoji: "⚠️", title: "Keep it secret", body: "Never put your API key in a public GitHub repository, a public website, or share in a WhatsApp group. If exposed, anyone can use Bolo on your account and run up your usage bill." },
    ],
  },
  {
    id: "billing",
    category: "billing",
    icon: "💳",
    title: "Billing, plans, and usage",
    subtitle: "Understand what you're paying for and how to control costs",
    color: "from-teal-500 to-green-600",
    steps: [
      { emoji: "🆓", title: "Free tier", body: "Every Bolo account starts with 100 free conversations per month. This is enough to test your widget and show demos to colleagues. No credit card required to start." },
      { emoji: "📦", title: "Starter plan", body: "Ideal for small businesses. Includes 1,000 conversations/month, all 7 languages, Knowledge Base (up to 5 documents), and email support. Billed monthly, cancel any time.", action: { label: "View Plans →", href: "/dashboard/settings/billing" } },
      { emoji: "🚀", title: "Growth plan", body: "For growing businesses. Includes 10,000 conversations/month, unlimited Knowledge Base documents, voice clone support, analytics, and priority support." },
      { emoji: "📊", title: "What counts as a conversation?", body: "One conversation = one session a customer has with your widget. It can have any number of back-and-forth messages. If a customer opens the widget, asks 5 questions, and closes it — that's 1 conversation." },
      { emoji: "💡", title: "Watch your usage", body: "The Analytics page shows your conversation count this month. If you're approaching your limit, you'll get an email notification. You can upgrade at any time mid-month — the change is prorated." },
      { emoji: "❌", title: "How to cancel", body: "Go to Settings → Billing → 'Cancel Subscription'. Your account reverts to the Free tier at the end of the billing period. All your data, knowledge bases, and settings are kept.", action: { label: "Billing Settings →", href: "/dashboard/settings/billing" } },
    ],
  },
  {
    id: "settings-guide",
    category: "account",
    icon: "⚙️",
    title: "Account & workspace settings",
    subtitle: "Customise Bolo for your organisation",
    color: "from-gray-600 to-slate-700",
    steps: [
      { emoji: "🏢", title: "Company name and logo", body: "Go to Settings → General. Your company name appears inside the widget header. Upload a logo (PNG or JPG, square format works best) to brand the widget.", action: { label: "Go to Settings →", href: "/dashboard/settings" } },
      { emoji: "🎨", title: "Brand colour", body: "The primary colour is used for the widget button, header, and highlights. Paste your hex colour code (e.g. #FF5722) or use the colour picker." },
      { emoji: "🤖", title: "Widget default language", body: "Set the default 'user speaks' language here. Customers can still switch languages in the widget, but this is the language it opens in." },
      { emoji: "💬", title: "Fallback message", body: "This is what the AI says when it doesn't know the answer. Default: 'I don't have that information. Please contact us directly.' You can customise this to match your brand's tone." },
      { emoji: "🔔", title: "Notifications", body: "Enable email notifications for: when your usage exceeds 80% of your plan, when a new voice licence is requested (for Marketplace artists), and when a knowledge document fails to process." },
    ],
  },
];

const FAQS = [
  { category: "start", q: "Do I need a developer or technical knowledge to use Bolo?", a: "No. The widget is deployed by copying one line of code — like embedding a YouTube video. For Shopify and WordPress, there are exact step-by-step guides with screenshots. The rest of the dashboard (uploading documents, reading conversations, checking analytics) works like any normal website." },
  { category: "start", q: "How long does it take to get my first widget live?", a: "About 5 minutes for a basic widget. Add another 5–10 minutes if you want to upload a knowledge base document. The Shopify and WordPress setup takes 3–5 minutes following our guide." },
  { category: "start", q: "Can I try Bolo before paying?", a: "Yes. Every account starts with 100 free conversations per month. No credit card needed. This is enough for testing and demos. When you're ready to go live with real traffic, upgrade to a paid plan." },
  { category: "widget", q: "Which languages does Bolo support?", a: "11 languages: Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Odia, and English. All 11 are supported for voice input (STT), AI response, and text-to-speech output. The Voice Marketplace additionally covers regional dialects like Bhojpuri, Awadhi, and Maithili through human voice artists." },
  { category: "widget", q: "Will the widget work on mobile phones?", a: "Yes. The widget is fully responsive and works on iOS and Android browsers. Voice recording uses the browser's built-in microphone, which all modern mobile browsers support. The customer taps the microphone button, speaks, and gets an answer — just like a voice note." },
  { category: "widget", q: "Can I have different widgets for different pages on my site?", a: "Yes. You can create multiple integrations in the Widget Builder, each with different settings (different languages, different knowledge bases, different colours). Each gets its own embed code. Paste each code only on the pages it's meant for." },
  { category: "widget", q: "How do I remove the widget from my site?", a: "Simply delete the embed code from your website's HTML. The widget will disappear immediately. No need to change anything in your Bolo dashboard." },
  { category: "widget", q: "Can the widget handle both text and voice input?", a: "Yes. Customers can either type their question or click the microphone and speak. The AI handles both modes and responds in the same language the customer used." },
  { category: "knowledge", q: "How does the AI know about my products and services?", a: "Upload your product catalogue, FAQ document, or any business document to a Knowledge Base. The AI reads these documents and uses them to answer questions. Without a knowledge base, the AI is a general assistant and won't know your specific products or policies." },
  { category: "knowledge", q: "What file types can I upload?", a: "PDF files (.pdf), Microsoft Word documents (.docx), and plain text files (.txt). For best results, use PDFs of digital documents (not scanned paper), or Word documents." },
  { category: "knowledge", q: "How many documents can I upload?", a: "On the Starter plan: up to 5 documents per knowledge base, up to 3 knowledge bases. On the Growth plan: unlimited documents and knowledge bases. There's also a file size limit of 30MB per document." },
  { category: "knowledge", q: "Can I upload documents in Indian languages?", a: "Yes. You can upload documents in Hindi, Tamil, Telugu, and other Indian languages written in their native script. The AI will use these to answer questions in those languages." },
  { category: "conversations", q: "Is my customers' voice data stored?", a: "Audio is transcribed in real time and not permanently stored. What's stored is the text transcript only. Conversation transcripts are kept so you can review them in the Conversations tab. You can delete individual conversations at any time." },
  { category: "conversations", q: "How can I tell if the AI is answering well?", a: "Open the Conversations tab and read through recent sessions. Look for conversations where the customer had to ask the same question multiple times — a sign the AI's first answer wasn't helpful. Also look for sessions that ended with very few messages (the customer may have given up)." },
  { category: "conversations", q: "Can I export all my conversations?", a: "Each conversation can be downloaded individually as a text or JSON file using the 'Export transcript' button. Bulk export of all conversations is available on the Growth plan via the API." },
  { category: "voice", q: "How long does voice clone training take?", a: "Usually 15–30 minutes after you upload your recordings. The quality of the clone depends on recording quality and the amount of audio you provide. A minimum of 5 minutes of clear speech is needed; 15+ minutes gives significantly better results." },
  { category: "voice", q: "Can someone misuse my cloned voice?", a: "Your voice clone is private to your Bolo account and can only be used within your widget. It is not shared publicly. If you list your voice on the Voice Marketplace, brands must go through a formal licence request that you personally approve — you always stay in control." },
  { category: "marketplace", q: "How do voice artists receive payment?", a: "Earnings are credited to your Bolo wallet when a brand's licence is approved. You can withdraw to your UPI ID or bank account. The minimum withdrawal is ₹500. Payouts are processed monthly." },
  { category: "marketplace", q: "Can a brand use my voice without my permission?", a: "No. Every licence request goes through your approval. You see who the brand is and how they plan to use your voice before you approve. You can also revoke a licence at any time if terms are violated." },
  { category: "billing", q: "What happens if I exceed my conversation limit?", a: "Your widget keeps working — we don't cut it off mid-month. You'll receive an email warning at 80% and 100% of your limit. Conversations above your plan limit are billed at a small per-conversation rate. Upgrade your plan at any time to avoid overage charges." },
  { category: "billing", q: "Can I pause my subscription without losing data?", a: "There's no pause option, but you can downgrade to the Free tier — your data, knowledge bases, voice clones, and settings are all preserved. You'll just be limited to 100 conversations/month on the Free tier." },
  { category: "account", q: "How do I share access with my team?", a: "Currently each account supports one primary login. For developer access, create an API key in the API Keys page and share only that key — developers can call the API without your password. Multi-user (team) access with individual logins is coming in a future update." },
  { category: "account", q: "Can I change the language of the Bolo dashboard itself?", a: "The dashboard is currently in English. The widget that your customers use supports all Indian languages — it's only the management dashboard that's in English. A Hindi dashboard option is on our roadmap." },
  { category: "account", q: "Is my data safe? Who can see my conversations?", a: "Your data is stored securely in India (AWS Mumbai region). Conversation transcripts are visible only to you in your dashboard. Bolo staff can access data only for support purposes, with your consent. We never sell your data or use it to train other customers' AI." },
];

function GuideCard({ guide, search }: { guide: typeof GUIDES[number]; search: string }) {
  const [open, setOpen] = useState(false);
  const highlight = search.length > 1;
  const matches = highlight && (
    guide.title.toLowerCase().includes(search.toLowerCase()) ||
    guide.subtitle.toLowerCase().includes(search.toLowerCase()) ||
    guide.steps.some(s => s.title.toLowerCase().includes(search.toLowerCase()) || s.body.toLowerCase().includes(search.toLowerCase()))
  );

  if (highlight && !matches) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full text-left">
        <div className={`bg-gradient-to-r ${guide.color} p-5 flex items-center gap-4`}>
          <span className="text-3xl">{guide.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm leading-snug">{guide.title}</div>
            <div className="text-white/75 text-xs mt-0.5 leading-snug">{guide.subtitle}</div>
          </div>
          <div className="text-white/70 shrink-0">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="p-5 space-y-5 animate-fade-in">
          {guide.steps.map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="text-xl shrink-0 mt-0.5 w-8 text-center">{step.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm">{step.title}</span>
                  {"done" in step && step.done && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
                {"action" in step && step.action && (
                  <Link href={step.action.href} className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-brand-600 hover:underline">
                    {step.action.label} <ArrowRight className="w-3 h-3" />
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

function FaqItem({ q, a, search }: { q: string; a: string; search: string }) {
  const [open, setOpen] = useState(false);
  const highlight = search.length > 1;
  const matches = !highlight || q.toLowerCase().includes(search.toLowerCase()) || a.toLowerCase().includes(search.toLowerCase());
  if (!matches) return null;

  return (
    <div className="border border-slate-200/70 rounded-xl overflow-hidden bg-white">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors">
        <span className="font-medium text-slate-900 text-sm pr-4 leading-snug">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-fade-in">
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
  { icon: Store, label: "Voice Marketplace", href: "/dashboard/marketplace", color: "text-violet-600 bg-violet-50" },
  { icon: Key, label: "API Keys", href: "/dashboard/api-keys", color: "text-slate-600 bg-slate-100" },
  { icon: CreditCard, label: "Billing & Plans", href: "/dashboard/settings/billing", color: "text-teal-600 bg-teal-50" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings", color: "text-blue-600 bg-blue-50" },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("all");

  const filteredGuides = useMemo(() => {
    return GUIDES.filter(g => {
      const catMatch = activeCat === "all" || g.category === activeCat;
      if (!catMatch) return false;
      if (search.length < 2) return true;
      const s = search.toLowerCase();
      return g.title.toLowerCase().includes(s) || g.subtitle.toLowerCase().includes(s) || g.steps.some(st => st.title.toLowerCase().includes(s) || st.body.toLowerCase().includes(s));
    });
  }, [search, activeCat]);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter(f => {
      const catMatch = activeCat === "all" || f.category === activeCat;
      if (!catMatch) return false;
      if (search.length < 2) return true;
      const s = search.toLowerCase();
      return f.q.toLowerCase().includes(s) || f.a.toLowerCase().includes(s);
    });
  }, [search, activeCat]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Help Centre</h1>
        </div>
        <p className="text-slate-500 text-sm">Step-by-step guides for getting the most out of Bolo — no technical knowledge needed.</p>
      </div>

      {/* Feature Guide banner */}
      <Link href="/dashboard/help/features" className="flex items-center justify-between gap-4 bg-gradient-to-r from-brand-600 to-violet-600 rounded-2xl p-4 mb-6 hover:opacity-95 transition-opacity group">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Feature Guide — Input → Process → Output</p>
            <p className="text-xs text-white/70 mt-0.5">Every monetizable feature explained with exactly what goes in and what comes out</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-white/80 shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search guides and FAQs… e.g. 'how to add to Shopify' or 'voice clone'"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 shadow-card"
        />
      </div>

      {/* Quick shortcuts */}
      {!search && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 mb-8">
          {SHORTCUTS.map(({ icon: Icon, label, href, color }) => (
            <Link key={href} href={href}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200/60 shadow-card hover:shadow-card-md transition-all text-center group">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-medium text-slate-600 leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeCat === cat.id
                ? "bg-brand-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Guides */}
      {filteredGuides.length > 0 && (
        <>
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-brand-600" />
            Step-by-step guides
            <span className="text-xs font-normal text-slate-400">({filteredGuides.length})</span>
          </h2>
          <div className="space-y-2.5 mb-8">
            {filteredGuides.map(guide => (
              <GuideCard key={guide.id} guide={guide} search={search} />
            ))}
          </div>
        </>
      )}

      {/* FAQs */}
      {filteredFaqs.length > 0 && (
        <>
          <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-600" />
            Frequently asked questions
            <span className="text-xs font-normal text-slate-400">({filteredFaqs.length})</span>
          </h2>
          <div className="space-y-2 mb-8">
            {filteredFaqs.map(faq => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} search={search} />
            ))}
          </div>
        </>
      )}

      {/* No results */}
      {filteredGuides.length === 0 && filteredFaqs.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-700">No results for &quot;{search}&quot;</p>
          <p className="text-sm mt-1">Try a different keyword or email us — we&apos;re happy to help.</p>
          <a href="mailto:support@bolo.app" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-brand-600 hover:underline">
            Email support <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {/* Support CTA */}
      <div className="bg-gradient-to-r from-brand-600 to-violet-600 rounded-2xl p-6 text-white text-center">
        <div className="text-xl font-bold mb-1">Still need help? 🤝</div>
        <p className="text-brand-100 text-sm mb-4 max-w-md mx-auto">
          If you have a question not answered here, email us at{" "}
          <a href="mailto:support@bolo.app" className="underline font-semibold">support@bolo.app</a>
          {" "}— we reply within 24 hours, in Hindi or English.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link href="/dashboard/integrations"
            className="inline-flex items-center gap-2 bg-white text-brand-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-50 transition-colors">
            Build your widget <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="mailto:support@bolo.app"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Email support
          </a>
        </div>
      </div>
    </div>
  );
}
