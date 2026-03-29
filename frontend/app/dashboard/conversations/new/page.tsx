"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Mic, MicOff, Send, Globe, X, Play, Square, ChevronRight, Sparkles, Radio } from "lucide-react";

const TEMPLATE_CONFIGS: Record<string, { mode: string; sourceLang: string; targetLang: string; systemPrompt: string; label: string }> = {
  ecommerce: {
    mode: "agent",
    sourceLang: "hi",
    targetLang: "hi",
    label: "D2C / E-commerce Bot",
    systemPrompt: `You are a helpful customer support agent for an Indian D2C / e-commerce brand. Answer customer queries about orders, shipping, returns, and refunds clearly and politely. Always respond in the same language the customer uses. If you don't know the answer, say "Please contact our support team at support@yourstore.com". Keep responses short and actionable.`,
  },
  edtech: {
    mode: "agent",
    sourceLang: "hi",
    targetLang: "hi",
    label: "EdTech Support Bot",
    systemPrompt: `You are a helpful academic support assistant for an Indian edtech platform. Help students with course doubts, enrollment queries, technical issues with the platform, and study guidance. Respond in the same language the student uses (Hindi, English, or other Indian languages). Be encouraging, clear, and concise.`,
  },
  bfsi: {
    mode: "agent",
    sourceLang: "hi",
    targetLang: "hi",
    label: "BFSI / Banking Assistant",
    systemPrompt: `You are a helpful banking assistant for an Indian NBFC / bank. Help customers with general queries about EMI schedules, loan applications, account balance enquiries, KYC status, and branch locations. NEVER share actual account numbers or confidential information. Always verify the customer's identity by asking for their registered mobile number before sharing any account-related information. Respond in the language the customer uses. Direct complex issues to branch staff or the customer care number 1800-XXX-XXXX.`,
  },
};

const LANGUAGES = [
  { code: "hi", name: "Hindi", native: "हिंदी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "en", name: "English", native: "English" },
];

const MODES = [
  { value: "translation", label: "Translate", desc: "Speech translation between languages", color: "from-emerald-500 to-teal-500" },
  { value: "conversation", label: "Converse", desc: "AI-powered voice conversation", color: "from-brand-500 to-violet-500" },
  { value: "agent", label: "Agent", desc: "Knowledge base Q&A agent", color: "from-fire-500 to-amber-500" },
];

const VOICE_CARDS = [
  { id: "meera", name: "Meera", lang: "Hindi/Multi", tags: ["warm", "natural"], gradient: "from-rose-500/20 to-pink-500/20", dot: "bg-rose-400" },
  { id: "anushka", name: "Anushka", lang: "South Indian", tags: ["clear", "expressive"], gradient: "from-violet-500/20 to-purple-500/20", dot: "bg-violet-400" },
  { id: "sanchit", name: "Sanchit", lang: "Hindi (Voxtral)", tags: ["premium", "HD"], gradient: "from-fire-500/20 to-amber-500/20", dot: "bg-fire-400" },
  { id: "nick", name: "Nick", lang: "English (Voxtral)", tags: ["premium", "HD"], gradient: "from-sky-500/20 to-blue-500/20", dot: "bg-sky-400" },
];

interface Message {
  role: "user" | "assistant";
  text: string;
  audioBase64?: string;
  timestamp: Date;
}

function WaveformBars({ active, color = "bg-fire-400" }: { active: boolean; color?: string }) {
  const heights = [3, 7, 12, 8, 15, 10, 18, 7, 14, 9, 6, 13, 10, 16, 8];
  return (
    <div className="flex items-center gap-[2px] h-5">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`inline-block w-[2px] rounded-full ${color} transition-all duration-300`}
          style={{
            height: active ? `${h}px` : "3px",
            animation: active ? `wave 1.2s ease-in-out ${i * 80}ms infinite` : "none",
          }}
        />
      ))}
    </div>
  );
}

function AudioPlayer({ base64 }: { base64: string }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(`data:audio/wav;base64,${base64}`);
      audioRef.current.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] transition-all group"
    >
      {playing ? (
        <Square className="w-3 h-3 text-fire-400 fill-fire-400" />
      ) : (
        <Play className="w-3 h-3 text-fire-400 fill-fire-400 group-hover:scale-110 transition-transform" />
      )}
      <WaveformBars active={playing} color="bg-fire-400" />
      <span className="text-[10px] text-white/40 font-mono">{playing ? "playing" : "play"}</span>
    </button>
  );
}

