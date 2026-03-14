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
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", tour: "sidebar-dashboard" },
  { href: "/dashboard/conversations", icon: MessageSquare, label: "Conversations", tour: "sidebar-conversations" },
  { href: "/dashboard/knowledge", icon: BookOpen, label: "Knowledge Bases", tour: "sidebar-knowledge" },
  { href: "/dashboard/voice-clones", icon: Mic, label: "Voice Clones", tour: "sidebar-voice-clones" },
  { href: "/dashboard/integrations", icon: Puzzle, label: "Integrations", tour: "sidebar-integrations" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics", tour: "sidebar-analytics" },
  { href: "/dashboard/api-keys", icon: Key, label: "API Keys", tour: "sidebar-api-keys" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings", tour: "sidebar-settings" },
  { href: "/dashboard/settings/billing", icon: CreditCard, label: "Billing", tour: undefined },
  { href: "/dashboard/help", icon: HelpCircle, label: "Help & Guides", tour: undefined },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Mic className="text-white w-4 h-4" />
          </div>
          <span className="text-lg font-bold text-gray-900">VaaniAI</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, tour }) => (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-brand-700">
              {user?.full_name?.[0]?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
