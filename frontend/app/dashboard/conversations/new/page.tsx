"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Mic, MicOff, Send, Globe, Zap, X, Volume2 } from "lucide-react";

const LANGUAGES = [
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "mr", name: "Marathi" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "en", name: "English" },
];

const MODES = [
  { value: "translation", label: "Translation", desc: "Translate speech between languages" },
  { value: "conversation", label: "Conversation", desc: "AI-powered conversation assistant" },
  { value: "agent", label: "Agent", desc: "Knowledge base Q&A agent" },
];

interface Message {
  role: "user" | "assistant";
  text: string;
  audioBase64?: string;
  timestamp: Date;
}

export default function NewConversationPage() {
  const router = useRouter();
  const [mode, setMode] = useState("conversation");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("hi");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startConversationMutation = useMutation({
    mutationFn: () =>
      api.conversations
        .start({ mode, source_language: sourceLang, target_language: targetLang })
        .then((r) => r.data),
    onSuccess: (data) => {
      setConversationId(data.id);
      toast.success("Conversation started");
    },
    onError: () => toast.error("Failed to start conversation"),
  });

  const sendText = async () => {
    if (!conversationId || !textInput.trim() || isSending) return;
    const text = textInput.trim();
    setTextInput("");
    setIsSending(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", text, timestamp: new Date() },
    ]);
    try {
      const { data } = await api.conversations.sendMessage(conversationId, text);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.text,
          audioBase64: data.audio_base64,
          timestamp: new Date(),
        },
      ]);
      if (data.audio_base64) {
        playAudio(data.audio_base64);
      }
    } catch {
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const playAudio = (base64: string) => {
    const audio = new Audio(`data:audio/wav;base64,${base64}`);
    audio.play().catch(() => {});
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
      if (!text.trim()) {
        toast.info("No speech detected");
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "user", text, timestamp: new Date() },
      ]);
      const { data } = await api.conversations.sendMessage(conversationId, text);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.text,
          audioBase64: data.audio_base64,
          timestamp: new Date(),
        },
      ]);
      if (data.audio_base64) {
        playAudio(data.audio_base64);
      }
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
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await transcribeAndSend(blob);
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
      router.push("/dashboard/conversations");
    } else {
      router.push("/dashboard/conversations");
    }
  };

  return (
    <div className="flex flex-col h-full p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Conversation</h1>
          <p className="text-gray-500 mt-1">Voice-powered AI interaction</p>
        </div>
        <button
          onClick={endConversation}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <X className="w-4 h-4" />
          End & Exit
        </button>
      </div>

      {!conversationId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-lg">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Configure Conversation</h2>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
              <div className="space-y-2">
                {MODES.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      mode === m.value ? "border-brand-500 bg-brand-50" : "border-gray-200 hover:border-brand-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={m.value}
                      checked={mode === m.value}
                      onChange={() => setMode(m.value)}
                      className="mt-0.5 accent-brand-600"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Globe className="w-3.5 h-3.5 inline mr-1" />
                  Source Language
                </label>
                <select
                  value={sourceLang}
                  onChange={(e) => setSourceLang(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Zap className="w-3.5 h-3.5 inline mr-1" />
                  Target Language
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => startConversationMutation.mutate()}
              disabled={startConversationMutation.isPending}
              className="w-full py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {startConversationMutation.isPending ? "Starting..." : "Start Conversation"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-gray-700 capitalize">{mode} mode</span>
            <span className="text-sm text-gray-400">
              {LANGUAGES.find((l) => l.code === sourceLang)?.name} →{" "}
              {LANGUAGES.find((l) => l.code === targetLang)?.name}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Mic className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">Press the mic or type to begin</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-brand-600 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-900 rounded-tl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  {msg.audioBase64 && msg.role === "assistant" && (
                    <button
                      onClick={() => playAudio(msg.audioBase64!)}
                      className="flex items-center gap-1 mt-2 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <Volume2 className="w-3 h-3" />
                      Play audio
                    </button>
                  )}
                  <p className={`text-xs mt-1 ${msg.role === "user" ? "text-brand-200" : "text-gray-400"}`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isSending}
                className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  isRecording
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-gray-100 text-gray-600 hover:bg-brand-100 hover:text-brand-600"
                } disabled:opacity-50`}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendText()}
                placeholder="Type a message or hold mic to record..."
                disabled={isSending}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              />
              <button
                onClick={sendText}
                disabled={!textInput.trim() || isSending}
                className="flex-shrink-0 w-11 h-11 bg-brand-600 text-white rounded-full flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-2">Hold mic button to record voice input</p>
          </div>
        </div>
      )}
    </div>
  );
}