export default function NewConversationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get("template") ?? "";
  const template = TEMPLATE_CONFIGS[templateId] ?? null;

  const [mode, setMode] = useState(template?.mode ?? "conversation");
  const [sourceLang, setSourceLang] = useState(template?.sourceLang ?? "en");
  const [targetLang, setTargetLang] = useState(template?.targetLang ?? "hi");
  const [selectedVoice, setSelectedVoice] = useState("meera");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversationMutation = useMutation({
    mutationFn: () =>
      api.conversations
        .start({
          mode,
          source_language: sourceLang,
          target_language: targetLang,
          ...(template ? { system_prompt: template.systemPrompt } : {}),
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setConversationId(data.id);
      toast.success(template ? `${template.label} ready` : "Playground started");
    },
    onError: () => toast.error("Failed to start conversation"),
  });

  const sendText = async () => {
    if (!conversationId || !textInput.trim() || isSending) return;
    const text = textInput.trim();
    setTextInput("");
    setIsSending(true);
    setMessages((prev) => [...prev, { role: "user", text, timestamp: new Date() }]);
    try {
      const { data } = await api.conversations.sendMessage(conversationId, text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.text, audioBase64: data.audio_base64, timestamp: new Date() },
      ]);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const transcribeAndSend = useCallback(async (audioBlob: Blob) => {
    if (!conversationId) return;
    setIsSending(true);
    try {
      const { data: transcribeData } = await api.voice.transcribe(
        new File([audioBlob], "recording.webm", { type: "audio/webm" }),
        sourceLang
      );
      const text = transcribeData.text;
      if (!text.trim()) { toast.info("No speech detected"); return; }
      setMessages((prev) => [...prev, { role: "user", text, timestamp: new Date() }]);
      const { data } = await api.conversations.sendMessage(conversationId, text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.text, audioBase64: data.audio_base64, timestamp: new Date() },
      ]);
    } catch {
      toast.error("Failed to process audio");
    } finally {
      setIsSending(false);
    }
  }, [conversationId, sourceLang]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await transcribeAndSend(new Blob(audioChunksRef.current, { type: "audio/webm" }));
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied");
    }
  }, [transcribeAndSend]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, []);

  const endConversation = async () => {
    if (conversationId) {
      await api.conversations.end(conversationId).catch(() => {});
    }
    router.push("/dashboard/conversations");
  };

  const srcLang = LANGUAGES.find((l) => l.code === sourceLang);
  const tgtLang = LANGUAGES.find((l) => l.code === targetLang);

  return (
    <div className="flex h-full bg-[#050a14] text-white overflow-hidden">

      {/* ── LEFT CONFIG PANEL ── */}
      <div className="w-[280px] shrink-0 flex flex-col border-r border-white/[0.07] bg-[#070d1a]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-fire-400" />
            <span className="text-sm font-semibold text-white">
              {template ? template.label : "Playground"}
            </span>
          </div>
          <button onClick={endConversation} className="w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

          {/* Mode */}
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Mode</p>
            <div className="space-y-1.5">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => !conversationId && setMode(m.value)}
                  disabled={!!conversationId}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    mode === m.value
                      ? "bg-white/[0.08] border border-white/[0.12]"
                      : "hover:bg-white/[0.04] border border-transparent"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${m.color} flex items-center justify-center shrink-0`}>
                    <ChevronRight className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${mode === m.value ? "text-white" : "text-white/60"}`}>{m.label}</p>
                    <p className="text-[10px] text-white/30 leading-tight">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">
              <Globe className="w-3 h-3 inline mr-1" />Languages
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-white/40 mb-1 block">Source</label>
                <select
                  value={sourceLang}
                  onChange={(e) => !conversationId && setSourceLang(e.target.value)}
                  disabled={!!conversationId}
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white/80 focus:outline-none focus:border-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#0d1525]">{l.native} — {l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-white/40 mb-1 block">Target</label>
                <select
                  value={targetLang}
                  onChange={(e) => !conversationId && setTargetLang(e.target.value)}
                  disabled={!!conversationId}
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/[0.08] rounded-lg text-sm text-white/80 focus:outline-none focus:border-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#0d1525]">{l.native} — {l.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Voice */}
          <div>
            <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Voice</p>
            <div className="space-y-1.5">
              {VOICE_CARDS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                    selectedVoice === v.id
                      ? `bg-gradient-to-r ${v.gradient} border-white/[0.15]`
                      : "bg-transparent border-transparent hover:bg-white/[0.03] hover:border-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${v.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-white/85">{v.name}</span>
                        {v.tags.includes("premium") && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-fire-500/20 text-fire-400 font-semibold uppercase tracking-wide">HD</span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/35 truncate">{v.lang}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-1.5 ml-4">
                    {v.tags.filter(t => t !== "premium" && t !== "HD").map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-white/30">{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Start button */}
        {!conversationId && (
          <div className="px-4 py-4 border-t border-white/[0.06]">
            <button
              onClick={() => startConversationMutation.mutate()}
              disabled={startConversationMutation.isPending}
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-brand-600/20"
            >
              {startConversationMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  Start Playground
                </>
              )}
            </button>
          </div>
        )}

        {/* Active session info */}
        {conversationId && (
          <div className="px-4 py-4 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-xs text-emerald-400 font-medium">Session active</span>
            </div>
            <p className="text-[10px] text-white/30 font-mono truncate">{conversationId}</p>
            <button
              onClick={endConversation}
              className="mt-3 w-full py-2 text-xs text-white/50 hover:text-white/80 border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all"
            >
              End session
            </button>
          </div>
        )}
      </div>

      {/* ── MAIN CANVAS ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Canvas header */}
        <div className="flex items-center gap-4 px-6 py-3.5 border-b border-white/[0.06]" style={{ backdropFilter: "blur(12px)", background: "rgba(5,10,20,0.8)" }}>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30 font-mono">
            <span>{MODES.find((m) => m.value === mode)?.label.toLowerCase()}</span>
            <span>·</span>
            <span>{srcLang?.native} → {tgtLang?.native}</span>
            {conversationId && (
              <>
                <span>·</span>
                <span className="text-emerald-400/70">live</span>
              </>
            )}
          </div>
          <div className="ml-auto">
            {conversationId && <WaveformBars active={isSending} color="bg-brand-400" />}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {!conversationId && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-500/20 flex items-center justify-center mb-5">
                <Sparkles className="w-7 h-7 text-brand-400" />
              </div>
              <h3 className="font-serif text-2xl text-white mb-2">Configure & Start</h3>
              <p className="text-sm text-white/35 max-w-sm leading-relaxed">
                Select your mode, source and target languages, and a voice from the left panel — then hit <span className="text-white/60 font-medium">Start Playground</span> to begin.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {LANGUAGES.slice(0, 7).map((l) => (
                  <span key={l.code} className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-xs text-white/30">{l.native}</span>
                ))}
              </div>
            </div>
          )}

          {conversationId && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${isRecording ? "bg-red-500/20 border border-red-500/40 animate-pulse" : "bg-white/[0.04] border border-white/[0.08]"}`}>
                <Mic className={`w-7 h-7 ${isRecording ? "text-red-400" : "text-white/30"}`} />
              </div>
              <p className="text-sm text-white/30">
                {isRecording ? "Listening..." : "Hold mic or type to start"}
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${
                msg.role === "assistant"
                  ? "bg-fire-500/20 border border-fire-500/30 text-fire-400"
                  : "bg-brand-600/30 border border-brand-500/30 text-brand-300"
              }`}>
                {msg.role === "assistant" ? "AI" : "U"}
              </div>

              {/* Bubble */}
              <div className={`max-w-[68%] ${msg.role === "assistant" ? "border-l-2 border-fire-500/50 pl-3" : ""}`}>
                <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-brand-600/25 border border-brand-500/20 text-white/85"
                    : "bg-white/[0.05] border border-white/[0.08] text-white/80"
                }`}>
                  <p>{msg.text}</p>
                </div>
                {msg.audioBase64 && msg.role === "assistant" && (
                  <AudioPlayer base64={msg.audioBase64} />
                )}
                <p className="text-[10px] text-white/20 font-mono mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg shrink-0 bg-fire-500/20 border border-fire-500/30 flex items-center justify-center text-xs font-bold text-fire-400 mt-0.5">AI</div>
              <div className="px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.08] border-l-2 border-l-fire-500/50 pl-3">
                <div className="flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-fire-400/60 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        {conversationId && (
          <div className="px-5 py-4 border-t border-white/[0.06]" style={{ background: "rgba(5,10,20,0.9)" }}>
            <div className="flex items-center gap-3">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isSending}
                className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? "bg-red-500 shadow-lg shadow-red-500/40 scale-110"
                    : "bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08]"
                } disabled:opacity-50`}
              >
                {isRecording ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white/60" />}
              </button>

              <div className="flex-1 relative">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendText()}
                  placeholder={isRecording ? "Recording..." : "Type a message or hold mic…"}
                  disabled={isSending || isRecording}
                  className="w-full px-4 py-2.5 bg-white/[0.05] border border-white/[0.08] rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:border-brand-500/40 disabled:opacity-50 transition-colors"
                />
              </div>

              <button
                onClick={sendText}
                disabled={!textInput.trim() || isSending}
                className="shrink-0 w-11 h-11 rounded-full bg-brand-600 hover:bg-brand-500 text-white flex items-center justify-center disabled:opacity-30 transition-all shadow-lg shadow-brand-600/20 hover:-translate-y-px"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[10px] text-white/20">Hold mic to record · Enter to send</p>
              {isRecording && (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[10px] text-red-400 font-mono">REC</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
