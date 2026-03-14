"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ShoppingBag,
  Landmark,
  HeartPulse,
  GraduationCap,
  Building2,
  Code2,
  ChevronRight,
  ChevronLeft,
  Check,
  Copy,
  MessageSquare,
  Globe,
  Palette,
  Zap,
  ExternalLink,
} from "lucide-react";

const LANGUAGES = [
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "bn", label: "Bengali" },
  { code: "gu", label: "Gujarati" },
  { code: "mr", label: "Marathi" },
  { code: "en", label: "English" },
];

const USE_CASES = [
  {
    id: "ecommerce",
    icon: ShoppingBag,
    label: "E-Commerce",
    description: "Voice search, product queries, order status in any Indian language",
    color: "bg-orange-100 text-orange-700",
    mode: "agent",
    defaultSource: "hi",
    defaultTarget: "en",
  },
  {
    id: "bfsi",
    icon: Landmark,
    label: "BFSI",
    description: "Loan applications, KYC assistance, account support in regional languages",
    color: "bg-blue-100 text-blue-700",
    mode: "agent",
    defaultSource: "hi",
    defaultTarget: "en",
  },
  {
    id: "healthcare",
    icon: HeartPulse,
    label: "Healthcare",
    description: "Doctor-patient translation, appointment booking, prescription queries",
    color: "bg-red-100 text-red-700",
    mode: "translation",
    defaultSource: "hi",
    defaultTarget: "en",
  },
  {
    id: "edtech",
    icon: GraduationCap,
    label: "EdTech",
    description: "Multilingual AI tutor, content translation, student support",
    color: "bg-green-100 text-green-700",
    mode: "agent",
    defaultSource: "en",
    defaultTarget: "hi",
  },
  {
    id: "government",
    icon: Building2,
    label: "Government",
    description: "Citizen services, form assistance, document translation",
    color: "bg-purple-100 text-purple-700",
    mode: "agent",
    defaultSource: "hi",
    defaultTarget: "en",
  },
  {
    id: "custom",
    icon: Code2,
    label: "Custom",
    description: "Build your own integration from scratch with full control",
    color: "bg-gray-100 text-gray-700",
    mode: "conversation",
    defaultSource: "en",
    defaultTarget: "hi",
  },
];

const CONNECTORS = [
  {
    id: "shopify",
    label: "Shopify",
    logo: "🛍️",
    description: "Add voice search to your Shopify store product pages",
    steps: [
      "Go to Shopify Admin → Online Store → Themes → Edit code",
      "Open `theme.liquid` and paste the embed snippet before `</body>`",
      "Save and preview your store",
    ],
    docsUrl: "https://help.shopify.com/en/manual/online-store/themes/theme-structure",
  },
  {
    id: "wordpress",
    label: "WordPress",
    logo: "📝",
    description: "Embed the widget on any WordPress site or WooCommerce store",
    steps: [
      "Install a custom HTML plugin (e.g. Insert Headers and Footers)",
      "Paste the embed snippet into the Footer Scripts section",
      "Save and visit your site",
    ],
    docsUrl: "https://wordpress.org/plugins/insert-headers-and-footers/",
  },
  {
    id: "freshdesk",
    label: "Freshdesk",
    logo: "🎧",
    description: "Live translation overlay for Freshdesk support tickets and chat",
    steps: [
      "Go to Freshdesk Admin → Portals → Portal Customization",
      "Paste the embed snippet in the Header/Footer HTML area",
      "Save — agents will see the translation widget on every ticket",
    ],
    docsUrl: "https://support.freshdesk.com/en/support/solutions/articles/37599",
  },
  {
    id: "whatsapp",
    label: "WhatsApp Business",
    logo: "💬",
    description: "Connect via Twilio for multilingual WhatsApp conversations",
    steps: [
      "Configure a Twilio WhatsApp number in your Twilio console",
      "Set the webhook URL to your VaaniAI telephony endpoint",
      "Messages are auto-translated and routed through your AI agent",
    ],
    docsUrl: "https://www.twilio.com/docs/whatsapp",
  },
  {
    id: "react",
    label: "React / Next.js",
    logo: "⚛️",
    description: "Install the NPM SDK for React and Next.js apps",
    steps: [
      "`npm install @vaaniai/react-widget`",
      "Import and render `<VaaniWidget apiKey='...' tenantId='...' />`",
      "Pass `language` and `targetLanguage` props to configure defaults",
    ],
    docsUrl: "#",
  },
  {
    id: "rest",
    label: "REST API",
    logo: "🔌",
    description: "Use the full REST + WebSocket API directly in any stack",
    steps: [
      "Create an API key from the API Keys page",
      "POST to `/api/v1/conversations` to start a session",
      "Stream audio via WebSocket at `/api/v1/voice/stream`",
    ],
    docsUrl: "/docs",
  },
];

