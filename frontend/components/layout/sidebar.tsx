"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  BarChart3,
  CreditCard,
  Settings,
  Key,
  Mic,
  LogOut,
  Puzzle,
  HelpCircle,
  Store,
  TrendingUp,
  Lock,
  Radio,
  Zap,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { usePlan } from "@/lib/use-plan";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: string;
  badgeType?: "new" | "live" | "pro";
  hint?: string;
  exact?: boolean;
  requiresPaid?: boolean;
  tour?: string;
}

interface NavGroup {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Create",
    items: [
      {
        href: "/dashboard",
        icon: LayoutDashboard,
        label: "Overview",
        hint: "Usage & metrics",
        exact: true,
        tour: "sidebar-dashboard",
      },
      {
        href: "/dashboard/conversations",
        icon: MessageSquare,
        label: "Conversations",
        hint: "Voice & chat sessions",
        badge: "Live",
        badgeType: "live",
        tour: "sidebar-conversations",
      },
      {
        href: "/dashboard/conversations/new",
        icon: Radio,
        label: "Playground",
        hint: "Test voice & translation",
        badge: "Try",
        badgeType: "new",
      },
      {
        href: "/dashboard/knowledge",
        icon: BookOpen,
        label: "Knowledge Bases",
        hint: "Upload your docs & FAQs",
        tour: "sidebar-knowledge",
      },
    ],
  },
  {
    label: "Build",
    items: [
      {
        href: "/dashboard/integrations",
        icon: Puzzle,
        label: "Integrations",
        hint: "Widget, API, WhatsApp",
        badge: "New",
        badgeType: "new",
        tour: "sidebar-integrations",
      },
      {
        href: "/dashboard/voice-clones",
        icon: Mic,
        label: "Voice Clones",
        hint: "Clone & customise voices",
        requiresPaid: true,
        badge: "Pro",
        badgeType: "pro",
        tour: "sidebar-voice-clones",
      },
      {
        href: "/dashboard/marketplace",
        icon: Store,
        label: "Voice Marketplace",
        hint: "License celebrity voices",
        requiresPaid: true,
        badge: "Pro",
        badgeType: "pro",
        tour: "sidebar-marketplace",
      },
    ],
  },
  {
    label: "Analyse",
    items: [
      {
        href: "/dashboard/analytics",
        icon: BarChart3,
        label: "Analytics",
        hint: "Sentiment & usage data",
        tour: "sidebar-analytics",
      },
      {
        href: "/dashboard/api-keys",
        icon: Key,
        label: "API Keys",
        hint: "Manage access keys",
        tour: "sidebar-api-keys",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        href: "/dashboard/settings",
        icon: Settings,
        label: "Settings",
        hint: "Workspace & branding",
        tour: "sidebar-settings",
      },
      {
        href: "/dashboard/settings/billing",
        icon: CreditCard,
        label: "Billing",
        hint: "Plans & usage",
      },
      {
        href: "/dashboard/help",
        icon: HelpCircle,
        label: "Help & Guides",
        hint: "How-to articles",
      },
      {
        href: "/dashboard/help/features",
        icon: TrendingUp,
        label: "Feature Guide",
        hint: "What you can build",
      },
    ],
  },
];

const INDIAN_LANGS = ["हिं", "த", "తె", "বাং", "ಕ", "മ", "ਪੰ"];

