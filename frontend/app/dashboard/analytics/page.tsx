"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { useState } from "react";

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe", "#f5f3ff"];
const SENTIMENT_COLORS: Record<string, string> = {
  positive: "#10b981",
  negative: "#ef4444",
  neutral: "#6b7280",
  mixed: "#f59e0b",
};

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

interface DailyConversation { date: string; count: number }
interface LanguagePair { source: string; source_name: string; target: string; target_name: string; count: number }
interface SentimentData { [key: string]: number }
interface LatencyEntry { hour: string; avg_ms: number; min_ms: number; max_ms: number }

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);

  const { data: conversationData } = useQuery({
    queryKey: ["analytics-conversations", days],
    queryFn: () => api.analytics.conversations(days).then((r) => r.data),
  });

  const { data: languageData } = useQuery({
    queryKey: ["analytics-languages", days],
    queryFn: () => api.analytics.languages(days).then((r) => r.data),
  });

  const { data: latencyData } = useQuery({
    queryKey: ["analytics-latency", days],
    queryFn: () => api.analytics.latency(days).then((r) => r.data),
  });

  const daily: DailyConversation[] = conversationData?.daily || [];
  const sentimentRaw: SentimentData = conversationData?.sentiment_distribution || {};
  const sentimentData = Object.entries(sentimentRaw).map(([name, value]) => ({ name, value }));
  const languagePairs: LanguagePair[] = languageData?.language_pairs?.slice(0, 8) || [];
  const latencyPoints: LatencyEntry[] = (latencyData?.hourly || []).slice(-48);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Platform usage and performance metrics</p>
        </div>
        <div className="flex gap-2">
          {PERIOD_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDays(value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                days === value
                  ? "bg-brand-600 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Conversations</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={sentimentData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {sentimentData.map((entry) => (
                  <Cell key={entry.name} fill={SENTIMENT_COLORS[entry.name] || "#6366f1"} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Language Pairs</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={languagePairs} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey={(d: LanguagePair) => `${d.source_name} → ${d.target_name}`}
                tick={{ fontSize: 11 }}
                width={120}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Response Latency (ms)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={latencyPoints}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(11, 16)} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip labelFormatter={(v: string) => v.slice(0, 16)} />
              <Legend />
              <Line type="monotone" dataKey="avg_ms" stroke="#6366f1" strokeWidth={2} dot={false} name="Avg" />
              <Line type="monotone" dataKey="min_ms" stroke="#10b981" strokeWidth={1} dot={false} strokeDasharray="4 2" name="Min" />
              <Line type="monotone" dataKey="max_ms" stroke="#f59e0b" strokeWidth={1} dot={false} strokeDasharray="4 2" name="Max" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
