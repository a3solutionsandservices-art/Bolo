"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  IndianRupee,
  TrendingUp,
  ShieldCheck,
  Users,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mic,
  ArrowRight,
  XCircle,
  BadgeCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";
import { useForm } from "react-hook-form";

interface ArtistProfile {
  id: string;
  display_name: string;
  slug: string;
  bio: string | null;
  tagline: string | null;
  category: string;
  languages: string[];
  dialects: string[];
  specialties: string[];
  avatar_url: string | null;
  verification_status: string;
  price_personal_inr: number;
  price_commercial_inr: number;
  price_broadcast_inr: number;
  price_exclusive_inr: number;
  is_public: boolean;
  upi_id: string | null;
}

interface EarningsSummary {
  total_earnings_inr: number;
  total_licenses: number;
  avg_rating: number;
  rating_count: number;
  pending_earnings_inr: number;
  active_licenses: number;
  this_month_earnings_inr: number;
  licenses: LicenseRow[];
}

interface LicenseRow {
  id: string;
  tier: string;
  status: string;
  price_inr: number;
  artist_earnings_inr: number;
  content_category: string;
  usage_description: string | null;
  approved_at: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  expired: "bg-slate-100 text-slate-600",
  revoked: "bg-red-100 text-red-700",
};

const LANGUAGES_LIST = ["Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Bhojpuri", "Awadhi", "Maithili", "Odia", "Assamese", "Sindhi", "English"];
const DIALECT_LIST = ["Awadhi", "Bhojpuri", "Maithili", "Rajasthani", "Marwari", "Chhattisgarhi", "Bundelkhandi", "Tulu", "Kodava", "Gondi", "Santali"];
const SPECIALTY_LIST = ["Dubbing", "Narration", "Character Voices", "News Reading", "Advertising", "Audiobooks", "AI Training", "Singing", "Podcast Hosting", "IVR"];

