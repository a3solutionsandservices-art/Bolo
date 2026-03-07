"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mic } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

const schema = z.object({
  full_name: z.string().min(2, "Name required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
  tenant_name: z.string().min(2, "Company name required"),
  tenant_slug: z.string().min(2).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
});

type RegisterForm = z.infer<typeof schema>;

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
      const { data: tokenData } = await api.auth.register(data);
      const payload = JSON.parse(atob(tokenData.access_token.split(".")[1]));
      login(tokenData.access_token, tokenData.refresh_token, {
        email: data.email,
        full_name: data.full_name,
        role: payload.role,
      }, payload.tenant_id);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-purple-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
              <Mic className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-gray-900">VaaniAI</span>
          </div>
          <h1 className="text-xl font-semibold text-center text-gray-900 mb-6">Create your account</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { name: "full_name" as const, label: "Full Name", type: "text", placeholder: "Rahul Sharma" },
              { name: "email" as const, label: "Email", type: "email", placeholder: "you@company.com" },
              { name: "password" as const, label: "Password", type: "password", placeholder: "••••••••" },
              { name: "tenant_name" as const, label: "Company Name", type: "text", placeholder: "Acme Corp" },
              { name: "tenant_slug" as const, label: "Workspace URL", type: "text", placeholder: "acme-corp" },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  {...register(name)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
                {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]?.message}</p>}
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-brand-600 font-medium hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  );
}
