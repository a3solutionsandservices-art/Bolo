"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ArrowLeft, Download, Globe, Clock, MessageSquare, Volume2 } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useState } from "react";

const SENTIMENT_BADGE: Record<string, string> = {
  positive: "bg-emerald-50 text-emerald-700",
  negative: "bg-red-50 text-red-700",
  neutral: "bg-gray-100 text-white/60",
  mixed: "bg-amber-50 text-amber-700",
};

const INTENT_COLORS: Record<string, string> = {
  question: "bg-blue-50 text-blue-700",
  request: "bg-violet-50 text-violet-700",
  complaint: "bg-red-50 text-red-700",
  greeting: "bg-emerald-50 text-emerald-700",
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content_original: string;
  content_translated: string | null;
  detected_language: string | null;
  sentiment: string | null;
  intent: string | null;
  audio_url: string | null;
  rag_sources: Array<{ content: string; score: number }> | null;
  created_at: string;
}

interface ConversationDetail {
  id: string;
  session_id: string;
  mode: string;
  status: string;
  source_language: string;
  target_language: string;
  overall_sentiment: string | null;
  overall_intent: string | null;
  total_duration_seconds: number;
  created_at: string;
  ended_at: string | null;
  messages: Message[];
  messages_skip: number;
  messages_limit: number;
}

export default function ConversationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [skip, setSkip] = useState(0);
  const LIMIT = 50;

  const { data: conv, isLoading } = useQuery<ConversationDetail>({
    queryKey: ["conversation", id, skip],
    queryFn: () =>
      api.conversations.get(id).then((r) => r.data),
    enabled: !!id,
  });

  const downloadTranscript = async () => {
    const { data } = await api.conversations.getTranscript(id, "text");
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcript-${id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (!conv) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/45">Conversation not found</p>
        <button onClick={() => router.back()} className="mt-4 text-brand-600 text-sm hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/conversations")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Session {conv.session_id.slice(0, 8)}...
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {format(new Date(conv.created_at), "MMM d, yyyy · h:mm a")}
            </p>
          </div>
        </div>
        <button
          onClick={downloadTranscript}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-white/[0.04]"
        >
          <Download className="w-4 h-4" />
          Download Transcript
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          {
            icon: MessageSquare,
            label: "Mode",
            value: conv.mode,
            color: "text-brand-600 bg-brand-50",
          },
          {
            icon: Globe,
            label: "Languages",
            value: `${conv.source_language.toUpperCase()} → ${conv.target_language.toUpperCase()}`,
            color: "text-violet-600 bg-violet-50",
          },
          {
            icon: Clock,
            label: "Duration",
            value: `${Math.round(conv.total_duration_seconds)}s`,
            color: "text-amber-600 bg-amber-50",
          },
          {
            icon: MessageSquare,
            label: "Messages",
            value: conv.messages.length,
            color: "text-emerald-600 bg-emerald-50",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-white/35">{label}</p>
            <p className="text-sm font-semibold text-white capitalize mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {(conv.overall_sentiment || conv.overall_intent) && (
        <div className="flex gap-3 mb-6">
          {conv.overall_sentiment && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${SENTIMENT_BADGE[conv.overall_sentiment] || "bg-gray-100 text-white/60"}`}>
              Sentiment: {conv.overall_sentiment}
            </span>
          )}
          {conv.overall_intent && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${INTENT_COLORS[conv.overall_intent] || "bg-gray-100 text-white/60"}`}>
              Intent: {conv.overall_intent}
            </span>
          )}
        </div>
      )}

      <div className="bg-white/[0.04] rounded-xl border border-white/[0.07] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] bg-gray-50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Conversation Transcript</h2>
          <span className="text-sm text-white/45">{conv.messages.length} messages</span>
        </div>

        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
          {conv.messages.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No messages in this conversation</p>
          ) : (
            conv.messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-brand-600 text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-900 rounded-tl-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-medium capitalize ${msg.role === "user" ? "text-brand-200" : "text-white/45"}`}>
                      {msg.role}
                    </span>
                    {msg.detected_language && (
                      <span className={`text-xs ${msg.role === "user" ? "text-brand-200" : "text-white/35"}`}>
                        · {msg.detected_language.toUpperCase()}
                      </span>
                    )}
                    {msg.sentiment && (
                      <span className="text-xs px-1.5 py-0.5 bg-white/20 rounded">{msg.sentiment}</span>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed">{msg.content_original}</p>

                  {msg.content_translated && msg.content_translated !== msg.content_original && (
                    <p className={`text-xs mt-2 italic ${msg.role === "user" ? "text-brand-200" : "text-white/45"}`}>
                      {msg.content_translated}
                    </p>
                  )}

                  {msg.audio_url && (
                    <a
                      href={msg.audio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 mt-2 text-xs ${msg.role === "user" ? "text-brand-200 hover:text-white" : "text-gray-500 hover:text-white/75"}`}
                    >
                      <Volume2 className="w-3 h-3" />
                      Listen
                    </a>
                  )}

                  {msg.rag_sources && msg.rag_sources.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-white/30 cursor-pointer hover:text-white/60">
                        {msg.rag_sources.length} source{msg.rag_sources.length > 1 ? "s" : ""}
                      </summary>
                      <div className="mt-1 space-y-1">
                        {msg.rag_sources.slice(0, 3).map((src, i) => (
                          <p key={i} className="text-xs text-white/35 bg-white rounded px-2 py-1 line-clamp-2">
                            {src.content.slice(0, 120)}...
                          </p>
                        ))}
                      </div>
                    </details>
                  )}

                  <p className={`text-xs mt-2 ${msg.role === "user" ? "text-brand-200" : "text-white/35"}`}>
                    {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {conv.messages.length >= LIMIT && (
          <div className="px-6 py-3 border-t border-gray-100 flex justify-between items-center">
            <button
              onClick={() => setSkip(Math.max(0, skip - LIMIT))}
              disabled={skip === 0}
              className="px-3 py-1.5 text-sm text-gray-600 border rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-white/45">
              Messages {skip + 1}–{skip + conv.messages.length}
            </span>
            <button
              onClick={() => setSkip(skip + LIMIT)}
              disabled={conv.messages.length < LIMIT}
              className="px-3 py-1.5 text-sm text-gray-600 border rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
