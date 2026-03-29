"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { SupportChat } from "@/components/support/SupportChat";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push("/login");
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: "#0a0700" }}>
        <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2px solid rgba(255,107,0,0.2)", borderTopColor: "#FF6B00" }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-[#070d1a]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <SupportChat />
    </div>
  );
}
