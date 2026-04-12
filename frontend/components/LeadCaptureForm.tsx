"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface FormState {
  name: string;
  phone: string;
  clinic: string;
  city: string;
}

export default function LeadCaptureForm() {
  const [form, setForm] = useState<FormState>({ name: "", phone: "", clinic: "", city: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.clinic) {
      setError("Please fill in name, phone and clinic name.");
      return;
    }
    setError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "landing_page", ts: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try WhatsApp or email instead.");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <p className="text-white font-semibold text-lg">We will call you within 24 hours!</p>
        <p className="text-white/40 text-sm">
          Meanwhile, share this demo with another clinic owner who might benefit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Your name *"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-500/60 transition-colors"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="WhatsApp number *"
          type="tel"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-500/60 transition-colors"
        />
        <input
          name="clinic"
          value={form.clinic}
          onChange={handleChange}
          placeholder="Clinic / Hospital name *"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-500/60 transition-colors"
        />
        <input
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder="City"
          className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.10] text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-500/60 transition-colors"
        />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl font-semibold text-white text-[15px] transition-all disabled:opacity-60"
        style={{ background: "linear-gradient(135deg,#FF6B00,#f97316)", boxShadow: "0 4px 24px rgba(255,107,0,0.35)" }}
      >
        {status === "loading" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
        ) : (
          <>Get a Free Demo Call <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <p className="text-white/20 text-xs text-center">
        No spam. We call once to show you Bolo live on your clinic number.
      </p>
    </form>
  );
}
