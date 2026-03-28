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
    <div className="min-h-screen flex bg-[#050a14]">
      {/* Left — dark editorial panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between p-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_40%,rgba(79,70,229,0.15),transparent)]" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 mb-20">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Mic className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-serif text-[20px] text-white">Bolo</span>
          </Link>

          <h1 className="font-serif text-5xl text-white leading-[1.05] mb-5">
            Voice AI<br />
            <span className="italic bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">for Bharat</span>
          </h1>
          <p className="text-white/40 text-base leading-relaxed max-w-xs mb-14">
            Deploy voice assistants that speak every Indian language. No infra expertise needed.
          </p>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3.5">
                <div className="w-9 h-9 glass-dark rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-white/35 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap gap-1.5">
          {["हिंदी", "தமிழ்", "తెలుగు", "বাংলা", "ಕನ್ನಡ", "മലയാളം", "ਪੰਜਾਬੀ"].map((lang) => (
            <span key={lang} className="px-2.5 py-1 glass-dark rounded-full text-[11px] text-white/35 font-medium">
              {lang}
            </span>
          ))}
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 border-l border-white/[0.05]">
        <div className="w-full max-w-[360px] animate-fade-in">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-[18px] text-white">Bolo</span>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-3xl text-white mb-1">Welcome back</h2>
            <p className="text-sm text-white/40">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-white/40 mb-2 uppercase tracking-widest">
                Email address
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-3 glass-dark rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-brand-500/60 transition-all"
                placeholder="you@company.com"
                autoComplete="email"
              />
              {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-semibold text-white/40 uppercase tracking-widest">
                  Password
                </label>
                <a href="#" className="text-[11px] text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                {...register("password")}
                className="w-full px-4 py-3 glass-dark rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-brand-500/60 transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-600/30 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/35 mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