function StatTile({ label, value, icon: Icon, sub, color }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-card p-5">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function RegistrationForm({ onSuccess }: { onSuccess: () => void }) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedDialects, setSelectedDialects] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [consentChecked, setConsentChecked] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<{
    display_name: string; slug: string; tagline: string; bio: string; category: string;
    price_personal_inr: number; price_commercial_inr: number; price_broadcast_inr: number; price_exclusive_inr: number;
    upi_id: string;
  }>();

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiClient.post("/api/v1/marketplace/register", data).then((r) => r.data),
    onSuccess: () => { toast.success("Profile submitted for verification!"); onSuccess(); },
    onError: (e: { response?: { data?: { detail?: string } } }) => toast.error(e?.response?.data?.detail || "Registration failed"),
  });

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const onSubmit = (data: Record<string, unknown>) => {
    if (!consentChecked) { toast.error("Please accept the consent agreement"); return; }
    if (selectedLanguages.length === 0) { toast.error("Select at least one language"); return; }
    mutation.mutate({
      ...data,
      languages: selectedLanguages,
      dialects: selectedDialects,
      specialties: selectedSpecialties,
      price_personal_inr: Number(data.price_personal_inr) || 0,
      price_commercial_inr: Number(data.price_commercial_inr) || 0,
      price_broadcast_inr: Number(data.price_broadcast_inr) || 0,
      price_exclusive_inr: Number(data.price_exclusive_inr) || 0,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-6">
        <h2 className="text-[15px] font-semibold text-slate-900 mb-5">Profile Details</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: "display_name", label: "Artist / Stage Name", placeholder: "Amitabh B. Voice" },
            { name: "slug", label: "Profile URL slug", placeholder: "amitabh-b-voice" },
            { name: "tagline", label: "Tagline", placeholder: "The Voice of Bollywood" },
          ].map(({ name, label, placeholder }) => (
            <div key={name} className={name === "display_name" ? "col-span-2" : ""}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{label}</label>
              <input {...register(name as "display_name" | "slug" | "tagline", { required: name !== "tagline" })} placeholder={placeholder} className="input-field" />
            </div>
          ))}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Category</label>
            <select {...register("category", { required: true })} className="input-field">
              <option value="">Select category...</option>
              {[["celebrity", "Celebrity"], ["voice_artist", "Voice Artist"], ["rj", "Radio Jockey"], ["singer", "Singer"], ["narrator", "Narrator"], ["community_speaker", "Community Speaker"]].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Bio</label>
            <textarea {...register("bio")} rows={3} placeholder="Tell licensees about your voice, experience and style..." className="input-field resize-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-6">
        <h2 className="text-[15px] font-semibold text-slate-900 mb-5">Languages & Dialects</h2>
        <div className="mb-4">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Languages *</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES_LIST.map((lang) => (
              <button key={lang} type="button" onClick={() => toggle(selectedLanguages, setSelectedLanguages, lang)}
                className={clsx("px-3 py-1 rounded-full text-xs font-medium border transition-all", selectedLanguages.includes(lang) ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200 hover:border-brand-300")}>
                {lang}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Dialects (optional)</p>
          <div className="flex flex-wrap gap-2">
            {DIALECT_LIST.map((d) => (
              <button key={d} type="button" onClick={() => toggle(selectedDialects, setSelectedDialects, d)}
                className={clsx("px-3 py-1 rounded-full text-xs font-medium border transition-all", selectedDialects.includes(d) ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300")}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-6">
        <h2 className="text-[15px] font-semibold text-slate-900 mb-2">Specialties</h2>
        <p className="text-xs text-slate-400 mb-4">What types of voice work do you offer?</p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_LIST.map((s) => (
            <button key={s} type="button" onClick={() => toggle(selectedSpecialties, setSelectedSpecialties, s)}
              className={clsx("px-3 py-1 rounded-full text-xs font-medium border transition-all", selectedSpecialties.includes(s) ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-violet-300")}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-6">
        <h2 className="text-[15px] font-semibold text-slate-900 mb-1">Set Your Prices (₹ INR)</h2>
        <p className="text-xs text-slate-400 mb-5">Set to 0 to disable that tier. BoloAI takes 20% — you keep 80%.</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: "price_personal_inr", label: "Personal Use", placeholder: "e.g. 500" },
            { name: "price_commercial_inr", label: "Commercial", placeholder: "e.g. 5000" },
            { name: "price_broadcast_inr", label: "Broadcast / OTT", placeholder: "e.g. 25000" },
            { name: "price_exclusive_inr", label: "Exclusive Rights", placeholder: "e.g. 500000" },
          ].map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">{label}</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="number" {...register(name as "price_personal_inr")} placeholder={placeholder} className="input-field pl-8" min="0" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">UPI ID for Payouts</label>
          <input {...register("upi_id")} placeholder="yourname@upi" className="input-field" />
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Consent & Legal Agreement
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed mb-4">
          By registering, you confirm that this is your own voice, you hold all rights to it, and you agree to BoloAI&apos;s Voice Licensing Terms. BoloAI will verify your identity before making your profile public. Your voice will only be licensed for purposes you explicitly allow. You can revoke any licence at any time.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="mt-0.5" />
          <span className="text-xs text-amber-800 font-medium">
            I confirm this is my voice, I hold all rights to it, and I consent to BoloAI licensing it under the terms above. I understand that misrepresentation is a violation of Indian IP law.
          </span>
        </label>
      </div>

      <button type="submit" disabled={mutation.isPending || !consentChecked} className="btn-primary w-full flex items-center justify-center gap-2">
        {mutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Mic className="w-4 h-4" /> Submit for Verification</>}
      </button>
    </form>
  );
}

export default function MyVoicePage() {
  const queryClient = useQueryClient();
  const [showRegistration, setShowRegistration] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<ArtistProfile>({
    queryKey: ["my-artist-profile"],
    queryFn: () => apiClient.get("/api/v1/marketplace/my-profile").then((r) => r.data),
    retry: false,
  });

  const { data: earnings } = useQuery<EarningsSummary>({
    queryKey: ["my-earnings"],
    queryFn: () => apiClient.get("/api/v1/marketplace/my-earnings").then((r) => r.data),
    enabled: !!profile,
  });

  const approveMutation = useMutation({
    mutationFn: (licenseId: string) => apiClient.patch(`/api/v1/marketplace/license/${licenseId}/approve`).then((r) => r.data),
    onSuccess: () => { toast.success("Licence approved"); queryClient.invalidateQueries({ queryKey: ["my-earnings"] }); },
  });

  const revokeMutation = useMutation({
    mutationFn: (licenseId: string) => apiClient.patch(`/api/v1/marketplace/license/${licenseId}/revoke`).then((r) => r.data),
    onSuccess: () => { toast.success("Licence revoked"); queryClient.invalidateQueries({ queryKey: ["my-earnings"] }); },
  });

  if (profileLoading) {
    return <div className="p-8 animate-pulse"><div className="h-64 bg-slate-200 rounded-2xl" /></div>;
  }

  if (!profile && !showRegistration) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Monetise Your Voice</h1>
          <p className="text-slate-500 text-sm">Join India&apos;s first consent-first voice licensing platform</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { icon: IndianRupee, color: "bg-emerald-600", title: "Earn from every licence", desc: "Set your own prices. Keep 80% of every licence fee." },
            { icon: ShieldCheck, color: "bg-brand-600", title: "Your consent, always", desc: "Approve every licence request. Revoke any usage instantly." },
            { icon: Users, color: "bg-violet-600", title: "Reach 10,000+ brands", desc: "Enterprise clients across BFSI, EdTech, E-commerce, and more." },
            { icon: BadgeCheck, color: "bg-amber-500", title: "Verified & protected", desc: "ID verified. Compliant with Indian personality rights law." },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-slate-200/60 shadow-card p-5">
              <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-[13px] font-semibold text-slate-900 mb-1">{title}</p>
              <p className="text-xs text-slate-500 leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-hero-gradient rounded-2xl p-6 relative overflow-hidden mb-6">
          <div className="absolute inset-0 bg-mesh-gradient" />
          <div className="relative z-10 text-center">
            <h2 className="text-lg font-bold text-white mb-1">Ready to start earning?</h2>
            <p className="text-white/60 text-sm mb-4">Set up your profile in 5 minutes. Verification takes 24–48 hours.</p>
            <button
              onClick={() => setShowRegistration(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-700 font-semibold text-sm rounded-xl hover:bg-white/90 transition-colors"
            >
              <Mic className="w-4 h-4" />
              Register My Voice
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile && showRegistration) {
    return (
      <div className="p-8 max-w-2xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Register Your Voice</h1>
        <RegistrationForm onSuccess={() => { setShowRegistration(false); queryClient.invalidateQueries({ queryKey: ["my-artist-profile"] }); }} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Voice Studio</h1>
          <p className="text-sm text-slate-500 mt-0.5">{profile?.display_name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
            profile?.verification_status === "verified" ? "bg-emerald-100 text-emerald-700" :
            profile?.verification_status === "pending" ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          )}>
            {profile?.verification_status === "verified" ? <ShieldCheck className="w-3.5 h-3.5" /> :
             profile?.verification_status === "pending" ? <Clock className="w-3.5 h-3.5" /> :
             <AlertTriangle className="w-3.5 h-3.5" />}
            {profile?.verification_status === "verified" ? "Verified" : profile?.verification_status === "pending" ? "Pending Review" : "Rejected"}
          </span>
        </div>
      </div>

      {profile?.verification_status === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Verification in progress</p>
            <p className="text-xs text-amber-700 mt-0.5">Our team will verify your identity and voice samples within 24–48 hours. You will be notified by email.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatTile label="Total Earnings" value={`₹${(earnings?.total_earnings_inr ?? 0).toLocaleString("en-IN")}`} icon={IndianRupee} sub="all time" color="bg-emerald-600" />
        <StatTile label="This Month" value={`₹${(earnings?.this_month_earnings_inr ?? 0).toLocaleString("en-IN")}`} icon={TrendingUp} color="bg-brand-600" />
        <StatTile label="Active Licences" value={earnings?.active_licenses ?? 0} icon={Users} sub={`${earnings?.total_licenses ?? 0} total`} color="bg-violet-600" />
        <StatTile label="Avg Rating" value={earnings?.rating_count ? (earnings.avg_rating).toFixed(1) : "—"}
          icon={Star} sub={`${earnings?.rating_count ?? 0} reviews`} color="bg-amber-500" />
      </div>

      {(earnings?.pending_earnings_inr ?? 0) > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wallet className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">₹{(earnings?.pending_earnings_inr ?? 0).toLocaleString("en-IN")} pending approval</p>
              <p className="text-xs text-emerald-700">Approve licence requests below to release earnings to your UPI account</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-[15px] font-semibold text-slate-900">Licence Requests</h2>
          <p className="text-xs text-slate-400 mt-0.5">Review and approve who can use your voice</p>
        </div>
        <div className="divide-y divide-slate-50">
          {!earnings?.licenses?.length ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No licence requests yet</p>
            </div>
          ) : earnings.licenses.map((lic) => (
            <div key={lic.id} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", STATUS_STYLES[lic.status])}>
                    {lic.status}
                  </span>
                  <span className="text-xs text-slate-500 capitalize">{lic.tier} • {lic.content_category}</span>
                </div>
                {lic.usage_description && (
                  <p className="text-xs text-slate-500 truncate">{lic.usage_description}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-0.5">{new Date(lic.created_at).toLocaleDateString("en-IN")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-900">₹{lic.artist_earnings_inr.toLocaleString("en-IN")}</p>
                <p className="text-[10px] text-slate-400">your share</p>
              </div>
              {lic.status === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => approveMutation.mutate(lic.id)}
                    className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Approve">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => revokeMutation.mutate(lic.id)}
                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Reject">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
              {lic.status === "active" && (
                <button onClick={() => revokeMutation.mutate(lic.id)}
                  className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors shrink-0" title="Revoke">
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
