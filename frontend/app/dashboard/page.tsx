"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessageSquare, Mic, Languages, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { ProductTour, TourLauncher } from "@/components/ui/product-tour";
import { DASHBOARD_TOUR } from "@/lib/tour-steps";
import Link from "next/link";

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

function StatCard({ title, value, subtitle, icon: Icon, gradient, iconBg }: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  iconBg: string;
}) {
  return (
    <div className="relative bg-white rounded-2xl p-6 border border-slate-200/60 shadow-card hover:shadow-card-md transition-shadow duration-200 overflow-hidden group">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${gradient}`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <TrendingUp className="w-4 h-4 text-slate-300" />
        </div>
        <p className="text-[13px] font-medium text-slate-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>}
      </div>
    </div>
  );
}

const TOUR_KEY = "vaaniai_tour_done";

export default function DashboardPage() {
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(TOUR_KEY)) {
      const t = setTimeout(() => setTourActive(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const finishTour = () => {
    localStorage.setItem(TOUR_KEY, "1");
    setTourActive(false);
  };

  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ["analytics-overview"],
    queryFn: () => api.analytics.overview(30).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded-lg w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-slate-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {tourActive && (
        <ProductTour
          steps={DASHBOARD_TOUR}
          onFinish={finishTour}
          onSkip={finishTour}
        />
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">Last 30 days performance</p>
        </div>
        <TourLauncher onStart={() => setTourActive(true)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Conversations"
          value={data?.total_conversations ?? 0}
          subtitle={`${data?.completed_conversations ?? 0} completed`}
          icon={MessageSquare}
          gradient="bg-gradient-to-br from-brand-50/80 to-transparent"
          iconBg="bg-brand-600"
        />
        <StatCard
          title="Total Messages"
          value={data?.total_messages ?? 0}
          subtitle="voice interactions"
          icon={Mic}
          gradient="bg-gradient-to-br from-violet-50/80 to-transparent"
          iconBg="bg-violet-600"
        />
        <StatCard
          title="Avg Response Time"
          value={`${Math.round(data?.avg_response_latency_ms ?? 0)}ms`}
          subtitle="p50 latency"
          icon={Zap}
          gradient="bg-gradient-to-br from-amber-50/80 to-transparent"
          iconBg="bg-amber-500"
        />
        <StatCard
          title="Translation Chars"
          value={(data?.usage?.translation?.total ?? 0).toLocaleString()}
          subtitle="this period"
          icon={Languages}
          gradient="bg-gradient-to-br from-emerald-50/80 to-transparent"
          iconBg="bg-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/60 shadow-card">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-[15px] font-semibold text-slate-900">Usage Summary</h2>
            <p className="text-xs text-slate-400 mt-0.5">AI operations billed this period</p>
          </div>
          <div className="px-6 py-4 divide-y divide-slate-50">
            {[
              {
                label: "Speech-to-Text",
                value: (data?.usage?.stt?.total ?? 0).toFixed(1),
                unit: "min",
                pct: Math.min(100, ((data?.usage?.stt?.total ?? 0) / 60) * 100),
                color: "bg-brand-500",
              },
              {
                label: "Text-to-Speech",
                value: (data?.usage?.tts?.total ?? 0).toLocaleString(),
                unit: "chars",
                pct: Math.min(100, ((data?.usage?.tts?.total ?? 0) / 50000) * 100),
                color: "bg-violet-500",
              },
              {
                label: "Translation",
                value: (data?.usage?.translation?.total ?? 0).toLocaleString(),
                unit: "chars",
                pct: Math.min(100, ((data?.usage?.translation?.total ?? 0) / 100000) * 100),
                color: "bg-emerald-500",
              },
            ].map(({ label, value, unit, pct, color }) => (
              <div key={label} className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">{label}</span>
                  <span className="text-sm font-semibold text-slate-900">
                    {value} <span className="text-xs text-slate-400 font-normal">{unit}</span>
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 shadow-card"
          data-tour="quick-actions"
        >
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-[15px] font-semibold text-slate-900">Quick Actions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Jump to the most common tasks</p>
          </div>
          <div className="px-6 py-4 space-y-2">
            {[
              {
                label: "Build a widget integration",
                href: "/dashboard/integrations",
                iconBg: "bg-brand-100",
                iconColor: "text-brand-600",
                description: "Go live in 3 minutes",
              },
              {
                label: "Upload knowledge documents",
                href: "/dashboard/knowledge",
                iconBg: "bg-violet-100",
                iconColor: "text-violet-600",
                description: "Train your AI assistant",
              },
              {
                label: "View analytics",
                href: "/dashboard/analytics",
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                description: "Usage & performance data",
              },
              {
                label: "Start a conversation",
                href: "/dashboard/conversations",
                iconBg: "bg-amber-100",
                iconColor: "text-amber-600",
                description: "Test your voice widget",
              },
            ].map(({ label, href, iconBg, iconColor, description }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                  <ArrowRight className={`w-4 h-4 ${iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 leading-tight">{label}</p>
                  <p className="text-xs text-slate-400 leading-tight mt-0.5">{description}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
