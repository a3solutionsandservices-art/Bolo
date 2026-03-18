"use client";

import { useEffect, useRef, useState } from "react";
import {
  MessageCircle, X, Send, ChevronDown, Loader2,
  Zap, CreditCard, BookOpen, AlertCircle, LifeBuoy,
} from "lucide-react";
import { clsx } from "clsx";
import { apiClient } from "@/lib/api";

const SUPPORT_SYSTEM_PROMPT = `You are Bolo Support — a friendly, expert AI assistant for the Bolo voice AI platform. Keep answers concise and actionable (max 3–4 sentences unless a step-by-step is needed).

You help with:
- Onboarding: account setup, workspace creation, widget embedding, first conversation
- Technical issues: API errors, voice quality, Sarvam STT/TTS failures, CORS errors, WebSocket drops
- Billing: Starter (₹49/mo), Growth (₹199/mo), Enterprise (custom), Stripe, invoices, upgrades
- Features: Knowledge Bases (RAG), Voice Cloning, Marketplace, Analytics, Conversations, API Keys

Platform facts:
- 11 Indian languages: Hindi, Tamil, Telugu, Bengali, Gujarati, Marathi, Kannada, Malayalam, Punjabi, Odia, English
- Widget: embed with one <script> tag before </body>
- API docs: /docs (Swagger UI)
- Voice clone requires Growth plan or above
- Knowledge Base uses Pinecone vector search + OpenAI GPT-4o
- Sarvam AI powers STT (saaras:v2) and TTS (bulbul:v1)

If you cannot resolve an issue, say: "Please email support@bolo.ai with your workspace ID and a description of the issue."

Always respond in English unless the user writes in another language.`;

interface Message {
  role: "user" | "assistant";
  text: string;
  ts: number;
}

const QUICK_ACTIONS = [
  { icon: Zap, label: "How do I embed the widget?", color: "text-brand-600 bg-brand-50" },
  { icon: BookOpen, label: "How do I set up a Knowledge Base?", color: "text-emerald-600 bg-emerald-50" },
  { icon: CreditCard, label: "What plan do I need for Voice Cloning?", color: "text-violet-600 bg-violet-50" },
  { icon: AlertCircle, label: "Voice translation is failing", color: "text-red-600 bg-red-50" },
];

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ensureConversation = async (): Promise<string> => {
    if (convId) return convId;
    const { data } = await apiClient.post("/api/v1/conversations", {
      mode: "conversation",
      source_language: "en",
      target_language: "en",
      system_prompt: SUPPORT_SYSTEM_PROMPT,
      caller_metadata: { _context: "bolo-support" },
    });
    setConvId(data.id);
    return data.id;
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim(), ts: Date.now() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const id = await ensureConversation();
      const { data } = await apiClient.post(`/api/v1/conversations/${id}/message`, {
        content: text.trim(),
        is_audio: false,
      });
      const assistantMsg: Message = { role: "assistant", text: data.text, ts: Date.now() };
      setMessages((m) => [...m, assistantMsg]);
      if (!open) setUnread((n) => n + 1);
    } catch {
      setMessages((m) => [...m, {
        role: "assistant",
        text: "Sorry, I couldn't process that. Please try again or email support@bolo.ai.",
        ts: Date.now(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showEmpty = messages.length === 0 && !loading;

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-brand-600 to-violet-600">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <LifeBuoy className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">Bolo Support</p>
              <p className="text-[10px] text-white/70">Onboarding · Technical · Billing</p>
            </div>
            <button onClick={() => setOpen(false)} className="w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors">
              <ChevronDown className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: "380px" }}>
            {showEmpty ? (
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-2xl rounded-tl-sm p-3">
                  <p className="text-sm text-slate-700">
                    👋 Hi! I&apos;m Bolo Support. Ask me anything about setting up, billing, or troubleshooting.
                  </p>
                </div>
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide px-1">Quick questions</p>
                <div className="space-y-2">
                  {QUICK_ACTIONS.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => sendMessage(a.label)}
                      className={clsx("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-left transition-colors text-xs font-medium text-slate-700 hover:text-slate-900")}
                    >
                      <div className={clsx("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", a.color)}>
                        <a.icon className="w-3.5 h-3.5" />
                      </div>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={clsx(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      m.role === "user"
                        ? "bg-brand-600 text-white rounded-br-sm"
                        : "bg-slate-100 text-slate-800 rounded-bl-sm"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          <div className="border-t border-slate-100 p-3 flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              rows={1}
              disabled={loading}
              className="flex-1 resize-none text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 disabled:opacity-50 transition-colors"
              style={{ minHeight: "36px", maxHeight: "100px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 bg-gradient-to-br from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open support chat"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