const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"] as const;
type Position = typeof POSITIONS[number];

interface WizardConfig {
  useCase: string;
  mode: string;
  sourceLanguage: string;
  targetLanguage: string;
  knowledgeBaseId: string;
  widgetName: string;
  primaryColor: string;
  position: Position;
}

const DEFAULT_CONFIG: WizardConfig = {
  useCase: "",
  mode: "agent",
  sourceLanguage: "hi",
  targetLanguage: "en",
  knowledgeBaseId: "",
  widgetName: "VaaniAI Assistant",
  primaryColor: "#6366f1",
  position: "bottom-right",
};

function WidgetPreview({ config }: { config: WizardConfig }) {
  const positionClass: Record<Position, string> = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const srcLang = LANGUAGES.find((l) => l.code === config.sourceLanguage)?.label ?? config.sourceLanguage;
  const tgtLang = LANGUAGES.find((l) => l.code === config.targetLanguage)?.label ?? config.targetLanguage;

  return (
    <div className="relative w-full h-80 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
      <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm select-none">
        Your website here
      </div>

      <div className={`absolute ${positionClass[config.position]} flex flex-col items-end gap-2`}>
        <div
          className="rounded-2xl shadow-2xl p-4 w-64 text-white text-xs space-y-2"
          style={{ backgroundColor: config.primaryColor }}
        >
          <div className="font-semibold text-sm">{config.widgetName}</div>
          <div className="bg-white/20 rounded-lg p-2">
            {srcLang} → {tgtLang}
          </div>
          <div className="flex gap-1">
            <div className="flex-1 bg-white/20 rounded-full h-8 flex items-center px-3 text-white/60">
              Speak or type…
            </div>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/30 cursor-pointer"
            >
              🎤
            </div>
          </div>
        </div>

        <div
          className="w-12 h-12 rounded-full shadow-xl flex items-center justify-center text-white text-lg cursor-pointer"
          style={{ backgroundColor: config.primaryColor }}
        >
          💬
        </div>
      </div>
    </div>
  );
}

