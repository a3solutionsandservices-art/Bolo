"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessageSquare, Mic, Languages, Zap } from "lucide-react";

interface OverviewData {
  total_conversations: number;
  completed_conversations: number;
  total_messages: number;
  avg_response_latency_ms: number;
  usage: {
    stt?: { total: number };
    tts?: { total: number };
    translation?: { total: number };
  };
}

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["analytics-overview"],
    queryFn: () => api.analytics.overview(30).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Last 30 days overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Conversations"
          value={data?.total_conversations ?? 0}
          subtitle={`${data?.completed_conversations ?? 0} completed`}
          icon={MessageSquare}
          color="bg-brand-600"
        />
        <StatCard
          title="Total Messages"
          value={data?.total_messages ?? 0}
          icon={Mic}
          color="bg-violet-600"
        />
        <StatCard
          title="Avg Response Time"
          value={`${Math.round(data?.avg_response_latency_ms ?? 0)}ms`}
          icon={Zap}
          color="bg-amber-500"
        />
        <StatCard
          title="Translation Chars"
          value={(data?.usage?.translation?.total ?? 0).toLocaleString()}
          subtitle="this period"
          icon={Languages}
          color="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Summary</h2>
          <div className="space-y-4">
            {[
              { label: "STT Minutes", value: (data?.usage?.stt?.total ?? 0).toFixed(1), unit: "min" },
              { label: "TTS Characters", value: (data?.usage?.tts?.total ?? 0).toLocaleString(), unit: "chars" },
              { label: "Translation Characters", value: (data?.usage?.translation?.total ?? 0).toLocaleString(), unit: "chars" },
            ].map(({ label, value, unit }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-600">{label}</span>
                <span className="text-sm font-medium text-gray-900">{value} <span className="text-gray-400 font-normal">{unit}</span></span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              { label: "Start a new conversation", href: "/dashboard/conversations/new", color: "bg-brand-600" },
              { label: "Upload knowledge documents", href: "/dashboard/knowledge", color: "bg-violet-600" },
              { label: "View analytics", href: "/dashboard/analytics", color: "bg-emerald-600" },
              { label: "Get embed code", href: "/dashboard/settings", color: "bg-amber-500" },
            ].map(({ label, href, color }) => (
              <a
                key={href}
                href={href}
                className={`block w-full px-4 py-3 ${color} text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity text-center`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
