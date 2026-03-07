"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { MessageSquare, Clock, Globe } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  session_id: string;
  mode: string;
  status: string;
  source_language: string;
  target_language: string;
  total_duration_seconds: number;
  overall_sentiment: string | null;
  created_at: string;
}

const SENTIMENT_BADGE: Record<string, string> = {
  positive: "bg-emerald-50 text-emerald-700",
  negative: "bg-red-50 text-red-700",
  neutral: "bg-gray-100 text-gray-600",
  mixed: "bg-amber-50 text-amber-700",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  abandoned: "bg-gray-100 text-gray-600",
};

export default function ConversationsPage() {
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["conversations", page],
    queryFn: () => api.conversations.list(page * PAGE_SIZE, PAGE_SIZE).then((r) => r.data),
  });

  const conversations: Conversation[] = data || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
          <p className="text-gray-500 mt-1">Voice sessions and chat history</p>
        </div>
        <a
          href="/dashboard/conversations/new"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          New Conversation
        </a>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="text-center py-24">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No conversations yet</p>
          <a href="/dashboard/conversations/new" className="mt-4 inline-block px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
            Start your first conversation
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Session", "Mode", "Languages", "Duration", "Sentiment", "Status", "Started"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {conversations.map((conv) => (
                <tr key={conv.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-4 py-3">
                    <a href={`/dashboard/conversations/${conv.id}`} className="text-sm font-medium text-brand-600 hover:underline">
                      {conv.session_id.slice(0, 8)}...
                    </a>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 capitalize">{conv.mode}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Globe className="w-3.5 h-3.5" />
                      {conv.source_language.toUpperCase()} → {conv.target_language.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.round(conv.total_duration_seconds)}s
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {conv.overall_sentiment ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SENTIMENT_BADGE[conv.overall_sentiment] || "bg-gray-100 text-gray-600"}`}>
                        {conv.overall_sentiment}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[conv.status] || "bg-gray-100 text-gray-600"}`}>
                      {conv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(conv.created_at), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
            <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-3 py-1.5 text-sm text-gray-600 border rounded-lg disabled:opacity-40">Previous</button>
            <span className="text-sm text-gray-500">Page {page + 1}</span>
            <button onClick={() => setPage(page + 1)} disabled={conversations.length < PAGE_SIZE} className="px-3 py-1.5 text-sm text-gray-600 border rounded-lg disabled:opacity-40">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