function BadgeDot({ type }: { type: "new" | "live" | "pro" }) {
  const styles = {
    new: "bg-saffron-500/20 text-saffron-400",
    live: "bg-peacock-500/20 text-peacock-400",
    pro: "bg-turmeric-500/20 text-turmeric-500",
  };
  const labels = { new: "New", live: "Live", pro: "Pro" };
  return (
    <span className={`ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide shrink-0 ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const { isStarter } = usePlan();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <aside className="w-[220px] h-screen flex flex-col shrink-0 border-r" style={{
      background: "linear-gradient(180deg, #0f0c08 0%, #0d0a05 100%)",
      borderColor: "rgba(42, 34, 24, 0.8)",
    }}>

      {/* ── Logo ── */}
      <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(42, 34, 24, 0.8)" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          {/* Saffron logo mark */}
          <div className="relative w-8 h-8 shrink-0">
            <div className="absolute inset-0 rounded-xl opacity-80 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, #FF6B00 0%, #fbbf24 100%)", boxShadow: "0 0 16px rgba(255,107,0,0.4)" }} />
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white drop-shadow" />
            </div>
          </div>
          <div>
            <span className="text-[16px] font-bold text-white tracking-tight font-serif">Bolo</span>
            <div className="text-[9px] font-semibold tracking-widest uppercase leading-none" style={{ color: "rgba(255,107,0,0.6)" }}>
              भारत की आवाज़
            </div>
          </div>
        </Link>
      </div>

      {/* ── Language strip ── */}
      <div className="px-3 py-2 border-b" style={{ borderColor: "rgba(42, 34, 24, 0.5)" }}>
        <div className="flex items-center gap-1 flex-wrap">
          {INDIAN_LANGS.map((lang) => (
            <span key={lang} className="lang-pill text-[10px] px-1.5 py-0.5">
              {lang}
            </span>
          ))}
          <span className="text-[9px] ml-auto" style={{ color: "rgba(255,107,0,0.4)" }}>+4</span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto sidebar-scroll space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-2 mb-1 flex items-center gap-1">
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(120,113,108,0.7)" }}>
                {group.label}
              </span>
              <div className="flex-1 h-px ml-1" style={{ background: "rgba(42,34,24,0.6)" }} />
            </div>

            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, badge, badgeType, hint, exact, requiresPaid, tour }) => {
                const active = isActive(href, exact);
                const locked = requiresPaid && isStarter;
                const linkHref = locked ? "/dashboard/settings/billing" : href;

                return (
                  <Link
                    key={href}
                    href={linkHref}
                    data-tour={tour}
                    title={hint}
                    className={clsx(
                      "group flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                      active && !locked
                        ? "text-white"
                        : "hover:text-white/80",
                      locked && "opacity-55"
                    )}
                    style={active && !locked ? {
                      background: "rgba(255, 107, 0, 0.12)",
                      borderLeft: "2px solid rgba(255,107,0,0.6)",
                    } : {
                      borderLeft: "2px solid transparent",
                    }}
                  >
                    <Icon
                      className={clsx(
                        "w-4 h-4 shrink-0 transition-colors",
                        active && !locked
                          ? "text-saffron-400"
                          : "text-sidebar-text group-hover:text-white/60"
                      )}
                    />
                    <span className="flex-1 truncate" style={{ color: active && !locked ? "#fafaf9" : "rgba(120,113,108,0.9)" }}>
                      {label}
                    </span>
                    {locked ? (
                      <Lock className="w-3 h-3 shrink-0" style={{ color: "rgba(120,113,108,0.5)" }} />
                    ) : badge && badgeType ? (
                      <BadgeDot type={badgeType} />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Quick action ── */}
      <div className="px-2 pb-2">
        <Link
          href="/dashboard/conversations/new"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl w-full transition-all duration-150 group"
          style={{
            background: "linear-gradient(135deg, rgba(255,107,0,0.15) 0%, rgba(251,191,36,0.08) 100%)",
            border: "1px solid rgba(255,107,0,0.2)",
          }}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,0,0.2)" }}>
            <Zap className="w-3.5 h-3.5 text-saffron-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/80 leading-tight truncate">Open Playground</p>
            <p className="text-[10px] leading-tight truncate" style={{ color: "rgba(255,107,0,0.5)" }}>Test voice live</p>
          </div>
        </Link>
      </div>

      {/* ── User ── */}
      <div className="px-2 py-3 border-t" style={{ borderColor: "rgba(42, 34, 24, 0.8)" }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-white text-xs"
            style={{ background: "linear-gradient(135deg, #FF6B00 0%, #fbbf24 100%)", boxShadow: "0 2px 8px rgba(255,107,0,0.3)" }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">{user?.full_name || "User"}</p>
            <p className="text-[10px] truncate leading-tight" style={{ color: "rgba(120,113,108,0.7)" }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] rounded-lg transition-all duration-150 group"
          style={{ color: "rgba(120,113,108,0.7)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "#f87171"; (e.currentTarget as HTMLButtonElement).style.background = "rgba(239,68,68,0.06)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(120,113,108,0.7)"; (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
