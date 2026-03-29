"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MessageSquare, Mic, Languages, Zap, ArrowRight, Radio, BookOpen, BarChart3, Code2 } from "lucide-react";
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

function StatCard({ title, value, sub, icon: Icon, accent }: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <div className="relative rounded-2xl p-5 border border-white/[0.07] bg-white/[0.03] overflow-hidden group hover:bg-white/[0.05] transition-all duration-200">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${accent}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="w-9 h-9 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
            <Icon className="w-4 h-4 text-white/50" />
          </div>
        </div>
        <p className="text-[11px] font-medium text-white/35 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-bold text-white tracking-tight font-mono">{value}</p>
        {sub && <p className="text-xs text-white/25 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

const TOUR_KEY = "bolo_tour_done";

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
          <div className="h-8 bg-white/[0.06] rounded-lg w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-white/[0.04] rounded-2xl" />
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
          <h1 className="font-serif text-3xl text-white tracking-tight">Overview</h1>
          <p className="text-sm text-white/30 mt-0.5 font-mono">last 30 days</p>
        </div>
        <TourLauncher onStart={() => setTourActive(true)} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Conversations"
          value={data?.total_conversations ?? 0}
          sub={`${data?.completed_conversations ?? 0} completed`}
          icon={MessageSquare}
          accent="from-brand-600/10 to-transparent"
        />
        <StatCard
          title="Messages"
          value={data?.total_messages ?? 0}
          sub="voice interactions"
          icon={Mic}
          accent="from-violet-600/10 to-transparent"
        />
        <StatCard
          title="Avg Latency"
          value={`${Math.round(data?.avg_response_latency_ms ?? 0)}ms`}
          sub="p50 response time"
          icon={Zap}
          accent="from-fire-600/10 to-transparent"
        />
        <StatCard
          title="Translation"
          value={(data?.usage?.translation?.total ?? 0).toLocaleString()}
          sub="characters this period"
          icon={Languages}
          accent="from-emerald-600/10 to-transparent"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Usage breakdown */}
        <div className="lg:col-span-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">AI Usage</h2>
            <p className="text-[11px] text-white/25 mt-0.5 font-mono">operations billed this period</p>
          </div>
          <div className="px-6 py-4 divide-y divide-white/[0.04]">
            {[
              {
                label: "Speech-to-Text",
                value: (data?.usage?.stt?.total ?? 0).toFixed(1),
                unit: "min",
                pct: Math.min(100, ((data?.usage?.stt?.total ?? 0) / 60) * 100),
                color: "bg-brand-500",
                glow: "shadow-brand-500/30",
              },
              {
                label: "Text-to-Speech",
                value: (data?.usage?.tts?.total ?? 0).toLocaleString(),
                unit: "chars",
                pct: Math.min(100, ((data?.usage?.tts?.total ?? 0) / 50000) * 100),
                color: "bg-fire-500",
                glow: "shadow-fire-500/30",
              },
              {
                label: "Translation",
                value: (data?.usage?.translation?.total ?? 0).toLocaleString(),
                unit: "chars",
                pct: Math.min(100, ((data?.usage?.translation?.total ?? 0) / 100000) * 100),
                color: "bg-emerald-500",
                glow: "shadow-emerald-500/30",
              },
            ].map(({ label, value, unit, pct, color }) => (
              <div key={label} className="py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/55">{label}</span>
                  <span className="font-mono text-sm text-white font-semibold">
                    {value} <span className="text-xs text-white/30 font-normal">{unit}</span>
                  </span>
                </div>
                <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.03]" data-tour="quick-actions">
          <div className="px-6 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white">Quick Actions</h2>
            <p className="text-[11px] text-white/25 mt-0.5">Jump to common tasks</p>
          </div>
          <div className="px-4 py-3 space-y-1">
            {[
              {
                label: "Open Playground",
                desc: "Test voice & translations live",
                href: "/dashboard/conversations/new",
                icon: Radio,
                color: "text-fire-400",
                bg: "bg-fire-500/10",
              },
              {
                label: "Build a widget",
                desc: "Go live in 3 minutes",
                href: "/dashboard/integrations",
                icon: Code2,
                color: "text-brand-400",
                bg: "bg-brand-500/10",
              },
              {
                label: "Upload knowledge",
                desc: "Train your AI assistant",
                href: "/dashboard/knowledge",
                icon: BookOpen,
                color: "text-violet-400",
                bg: "bg-violet-500/10",
              },
              {
                label: "View analytics",
                desc: "Usage & performance data",
                href: "/dashboard/analytics",
                icon: BarChart3,
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
            ].map(({ label, desc, href, icon: Icon, color, bg }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
              >
                <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 leading-tight group-hover:text-white transition-colors">{label}</p>
                  <p className="text-[11px] text-white/30 leading-tight mt-0.5">{desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white/40 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
