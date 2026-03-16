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
  X,
  FileCode,
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

type TemplateTab = { label: string; lang: string; code: (ctx: TemplateContext) => string };

interface TemplateContext {
  tenantId: string;
  apiEndpoint: string;
  widgetName: string;
  primaryColor: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface Connector {
  id: string;
  label: string;
  logo: string;
  description: string;
  steps: string[];
  docsUrl: string;
  templateTabs: TemplateTab[];
}

const CONNECTORS: Connector[] = [
  {
    id: "shopify",
    label: "Shopify",
    logo: "🛍️",
    description: "Add voice search to your Shopify store product pages",
    steps: [
      "Go to Shopify Admin → Online Store → Themes → Edit code",
      "Open `theme.liquid` and paste the snippet before `</body>`",
      "Save and preview your store",
    ],
    docsUrl: "https://help.shopify.com/en/manual/online-store/themes/theme-structure",
    templateTabs: [
      {
        label: "theme.liquid",
        lang: "liquid",
        code: (ctx) => `{% comment %} Bolo Multilingual Voice Widget {% endcomment %}
<script>
  window.VaaniConfig = {
    tenantId: "${ctx.tenantId}",
    apiEndpoint: "${ctx.apiEndpoint}",
    widgetName: "${ctx.widgetName}",
    primaryColor: "${ctx.primaryColor}",
    position: "bottom-right",
    mode: "agent",
    language: "{{ shop.locale | replace: '-', '_' | downcase | truncate: 2, '' }}",
    targetLanguage: "${ctx.targetLanguage}",
    context: {
      shop: "{{ shop.name }}",
      page: "{{ page_title }}",
      product: "{% if product %}{{ product.title }}{% endif %}"
    }
  };
  (function(w,d,s,o,f,js,fjs){
    w['VaaniWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','vaani','${ctx.apiEndpoint}/widget/vaani.min.js'));
  vaani('init', window.VaaniConfig);
</script>`,
      },
      {
        label: "Product page snippet",
        lang: "liquid",
        code: (ctx) => `{% comment %} vaani-voice-search.liquid — include on product pages {% endcomment %}
<div id="vaani-search-bar" data-tenant="${ctx.tenantId}">
  <button
    onclick="vaani('openSearch')"
    style="background:${ctx.primaryColor};color:#fff;border:none;border-radius:8px;padding:10px 18px;cursor:pointer;font-size:14px;"
  >
    🎤 Search in your language
  </button>
</div>

<script>
  vaani('on', 'search', function(query) {
    window.location.href = '/search?q=' + encodeURIComponent(query.translated || query.original);
  });
</script>`,
      },
    ],
  },
  {
    id: "wordpress",
    label: "WordPress",
    logo: "📝",
    description: "Embed on any WordPress site or WooCommerce store",
    steps: [
      "Add the PHP snippet to your theme's `functions.php`",
      "Or use a plugin like Insert Headers and Footers",
      "Save and visit your site",
    ],
    docsUrl: "https://wordpress.org/plugins/insert-headers-and-footers/",
    templateTabs: [
      {
        label: "functions.php",
        lang: "php",
        code: (ctx) => `<?php
/**
 * Bolo Voice Widget Integration
 * Add this to your theme's functions.php
 */
function bolo_enqueue_widget() {
    $config = array(
        'tenantId'       => '${ctx.tenantId}',
        'apiEndpoint'    => '${ctx.apiEndpoint}',
        'widgetName'     => '${ctx.widgetName}',
        'primaryColor'   => '${ctx.primaryColor}',
        'language'       => get_locale() ? substr(get_locale(), 0, 2) : '${ctx.sourceLanguage}',
        'targetLanguage' => '${ctx.targetLanguage}',
        'position'       => 'bottom-right',
        'mode'           => 'agent',
    );

    wp_register_script(
        'bolo-widget',
        '${ctx.apiEndpoint}/widget/vaani.min.js',
        array(),
        null,
        true
    );
    wp_enqueue_script('bolo-widget');
    wp_add_inline_script(
        'bolo-widget',
        'window.VaaniConfig = ' . json_encode($config) . '; vaani("init", window.VaaniConfig);',
        'before'
    );
}
add_action('wp_enqueue_scripts', 'bolo_enqueue_widget');`,
      },
      {
        label: "Shortcode widget",
        lang: "php",
        code: (ctx) => `<?php
/**
 * [bolo_button] shortcode — renders a voice search button anywhere in content
 */
function bolo_button_shortcode($atts) {
    $a = shortcode_atts(array(
        'label'    => 'Search in your language',
        'language' => '${ctx.sourceLanguage}',
    ), $atts);

    return sprintf(
        '<button onclick="vaani(\'openSearch\')" style="background:%s;color:#fff;border:none;border-radius:8px;padding:10px 18px;cursor:pointer;">🎤 %s</button>',
        '${ctx.primaryColor}',
        esc_html($a['label'])
    );
}
add_shortcode('bolo_button', 'bolo_button_shortcode');`,
      },
    ],
  },
  {
    id: "freshdesk",
    label: "Freshdesk",
    logo: "🎧",
    description: "Live translation overlay for Freshdesk support agents",
    steps: [
      "Go to Freshdesk Admin → Portals → Portal Customization",
      "Paste the snippet into the Header Scripts section",
      "Save — agents see the translation panel on every ticket",
    ],
    docsUrl: "https://support.freshdesk.com/en/support/solutions/articles/37599",
    templateTabs: [
      {
        label: "Portal script",
        lang: "javascript",
        code: (ctx) => `// Bolo Freshdesk Integration
// Paste this in: Admin → Portals → Portal Customization → Header Scripts

window.VaaniConfig = {
  tenantId: "${ctx.tenantId}",
  apiEndpoint: "${ctx.apiEndpoint}",
  widgetName: "${ctx.widgetName}",
  primaryColor: "${ctx.primaryColor}",
  position: "bottom-right",
  mode: "translation",
  language: "${ctx.sourceLanguage}",
  targetLanguage: "${ctx.targetLanguage}",
};

(function(w,d,s,o,f,js,fjs){
  w['VaaniWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
  js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
  js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
}(window,document,'script','vaani','${ctx.apiEndpoint}/widget/vaani.min.js'));

vaani('init', window.VaaniConfig);

// Auto-inject translation of ticket body when agent opens a ticket
document.addEventListener('DOMContentLoaded', function() {
  var observer = new MutationObserver(function() {
    var ticketBody = document.querySelector('.ticket-body, .note-body');
    if (ticketBody && !ticketBody.dataset.vaaniProcessed) {
      ticketBody.dataset.vaaniProcessed = '1';
      vaani('translateElement', ticketBody, {
        from: '${ctx.sourceLanguage}',
        to: '${ctx.targetLanguage}',
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
});`,
      },
    ],
  },
  {
    id: "whatsapp",
    label: "WhatsApp Business",
    logo: "💬",
    description: "Multilingual WhatsApp bot via Twilio webhook",
    steps: [
      "Deploy the Python webhook to your server",
      "Set the Twilio WhatsApp webhook URL to `https://yourserver.com/webhook/whatsapp`",
      "Messages are auto-translated and answered by Bolo",
    ],
    docsUrl: "https://www.twilio.com/docs/whatsapp",
    templateTabs: [
      {
        label: "webhook.py",
        lang: "python",
        code: (ctx) => `"""
Bolo × WhatsApp Business via Twilio
Deploy with: uvicorn webhook:app --host 0.0.0.0 --port 8080
Set Twilio webhook to: https://yourserver.com/webhook/whatsapp
"""

import httpx
from fastapi import FastAPI, Form, Response

app = FastAPI()

BOLO_API = "${ctx.apiEndpoint}/api/v1"
BOLO_API_KEY = "YOUR_BOLO_API_KEY"  # create one in API Keys page
SESSIONS: dict[str, str] = {}             # phone → conversation_id

HEADERS = {"X-API-Key": BOLO_API_KEY}


@app.post("/webhook/whatsapp")
async def handle_whatsapp(
    Body: str = Form(...),
    From: str = Form(...),
):
    async with httpx.AsyncClient(timeout=30) as client:
        conv_id = SESSIONS.get(From)

        if not conv_id:
            resp = await client.post(
                f"{BOLO_API}/conversations",
                headers=HEADERS,
                json={
                    "mode": "agent",
                    "source_language": "${ctx.sourceLanguage}",
                    "target_language": "${ctx.targetLanguage}",
                    "caller_id": From,
                },
            )
            conv_id = resp.json()["id"]
            SESSIONS[From] = conv_id

        msg_resp = await client.post(
            f"{BOLO_API}/conversations/{conv_id}/message",
            headers=HEADERS,
            json={"content": Body},
        )
        reply = msg_resp.json().get("content_translated") or msg_resp.json().get("content_original", "")

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response><Message>{reply}</Message></Response>"""
    return Response(content=twiml, media_type="application/xml")`,
      },
      {
        label: "requirements.txt",
        lang: "text",
        code: () => `fastapi>=0.110.0
uvicorn[standard]>=0.29.0
httpx>=0.27.0
python-multipart>=0.0.9`,
      },
    ],
  },
  {
    id: "react",
    label: "React / Next.js",
    logo: "⚛️",
    description: "Drop-in React component for any React or Next.js app",
    steps: [
      "Copy the component into your project",
      "Render `<VaaniWidget />` in your layout or page",
      "Pass your API key as a prop",
    ],
    docsUrl: "#",
    templateTabs: [
      {
        label: "VaaniWidget.tsx",
        lang: "tsx",
        code: (ctx) => `"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    VaaniConfig?: Record<string, unknown>;
    vaani?: (cmd: string, ...args: unknown[]) => void;
  }
}

interface VaaniWidgetProps {
  apiKey: string;
  language?: string;
  targetLanguage?: string;
  mode?: "agent" | "translation" | "conversation";
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export function VaaniWidget({
  apiKey,
  language = "${ctx.sourceLanguage}",
  targetLanguage = "${ctx.targetLanguage}",
  mode = "agent",
  position = "bottom-right",
}: VaaniWidgetProps) {
  useEffect(() => {
    window.VaaniConfig = {
      tenantId: "${ctx.tenantId}",
      apiEndpoint: "${ctx.apiEndpoint}",
      widgetName: "${ctx.widgetName}",
      primaryColor: "${ctx.primaryColor}",
      language,
      targetLanguage,
      mode,
      position,
      apiKey,
    };

    if (document.getElementById("bolo-widget-script")) return;

    const script = document.createElement("script");
    script.id = "bolo-widget-script";
    script.src = "${ctx.apiEndpoint}/widget/vaani.min.js";
    script.async = true;
    script.onload = () => window.vaani?.("init", window.VaaniConfig);
    document.body.appendChild(script);

    return () => {
      document.getElementById("bolo-widget-script")?.remove();
    };
  }, [apiKey, language, targetLanguage, mode, position]);

  return null;
}`,
      },
      {
        label: "Usage (layout.tsx)",
        lang: "tsx",
        code: (ctx) => `import { VaaniWidget } from "@/components/VaaniWidget";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <VaaniWidget
          apiKey={process.env.NEXT_PUBLIC_BOLO_API_KEY!}
          language="${ctx.sourceLanguage}"
          targetLanguage="${ctx.targetLanguage}"
          mode="agent"
          position="bottom-right"
        />
      </body>
    </html>
  );
}`,
      },
    ],
  },
  {
    id: "rest",
    label: "REST API",
    logo: "🔌",
    description: "Full REST + WebSocket API for any backend or mobile app",
    steps: [
      "Create an API key from the API Keys page",
      "POST to `/api/v1/conversations` to start a session",
      "Send messages or stream audio via WebSocket",
    ],
    docsUrl: "/docs",
    templateTabs: [
      {
        label: "cURL",
        lang: "bash",
        code: (ctx) => `# 1. Start a conversation
curl -X POST ${ctx.apiEndpoint}/api/v1/conversations \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mode": "agent",
    "source_language": "${ctx.sourceLanguage}",
    "target_language": "${ctx.targetLanguage}"
  }'

# 2. Send a message (use conversation id from step 1)
curl -X POST ${ctx.apiEndpoint}/api/v1/conversations/{CONV_ID}/message \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "मुझे प्रोडक्ट की जानकारी दें"}'

# 3. Transcribe audio (multipart)
curl -X POST ${ctx.apiEndpoint}/api/v1/voice/transcribe \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "audio=@recording.wav" \\
  -F "language=${ctx.sourceLanguage}"`,
      },
      {
        label: "Python",
        lang: "python",
        code: (ctx) => `"""Bolo Python integration example"""
import httpx

API = "${ctx.apiEndpoint}/api/v1"
HEADERS = {"X-API-Key": "YOUR_API_KEY"}


async def run():
    async with httpx.AsyncClient(timeout=30, headers=HEADERS) as client:
        # Start conversation
        resp = await client.post(f"{API}/conversations", json={
            "mode": "agent",
            "source_language": "${ctx.sourceLanguage}",
            "target_language": "${ctx.targetLanguage}",
        })
        conv_id = resp.json()["id"]
        print("Conversation:", conv_id)

        # Send a text message
        resp = await client.post(f"{API}/conversations/{conv_id}/message", json={
            "content": "मुझे प्रोडक्ट की जानकारी दें",
        })
        data = resp.json()
        print("Original:", data["content_original"])
        print("Translated:", data["content_translated"])
        print("Audio URL:", data.get("audio_url"))

        # End the conversation
        await client.patch(f"{API}/conversations/{conv_id}/end")


if __name__ == "__main__":
    import asyncio
    asyncio.run(run())`,
      },
      {
        label: "Node.js",
        lang: "javascript",
        code: (ctx) => `// Bolo Node.js integration
const API = "${ctx.apiEndpoint}/api/v1";
const HEADERS = {
  "X-API-Key": "YOUR_API_KEY",
  "Content-Type": "application/json",
};

async function main() {
  // Start conversation
  const startRes = await fetch(\`\${API}/conversations\`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({
      mode: "agent",
      source_language: "${ctx.sourceLanguage}",
      target_language: "${ctx.targetLanguage}",
    }),
  });
  const { id: convId } = await startRes.json();
  console.log("Conversation ID:", convId);

  // Send a message
  const msgRes = await fetch(\`\${API}/conversations/\${convId}/message\`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ content: "मुझे प्रोडक्ट की जानकारी दें" }),
  });
  const msg = await msgRes.json();
  console.log("Original:", msg.content_original);
  console.log("Translated:", msg.content_translated);

  // WebSocket streaming (for real-time voice)
  const ws = new WebSocket(
    \`${ctx.apiEndpoint.replace("http", "ws")}/api/v1/voice/stream?token=YOUR_JWT_TOKEN\`
  );
  ws.onopen = () => {
    ws.send(JSON.stringify({
      type: "config",
      language: "${ctx.sourceLanguage}",
      target_language: "${ctx.targetLanguage}",
    }));
  };
  ws.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.type === "transcript") console.log("Heard:", data.text);
    if (data.type === "translation") console.log("Translation:", data.translated_text);
  };
}

main().catch(console.error);`,
      },
    ],
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
  widgetName: "Bolo Assistant",
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
    apiEndpoint: "${typeof window !== "undefined" ? window.location.origin : "https://app.bolo.com"}",
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
  }(window,document,'script','vaani','https://cdn.bolo.com/widget/vaani.min.js'));
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

function TemplatePanel({
  connector,
  ctx,
  onClose,
}: {
  connector: Connector;
  ctx: TemplateContext;
  onClose: () => void;
}) {
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const tab = connector.templateTabs[activeTabIdx];
  const code = tab.code(ctx);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Template code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{connector.logo}</span>
            <div>
              <div className="font-semibold text-gray-900">{connector.label} — Full Template</div>
              <div className="text-xs text-gray-500">{connector.description}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-1 border-b border-gray-100">
            {connector.templateTabs.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActiveTabIdx(i)}
                className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                  activeTabIdx === i
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6 pt-0">
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors backdrop-blur-sm border border-white/20"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <pre className="bg-gray-950 text-gray-100 rounded-b-lg rounded-tr-lg p-4 text-xs overflow-x-auto whitespace-pre font-mono leading-relaxed min-h-64">
              {code}
            </pre>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Installation steps</div>
            {connector.steps.map((step, i) => (
              <div key={i} className="flex gap-2.5 text-xs text-gray-600">
                <span
                  className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0 font-medium"
                  style={{ fontSize: "10px" }}
                >
                  {i + 1}
                </span>
                <span
                  className="leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: step.replace(/`([^`]+)`/g, "<code class='bg-gray-100 px-1 rounded font-mono'>$1</code>"),
                  }}
                />
              </div>
            ))}
          </div>
          {connector.docsUrl !== "#" && (
            <a
              href={connector.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline mt-4"
            >
              <ExternalLink className="w-3 h-3" /> Platform documentation
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<"wizard" | "connectors">("wizard");
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<WizardConfig>(DEFAULT_CONFIG);
  const [openTemplate, setOpenTemplate] = useState<Connector | null>(null);

  const { data: tenant } = useQuery({
    queryKey: ["tenant"],
    queryFn: () => api.tenant.me().then((r) => r.data as { id: string; name: string; widget_name?: string; primary_color?: string; default_source_language?: string; default_target_language?: string }),
  });

  const { data: kbList } = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: () => api.knowledge.list().then((r) => r.data as { id: string; name: string }[]),
  });

  const templateCtx: TemplateContext = {
    tenantId: tenant?.id ?? "YOUR_TENANT_ID",
    apiEndpoint: typeof window !== "undefined" ? window.location.origin : "https://app.bolo.com",
    widgetName: config.widgetName || tenant?.widget_name || "Bolo Assistant",
    primaryColor: config.primaryColor || tenant?.primary_color || "#6366f1",
    sourceLanguage: config.sourceLanguage || tenant?.default_source_language || "hi",
    targetLanguage: config.targetLanguage || tenant?.default_target_language || "en",
  };

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
                          placeholder="Bolo Assistant"
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
            Click <strong>View Template</strong> on any card to get the full, ready-to-use code with your tenant ID already filled in.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {CONNECTORS.map((connector) => (
              <div key={connector.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-2xl">{connector.logo}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm">{connector.label}</div>
                    <div className="text-xs text-gray-500 truncate">{connector.description}</div>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">
                    {connector.templateTabs.length} file{connector.templateTabs.length !== 1 ? "s" : ""}
                  </span>
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
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => setOpenTemplate(connector)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <FileCode className="w-3.5 h-3.5" /> View Template
                  </button>
                  {connector.docsUrl !== "#" && (
                    <a
                      href={connector.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 px-3 py-2 border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50 text-xs rounded-lg transition-colors"
                      title="Platform docs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
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

      {openTemplate && (
        <TemplatePanel
          connector={openTemplate}
          ctx={templateCtx}
          onClose={() => setOpenTemplate(null)}
        />
      )}
    </div>
  );
}
