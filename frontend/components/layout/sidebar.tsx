"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tour?: string;
  exact?: boolean;
  requiresPaid?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

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
  ChevronRight,
  Store,
  TrendingUp,
  Lock,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { usePlan } from "@/lib/use-plan";

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Overview", tour: "sidebar-dashboard", exact: true },
      { href: "/dashboard/conversations", icon: MessageSquare, label: "Conversations", tour: "sidebar-conversations" },
      { href: "/dashboard/knowledge", icon: BookOpen, label: "Knowledge Bases", tour: "sidebar-knowledge" },
      { href: "/dashboard/voice-clones", icon: Mic, label: "Voice Clones", tour: "sidebar-voice-clones", requiresPaid: true },
    ],
  },
  {
    label: "Deploy",
    items: [
      { href: "/dashboard/integrations", icon: Puzzle, label: "Integrations", tour: "sidebar-integrations" },
      { href: "/dashboard/marketplace", icon: Store, label: "Voice Marketplace", tour: "sidebar-marketplace", requiresPaid: true },
      { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics", tour: "sidebar-analytics" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/api-keys", icon: Key, label: "API Keys", tour: "sidebar-api-keys" },
      { href: "/dashboard/settings", icon: Settings, label: "Settings", tour: "sidebar-settings" },
      { href: "/dashboard/settings/billing", icon: CreditCard, label: "Billing", tour: undefined },
      { href: "/dashboard/help", icon: HelpCircle, label: "Help & Guides", tour: undefined },
      { href: "/dashboard/help/features", icon: TrendingUp, label: "Feature Guide", tour: undefined },
    ],
  },
];

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
    <aside className="w-60 h-screen bg-sidebar-gradient flex flex-col shrink-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 shrink-0">
            <div className="absolute inset-0 bg-brand-gradient rounded-lg shadow-glow-brand opacity-80 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Mic className="w-4 h-4 text-white drop-shadow" />
            </div>
          </div>
          <div>
            <span className="text-[15px] font-bold text-white tracking-tight">Bolo</span>
            <div className="text-[10px] text-sidebar-text font-medium tracking-wider uppercase leading-none">Platform</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto sidebar-scroll">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-2 mb-1.5 text-[10px] font-semibold text-sidebar-text uppercase tracking-widest">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, tour, exact, requiresPaid }) => {
                const active = isActive(href, exact);
                const locked = requiresPaid && isStarter;
                const linkHref = locked ? "/dashboard/settings/billing" : href;
                return (
                  <Link
                    key={href}
                    href={linkHref}
                    data-tour={tour}
                    title={locked ? `${label} requires Growth plan` : undefined}
                    className={clsx(
                      "group flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                      active && !locked
                        ? "bg-sidebar-active-bg text-sidebar-text-active"
                        : "text-sidebar-text hover:bg-white/[0.04] hover:text-sidebar-text-hover",
                      locked && "opacity-60"
                    )}
                  >
                    <Icon
                      className={clsx(
                        "w-4 h-4 shrink-0 transition-colors",
                        active && !locked ? "text-brand-400" : "text-sidebar-text group-hover:text-sidebar-text-hover"
                      )}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {locked ? (
                      <Lock className="w-3 h-3 text-sidebar-text shrink-0" />
                    ) : active ? (
                      <ChevronRight className="w-3.5 h-3.5 text-brand-400/60 shrink-0" />
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-sidebar-text-active truncate leading-tight">{user?.full_name || "User"}</p>
            <p className="text-[11px] text-sidebar-text truncate leading-tight">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-sidebar-text hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-all duration-150 group"
        >
          <LogOut className="w-4 h-4 group-hover:text-red-400 transition-colors" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
