"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mic, ArrowRight, Globe, Zap, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { parseJwt } from "@/lib/jwt";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

const FEATURES = [
  { icon: Globe, title: "11 Indian Languages", desc: "Hindi, Tamil, Telugu, Kannada, Malayalam and more" },
  { icon: Zap, title: "Real-time AI Voice", desc: "Sub-500ms response latency" },
  { icon: Shield, title: "Enterprise-grade", desc: "SOC 2 ready, data residency in India" },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const { data: tokenData } = await api.auth.login(data.email, data.password);
      const payload = parseJwt(tokenData.access_token);
      login(tokenData.access_token, tokenData.refresh_token, {
        email: data.email,
        full_name: (payload.full_name as string) || data.email,
        role: (payload.role as string) || "viewer",
      }, payload.tenant_id as string);
      router.push("/dashboard");
    } catch {
      toast.error("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — dark hero panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-hero-gradient relative overflow-hidden flex-col justify-between p-12">
        {/* Mesh overlay */}
        <div className="absolute inset-0 bg-mesh-gradient" />

        {/* Glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 bg-violet-600/15 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center shadow-glow-brand">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white text-lg font-bold tracking-tight">Bolo</span>
              <div className="text-[10px] text-white/40 font-medium tracking-widest uppercase">Platform</div>
            </div>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Voice AI for<br />
              <span className="text-gradient bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
                Bharat
              </span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Deploy intelligent voice assistants that speak your customers&apos; language — across every Indian language and dialect.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-tight">{title}</p>
                  <p className="text-white/40 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex gap-2 flex-wrap">
            {["Hindi", "Tamil", "Telugu", "Bengali", "Gujarati", "Marathi", "Punjabi"].map((lang) => (
              <span key={lang} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-full text-[11px] text-white/50 font-medium">
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc] px-6 py-12">
        <div className="w-full max-w-[380px] animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Bolo</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="text-sm text-slate-500 mt-1">Sign in to your workspace</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card-md p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Email address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="input-field"
                  placeholder="you@company.com"
                  autoComplete="email"
                />
                {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Password
                  </label>
                  <a href="#" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  {...register("password")}
                  className="input-field"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-600 font-semibold hover:text-brand-700">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
