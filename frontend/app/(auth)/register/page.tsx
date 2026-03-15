"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mic, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { parseJwt } from "@/lib/jwt";
import Link from "next/link";

const schema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
  tenant_name: z.string().min(2, "Company name required"),
});

function toSlug(name: string): string {
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug.length >= 2 ? slug : `workspace-${Math.random().toString(36).slice(2, 8)}`;
}

type RegisterForm = z.infer<typeof schema>;

const PERKS = [
  "Deploy a voice widget in under 5 minutes",
  "Supports 7+ Indian languages out of the box",
  "No credit card required to start",
  "Free tier: 100 conversations / month",
];

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const { data: tokenData } = await api.auth.register({
        ...data,
        tenant_slug: toSlug(data.tenant_name),
      });
      const payload = parseJwt(tokenData.access_token);
      login(tokenData.access_token, tokenData.refresh_token, {
        email: data.email,
        full_name: data.full_name,
        role: (payload.role as string) || "tenant_admin",
      }, payload.tenant_id as string);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      toast.error(axiosError?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — dark hero panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-hero-gradient relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 bg-mesh-gradient" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-violet-600/15 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center shadow-glow-brand">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white text-lg font-bold tracking-tight">VaaniAI</span>
              <div className="text-[10px] text-white/40 font-medium tracking-widest uppercase">Platform</div>
            </div>
          </div>

          <div className="mb-12">
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Start for free.<br />
              <span className="bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">
                Scale with India.
              </span>
            </h1>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Join 500+ businesses using VaaniAI to reach customers in their native language with AI-powered voice.
            </p>
          </div>

          <div className="space-y-4">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-white/70 text-sm leading-tight">{perk}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/80 text-sm italic leading-relaxed mb-3">
              &ldquo;VaaniAI helped us reach 3x more rural customers by adding Hindi voice support to our app in a single afternoon.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-gradient rounded-full flex items-center justify-center text-white text-xs font-bold">
                RS
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Ravi Sharma</p>
                <p className="text-white/40 text-xs">CTO, AgroConnect India</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc] px-6 py-12">
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-brand-gradient rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">VaaniAI</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-500 mt-1">Set up your workspace in seconds</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card-md p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {[
                { name: "full_name" as const, label: "Full Name", type: "text", placeholder: "Rahul Sharma", autocomplete: "name" },
                { name: "email" as const, label: "Work Email", type: "email", placeholder: "you@company.com", autocomplete: "email" },
                { name: "password" as const, label: "Password", type: "password", placeholder: "Min 8 characters", autocomplete: "new-password" },
                { name: "tenant_name" as const, label: "Company Name", type: "text", placeholder: "Acme Corp", autocomplete: "organization" },
              ].map(({ name, label, type, placeholder, autocomplete }) => (
                <div key={name}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                    {label}
                  </label>
                  <input
                    type={type}
                    {...register(name)}
                    placeholder={placeholder}
                    autoComplete={autocomplete}
                    className="input-field"
                  />
                  {errors[name] && (
                    <p className="mt-1.5 text-xs text-red-500">{errors[name]?.message}</p>
                  )}
                </div>
              ))}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-600 font-semibold hover:text-brand-700">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-slate-400 mt-4">
            By creating an account you agree to our{" "}
            <a href="#" className="underline hover:text-slate-600">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
