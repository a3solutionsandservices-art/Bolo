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
    <div className="min-h-screen flex bg-[#050a14]">
      {/* Left — dark editorial panel */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden flex-col justify-between p-14">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_30%_40%,rgba(79,70,229,0.15),transparent)]" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-violet-600/8 rounded-full blur-3xl" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 mb-20">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-[20px] text-white">Bolo</span>
          </Link>

          <h1 className="font-serif text-5xl text-white leading-[1.05] mb-5">
            Start for free.<br />
            <span className="italic bg-gradient-to-r from-brand-400 to-violet-400 bg-clip-text text-transparent">Scale with India.</span>
          </h1>
          <p className="text-white/40 text-base leading-relaxed max-w-xs mb-14">
            Join businesses using Bolo to reach customers in their native language with AI-powered voice.
          </p>

          <div className="space-y-4">
            {PERKS.map((perk) => (
              <div key={perk} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-white/55 text-sm leading-tight">{perk}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 glass-dark rounded-2xl p-5">
          <p className="text-white/60 text-sm italic leading-relaxed mb-4">
            &ldquo;Bolo helped us reach 3x more rural customers by adding Hindi voice support in a single afternoon.&rdquo;
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              RS
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Ravi Sharma</p>
              <p className="text-white/30 text-xs">CTO, AgroConnect India</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 border-l border-white/[0.05]">
        <div className="w-full max-w-[380px] animate-fade-in">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-[18px] text-white">Bolo</span>
          </div>

          <div className="mb-8">
            <h2 className="font-serif text-3xl text-white mb-1">Create your account</h2>
            <p className="text-sm text-white/40">Set up your workspace in seconds</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { name: "full_name" as const, label: "Full Name", type: "text", placeholder: "Rahul Sharma", autocomplete: "name" },
              { name: "email" as const, label: "Work Email", type: "email", placeholder: "you@company.com", autocomplete: "email" },
              { name: "password" as const, label: "Password", type: "password", placeholder: "Min 8 characters", autocomplete: "new-password" },
              { name: "tenant_name" as const, label: "Company / Workspace", type: "text", placeholder: "Acme Corp", autocomplete: "organization" },
            ].map(({ name, label, type, placeholder, autocomplete }) => (
              <div key={name}>
                <label className="block text-[11px] font-semibold text-white/40 mb-2 uppercase tracking-widest">
                  {label}
                </label>
                <input
                  type={type}
                  {...register(name)}
                  placeholder={placeholder}
                  autoComplete={autocomplete}
                  className="w-full px-4 py-3 glass-dark rounded-xl text-sm text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-brand-500/60 transition-all"
                />
                {errors[name] && (
                  <p className="mt-1.5 text-xs text-red-400">{errors[name]?.message}</p>
                )}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-brand-600/30 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Create account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-white/35 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
              Sign in
            </Link>
          </p>
          <p className="text-center text-xs text-white/20 mt-3">
            By signing up you agree to our{" "}
            <a href="#" className="underline hover:text-white/40">Terms</a> &amp;{" "}
            <a href="#" className="underline hover:text-white/40">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
