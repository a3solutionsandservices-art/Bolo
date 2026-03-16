"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  MicOff,
  ArrowRight,
  XCircle,
  BadgeCheck,
  Wallet,
  Database,
  Play,
  Square,
  RotateCcw,
  Upload,
  ChevronRight,
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
  data_collection_consent: boolean;
  age_range: string | null;
  district: string | null;
  native_region: string | null;
  dialect_subtype: string | null;
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

interface Prompt {
  id: string;
  text: string;
}

interface ContributeStats {
  total_submissions: number;
  accepted_recordings: number;
  rejection_rate: number;
  by_language: { language: string; count: number }[];
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
const AGE_RANGES = ["18–24", "25–34", "35–44", "45–54", "55–64", "65+"];
const LANG_CODES: Record<string, string> = {
  Hindi: "hi", Tamil: "ta", Telugu: "te", Bengali: "bn", Gujarati: "gu",
  Marathi: "mr", Kannada: "kn", Malayalam: "ml", Punjabi: "pa", Odia: "or",
};

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
  const [dataConsentChecked, setDataConsentChecked] = useState(false);

  const { register, handleSubmit } = useForm<{
    display_name: string; slug: string; tagline: string; bio: string; category: string;
    price_personal_inr: number; price_commercial_inr: number; price_broadcast_inr: number; price_exclusive_inr: number;
    upi_id: string; age_range: string; district: string; native_region: string; dialect_subtype: string;
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
      data_collection_consent: dataConsentChecked,
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
        <h2 className="text-[15px] font-semibold text-slate-900 mb-2">Speaker Background</h2>
        <p className="text-xs text-slate-400 mb-5">This helps researchers and linguists properly attribute your voice data.</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Age Range</label>
            <select {...register("age_range")} className="input-field">
              <option value="">Select...</option>
              {AGE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">District / City</label>
            <input {...register("district")} placeholder="e.g. Varanasi" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Native Region / State</label>
            <input {...register("native_region")} placeholder="e.g. Eastern UP" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Dialect / Variant</label>
            <input {...register("dialect_subtype")} placeholder="e.g. Awadhi, Bundelkhandi" className="input-field" />
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
        <p className="text-xs text-slate-400 mb-5">Set to 0 to disable that tier. Bolo takes 20% — you keep 80%.</p>
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
          Consent & Legal Agreement (Required)
        </h3>
        <p className="text-xs text-amber-800 leading-relaxed mb-4">
          By registering, you confirm that this is your own voice, you hold all rights to it, and you agree to Bolo&apos;s Voice Licensing Terms. Bolo will verify your identity before making your profile public. Your voice will only be licensed for purposes you explicitly allow. You can revoke any licence at any time.
        </p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={consentChecked} onChange={(e) => setConsentChecked(e.target.checked)} className="mt-0.5" />
          <span className="text-xs text-amber-800 font-medium">
            I confirm this is my voice, I hold all rights to it, and I consent to Bolo licensing it under the terms above. I understand that misrepresentation is a violation of Indian IP law.
          </span>
        </label>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Language Preservation Programme (Optional)
        </h3>
        <p className="text-xs text-blue-800 leading-relaxed mb-3">
          Bolo is building India&apos;s largest consented speech dataset to preserve regional languages and dialects. By opting in, your voice recordings may be used (with attribution) to train AI models for under-resourced Indian languages. You can opt out at any time. This is governed by the <strong>Digital Personal Data Protection Act, 2023 (DPDPA)</strong>.
        </p>
        <ul className="text-xs text-blue-700 space-y-1 mb-4 list-disc list-inside">
          <li>Your data is stored securely in India</li>
          <li>You are attributed as the original speaker</li>
          <li>No data is shared without your explicit per-recording consent</li>
          <li>You earn ₹2–₹5 per accepted recording in the Contribute programme</li>
        </ul>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={dataConsentChecked} onChange={(e) => setDataConsentChecked(e.target.checked)} className="mt-0.5" />
          <span className="text-xs text-blue-800 font-medium">
            I consent to Bolo using my voice recordings for Indian language AI research and preservation, in accordance with the DPDPA 2023. I can withdraw this consent at any time.
          </span>
        </label>
      </div>

      <button type="submit" disabled={mutation.isPending || !consentChecked} className="btn-primary w-full flex items-center justify-center gap-2">
        {mutation.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Mic className="w-4 h-4" /> Submit for Verification</>}
      </button>
    </form>
  );
}

type RecordingState = "idle" | "recording" | "recorded" | "submitting" | "done";

function ContributeTab({ profile }: { profile: ArtistProfile }) {
  const [language, setLanguage] = useState<string>(() => {
    const firstLang = profile.languages[0];
    return LANG_CODES[firstLang] || "hi";
  });
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [state, setState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ is_accepted: boolean; cer_score: number; message: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: stats, refetch: refetchStats } = useQuery<ContributeStats>({
    queryKey: ["contribute-stats"],
    queryFn: () => apiClient.get("/api/v1/marketplace/contribute/my-stats").then((r) => r.data),
    enabled: profile.data_collection_consent,
  });

  const fetchPrompts = useCallback(async (lang: string) => {
    setPromptsLoading(true);
    try {
      const r = await apiClient.get(`/api/v1/marketplace/contribute/prompts?language=${lang}&limit=5`);
      setPrompts(r.data.prompts);
      setCurrentIdx(0);
      setState("idle");
      setAudioBlob(null);
      setAudioUrl(null);
      setLastResult(null);
    } catch {
      toast.error("Could not load prompts for this language");
    } finally {
      setPromptsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile.data_collection_consent) fetchPrompts(language);
  }, [language, profile.data_collection_consent, fetchPrompts]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setState("recording");
    } catch {
      toast.error("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setState("idle");
    setLastResult(null);
  };

  const submitRecording = async () => {
    if (!audioBlob || !prompts[currentIdx]) return;
    setState("submitting");
    const prompt = prompts[currentIdx];
    const fd = new FormData();
    fd.append("audio", audioBlob, "recording.webm");
    fd.append("prompt_id", prompt.id);
    fd.append("prompt_text", prompt.text);
    fd.append("language", language);
    if (profile.dialect_subtype) fd.append("dialect", profile.dialect_subtype);

    try {
      const r = await apiClient.post("/api/v1/marketplace/contribute/submit", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setLastResult(r.data);
      setState("done");
      refetchStats();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      toast.error(err?.response?.data?.detail || "Submission failed");
      setState("recorded");
    }
  };

  const nextPrompt = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setState("idle");
    setLastResult(null);
    setCurrentIdx((i) => (i + 1) % prompts.length);
  };

  if (!profile.data_collection_consent) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
        <Database className="w-10 h-10 text-blue-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Enable Language Preservation to Contribute</h3>
        <p className="text-sm text-blue-700 mb-4 max-w-md mx-auto">
          To participate in recording sessions, enable data collection consent in your profile settings.
          This supports preservation of Indian languages and dialects.
        </p>
        <p className="text-xs text-blue-500">Go to Profile Settings → Language Preservation Programme → Enable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.total_submissions}</p>
            <p className="text-xs text-slate-500 mt-1">Total Submissions</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.accepted_recordings}</p>
            <p className="text-xs text-slate-500 mt-1">Accepted</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{((1 - stats.rejection_rate) * 100).toFixed(0)}%</p>
            <p className="text-xs text-slate-500 mt-1">Acceptance Rate</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Recording Session</h2>
            <p className="text-xs text-slate-400 mt-0.5">Read each sentence clearly in your natural voice</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-600">Language:</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field py-1 text-xs w-32">
              {Object.entries(LANG_CODES).map(([name, code]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>

        {promptsLoading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : prompts.length === 0 ? (
          <div className="py-10 text-center text-slate-400">No prompts available for this language yet.</div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-slate-400">Prompt {currentIdx + 1} of {prompts.length}</span>
              <div className="flex-1 h-1 bg-slate-100 rounded-full">
                <div className="h-1 bg-brand-500 rounded-full transition-all" style={{ width: `${((currentIdx + 1) / prompts.length) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-5 mb-6 border border-slate-200">
              <p className="text-lg font-medium text-slate-800 leading-relaxed text-center" style={{ fontFamily: "system-ui" }}>
                {prompts[currentIdx]?.text}
              </p>
            </div>

            {lastResult && (
              <div className={clsx("rounded-xl p-4 mb-4 flex items-start gap-3", lastResult.is_accepted ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200")}>
                {lastResult.is_accepted ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                <div>
                  <p className={clsx("text-sm font-semibold", lastResult.is_accepted ? "text-emerald-800" : "text-red-700")}>{lastResult.message}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Clarity score: {((1 - lastResult.cer_score) * 100).toFixed(0)}%</p>
                </div>
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              {state === "idle" && (
                <button onClick={startRecording} className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all hover:scale-105">
                  <Mic className="w-8 h-8" />
                </button>
              )}
              {state === "recording" && (
                <button onClick={stopRecording} className="w-20 h-20 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg animate-pulse">
                  <Square className="w-8 h-8" />
                </button>
              )}
              {(state === "recorded" || state === "done") && (
                <div className="w-full space-y-3">
                  {audioUrl && (
                    <audio controls src={audioUrl} className="w-full h-10 rounded-lg" />
                  )}
                  <div className="flex gap-3">
                    <button onClick={resetRecording} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors">
                      <RotateCcw className="w-4 h-4" />
                      Re-record
                    </button>
                    {state === "recorded" && (
                      <button onClick={submitRecording} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-sm font-medium transition-colors">
                        <Upload className="w-4 h-4" />
                        Submit
                      </button>
                    )}
                    {state === "done" && (
                      <button onClick={nextPrompt} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-medium transition-colors">
                        Next Prompt
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              {state === "submitting" && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                  <p className="text-xs text-slate-500">Validating recording...</p>
                </div>
              )}
              <p className="text-xs text-slate-400">
                {state === "idle" ? "Tap the microphone to start recording" :
                 state === "recording" ? "Recording... tap to stop" :
                 state === "recorded" ? "Review your recording, then submit" :
                 state === "submitting" ? "Checking audio quality..." :
                 "Recording complete!"}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-blue-800 mb-2">Recording Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Speak in a quiet room with no background noise</li>
          <li>Read the sentence naturally — as if speaking to a friend</li>
          <li>Keep your microphone at a consistent distance</li>
          <li>Speak your natural dialect — don&apos;t try to sound &quot;formal&quot;</li>
          <li>Accepted recordings earn ₹2–₹5 each</li>
        </ul>
      </div>
    </div>
  );
}

type TabKey = "earnings" | "contribute";

export default function MyVoicePage() {
  const queryClient = useQueryClient();
  const [showRegistration, setShowRegistration] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("earnings");

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
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Voice Studio</h1>
          <p className="text-sm text-slate-500 mt-0.5">{profile?.display_name}</p>
        </div>
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

      {profile?.verification_status === "pending" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mb-6">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Verification in progress</p>
            <p className="text-xs text-amber-700 mt-0.5">Our team will verify your identity and voice samples within 24–48 hours. You will be notified by email.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatTile label="Total Earnings" value={`₹${(earnings?.total_earnings_inr ?? 0).toLocaleString("en-IN")}`} icon={IndianRupee} sub="all time" color="bg-emerald-600" />
        <StatTile label="This Month" value={`₹${(earnings?.this_month_earnings_inr ?? 0).toLocaleString("en-IN")}`} icon={TrendingUp} color="bg-brand-600" />
        <StatTile label="Active Licences" value={earnings?.active_licenses ?? 0} icon={Users} sub={`${earnings?.total_licenses ?? 0} total`} color="bg-violet-600" />
        <StatTile label="Avg Rating" value={earnings?.rating_count ? (earnings.avg_rating).toFixed(1) : "—"} icon={Star} sub={`${earnings?.rating_count ?? 0} reviews`} color="bg-amber-500" />
      </div>

      <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
        {([["earnings", "Licence Earnings", IndianRupee], ["contribute", "Contribute & Earn", Database]] as [TabKey, string, React.ComponentType<{ className?: string }>][]).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "earnings" && (
        <>
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
                      <span className={clsx("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", STATUS_STYLES[lic.status])}>{lic.status}</span>
                      <span className="text-xs text-slate-500 capitalize">{lic.tier} • {lic.content_category}</span>
                    </div>
                    {lic.usage_description && <p className="text-xs text-slate-500 truncate">{lic.usage_description}</p>}
                    <p className="text-[10px] text-slate-400 mt-0.5">{new Date(lic.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900">₹{lic.artist_earnings_inr.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-400">your share</p>
                  </div>
                  {lic.status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => approveMutation.mutate(lic.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Approve">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => revokeMutation.mutate(lic.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors" title="Reject">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {lic.status === "active" && (
                    <button onClick={() => revokeMutation.mutate(lic.id)} className="p-1.5 bg-red-50 text-red-400 rounded-lg hover:bg-red-100 transition-colors shrink-0" title="Revoke">
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "contribute" && profile && <ContributeTab profile={profile} />}
    </div>
  );
}