function EmbedCode({ config, tenantId }: { config: WizardConfig; tenantId: string }) {
  const [copied, setCopied] = useState(false);

  const snippet = `<script>
  window.VaaniConfig = {
    tenantId: "${tenantId}",
    apiEndpoint: "${typeof window !== "undefined" ? window.location.origin : "https://app.vaaniai.com"}",
    language: "${config.sourceLanguage}",
    targetLanguage: "${config.targetLanguage}",
    widgetName: "${config.widgetName}",
    primaryColor: "${config.primaryColor}",
    position: "${config.position}",
    mode: "${config.mode}",${config.knowledgeBaseId ? `\n    knowledgeBaseId: "${config.knowledgeBaseId}",` : ""}
  };
  (function(w,d,s,o,f,js,fjs){
    w['VaaniWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','vaani','https://cdn.vaaniai.com/widget/vaani.min.js'));
  vaani('init', window.VaaniConfig);
</script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    toast.success("Embed code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Paste before the closing <code className="text-xs bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag</p>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
        {snippet}
      </pre>
    </div>
  );
}

const STEPS = [
  { id: 1, label: "Use Case", icon: Zap },
  { id: 2, label: "Languages", icon: Globe },
  { id: 3, label: "Appearance", icon: Palette },
  { id: 4, label: "Embed", icon: Code2 },
];

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<"wizard" | "connectors">("wizard");
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<WizardConfig>(DEFAULT_CONFIG);

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: () => api.tenant.me().then((r) => r.data as { id: string; name: string }),
  });

  const { data: kbList } = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: () => api.knowledge.list().then((r) => r.data as { id: string; name: string }[]),
  });

  const update = (patch: Partial<WizardConfig>) => setConfig((c) => ({ ...c, ...patch }));

  const selectUseCase = (uc: typeof USE_CASES[number]) => {
    update({
      useCase: uc.id,
      mode: uc.mode,
      sourceLanguage: uc.defaultSource,
      targetLanguage: uc.defaultTarget,
    });
    setStep(2);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-500 mt-1">Build and deploy your multilingual voice widget in minutes</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(["wizard", "connectors"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-brand-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab === "wizard" ? "Widget Builder" : "Platform Connectors"}
          </button>
        ))}
      </div>

      {activeTab === "wizard" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex border-b border-gray-100">
                {STEPS.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-xs font-medium transition-colors ${
                      step === s.id
                        ? "bg-brand-50 text-brand-700 border-b-2 border-brand-600"
                        : step > s.id
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step > s.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <s.icon className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="p-6">
                {step === 1 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Choose your use case</h2>
                    <p className="text-sm text-gray-500 mb-5">Select the template that best matches your platform</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {USE_CASES.map((uc) => (
                        <button
                          key={uc.id}
                          onClick={() => selectUseCase(uc)}
                          className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                            config.useCase === uc.id
                              ? "border-brand-500 bg-brand-50"
                              : "border-gray-100 hover:border-brand-200"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${uc.color}`}>
                            <uc.icon className="w-5 h-5" />
                          </div>
                          <div className="font-semibold text-sm text-gray-900">{uc.label}</div>
                          <div className="text-xs text-gray-500 mt-1 leading-relaxed">{uc.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Configure languages</h2>
                    <p className="text-sm text-gray-500 mb-5">Set the language your users speak and the target language for responses</p>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User speaks</label>
                          <select
                            value={config.sourceLanguage}
                            onChange={(e) => update({ sourceLanguage: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            {LANGUAGES.map((l) => (
                              <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">AI responds in</label>
                          <select
                            value={config.targetLanguage}
                            onChange={(e) => update({ targetLanguage: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            {LANGUAGES.map((l) => (
                              <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Conversation mode</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: "agent", label: "AI Agent", icon: "🤖" },
                            { value: "translation", label: "Translation", icon: "🌐" },
                            { value: "conversation", label: "Live Convo", icon: "💬" },
                          ].map((m) => (
                            <button
                              key={m.value}
                              onClick={() => update({ mode: m.value })}
                              className={`p-3 rounded-lg border-2 text-center text-sm transition-colors ${
                                config.mode === m.value
                                  ? "border-brand-500 bg-brand-50 text-brand-700"
                                  : "border-gray-200 text-gray-600 hover:border-brand-200"
                              }`}
                            >
                              <div className="text-xl mb-1">{m.icon}</div>
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {config.mode === "agent" && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Knowledge base (optional)</label>
                          <select
                            value={config.knowledgeBaseId}
                            onChange={(e) => update({ knowledgeBaseId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          >
                            <option value="">None — general AI assistant</option>
                            {(kbList ?? []).map((kb) => (
                              <option key={kb.id} value={kb.id}>{kb.name}</option>
                            ))}
                          </select>
                          <p className="text-xs text-gray-400 mt-1">Connect a knowledge base to ground answers in your content</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Widget appearance</h2>
                    <p className="text-sm text-gray-500 mb-5">Customize the look and position of your widget</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Widget name</label>
                        <input
                          value={config.widgetName}
                          onChange={(e) => update({ widgetName: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                          placeholder="VaaniAI Assistant"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand color</label>
                        <div className="flex gap-3 items-center">
                          <input
                            type="color"
                            value={config.primaryColor}
                            onChange={(e) => update({ primaryColor: e.target.value })}
                            className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            value={config.primaryColor}
                            onChange={(e) => update({ primaryColor: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                            placeholder="#6366f1"
                          />
                        </div>
                        <div className="flex gap-2 mt-2">
                          {["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map((c) => (
                            <button
                              key={c}
                              onClick={() => update({ primaryColor: c })}
                              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                                config.primaryColor === c ? "border-gray-800 scale-110" : "border-transparent"
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Widget position</label>
                        <div className="grid grid-cols-2 gap-2">
                          {POSITIONS.map((p) => (
                            <button
                              key={p}
                              onClick={() => update({ position: p })}
                              className={`p-2 rounded-lg border-2 text-xs transition-colors ${
                                config.position === p
                                  ? "border-brand-500 bg-brand-50 text-brand-700"
                                  : "border-gray-200 text-gray-600 hover:border-brand-200"
                              }`}
                            >
                              {p.replace(/-/g, " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">Your embed code</h2>
                    <p className="text-sm text-gray-500 mb-5">Copy this snippet and paste it into your website</p>
                    <EmbedCode config={config} tenantId={tenant?.id ?? ""} />

                    <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-green-800">You&apos;re ready to deploy!</div>
                          <div className="text-sm text-green-700 mt-1">
                            Paste the code into your site, or follow a platform-specific guide in the{" "}
                            <button
                              onClick={() => setActiveTab("connectors")}
                              className="underline font-medium"
                            >
                              Platform Connectors
                            </button>{" "}
                            tab.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  {step < 4 ? (
                    <button
                      onClick={() => setStep((s) => Math.min(4, s + 1))}
                      disabled={step === 1 && !config.useCase}
                      className="flex items-center gap-2 px-5 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => { setStep(1); setConfig(DEFAULT_CONFIG); }}
                      className="flex items-center gap-2 px-5 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      Start over
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Live Preview</h3>
              <WidgetPreview config={config} />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Configuration Summary</h3>
              <div className="space-y-2 text-xs">
                {[
                  { label: "Use case", value: USE_CASES.find((u) => u.id === config.useCase)?.label ?? "Not selected" },
                  { label: "Mode", value: config.mode },
                  { label: "User language", value: LANGUAGES.find((l) => l.code === config.sourceLanguage)?.label },
                  { label: "Response language", value: LANGUAGES.find((l) => l.code === config.targetLanguage)?.label },
                  { label: "Widget name", value: config.widgetName },
                  { label: "Position", value: config.position },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900 text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "connectors" && (
        <div>
          <p className="text-sm text-gray-500 mb-6">
            Follow these platform-specific guides to embed your VaaniAI widget. Run the Widget Builder first to generate your embed code.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CONNECTORS.map((connector) => (
              <div key={connector.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{connector.logo}</div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{connector.label}</div>
                    <div className="text-xs text-gray-500">{connector.description}</div>
                  </div>
                </div>
                <ol className="space-y-2 flex-1">
                  {connector.steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-xs text-gray-600">
                      <span
                        className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 font-medium mt-0.5"
                        style={{ fontSize: "10px" }}
                      >
                        {i + 1}
                      </span>
                      <span className="leading-relaxed" dangerouslySetInnerHTML={{ __html: step.replace(/`([^`]+)`/g, "<code class='bg-gray-100 px-1 rounded font-mono'>$1</code>") }} />
                    </li>
                  ))}
                </ol>
                {connector.docsUrl !== "#" && (
                  <a
                    href={connector.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline mt-4"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View documentation
                  </a>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 bg-gradient-to-r from-brand-600 to-violet-600 rounded-xl p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-semibold text-lg mb-1">Need a custom integration?</div>
                <div className="text-brand-100 text-sm">
                  Use the full REST API or WebSocket SDK to build any integration. Create an API key from the API Keys page to get started.
                </div>
              </div>
              <a
                href="/dashboard/api-keys"
                className="shrink-0 bg-white text-brand-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" /> Get API Key
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
