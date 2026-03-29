"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Star,
  ShieldCheck,
  Play,
  Pause,
  IndianRupee,
  Check,
  ArrowLeft,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { clsx } from "clsx";

interface Artist {
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
  sample_audio_urls: string[];
  verification_status: string;
  price_personal_inr: number;
  price_commercial_inr: number;
  price_broadcast_inr: number;
  price_exclusive_inr: number;
  total_licenses: number;
  avg_rating: number;
  rating_count: number;
  is_featured: boolean;
  content_restrictions: Record<string, unknown>;
}

const TIER_INFO = [
  {
    id: "personal",
    label: "Personal Use",
    desc: "Internal projects, demos, personal content",
    priceKey: "price_personal_inr" as keyof Artist,
    includes: ["Non-commercial use", "Single project", "Unlimited duration"],
    color: "border-slate-200",
    badge: "bg-slate-100 text-white/75",
  },
  {
    id: "commercial",
    label: "Commercial",
    desc: "Brand content, ads, customer-facing products",
    priceKey: "price_commercial_inr" as keyof Artist,
    includes: ["Commercial use", "All products & services", "12-month licence", "Digital channels"],
    color: "border-brand-300 ring-2 ring-brand-100",
    badge: "bg-brand-100 text-brand-700",
    popular: true,
  },
  {
    id: "broadcast",
    label: "Broadcast",
    desc: "TV, OTT, radio, wide-distribution media",
    priceKey: "price_broadcast_inr" as keyof Artist,
    includes: ["All commercial rights", "Broadcast & OTT", "Unlimited reach", "24-month licence"],
    color: "border-violet-200",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    id: "exclusive",
    label: "Exclusive",
    desc: "Sole rights — artist cannot be licensed to others",
    priceKey: "price_exclusive_inr" as keyof Artist,
    includes: ["Exclusive worldwide rights", "Perpetual licence", "No competing licences", "Direct support"],
    color: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
  },
];

const CONTENT_CATEGORIES = [
  "advertising", "dubbing", "narration", "customer_service", "education", "entertainment", "general",
];

export default function ArtistStorefrontPage() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [selectedTier, setSelectedTier] = useState("commercial");
  const [contentCategory, setContentCategory] = useState("general");
  const [usageDescription, setUsageDescription] = useState("");
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);

  const { data: artist, isLoading } = useQuery<Artist>({
    queryKey: ["marketplace-artist", slug],
    queryFn: () => apiClient.get(`/api/v1/marketplace/artist/${slug}`).then((r) => r.data),
  });

  const licenseMutation = useMutation({
    mutationFn: (data: { tier: string; content_category: string; usage_description: string }) =>
      apiClient.post(`/api/v1/marketplace/license/${artist?.id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success("License request submitted! The artist will review and approve.");
      queryClient.invalidateQueries({ queryKey: ["my-licenses"] });
    },
    onError: () => toast.error("Failed to request licence. Please try again."),
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-64 bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/45">Artist not found.</p>
        <Link href="/dashboard/marketplace" className="text-brand-600 mt-2 inline-block">← Back to marketplace</Link>
      </div>
    );
  }

  const tierData = TIER_INFO.find((t) => t.id === selectedTier);
  const selectedPrice = artist[tierData?.priceKey ?? "price_commercial_inr"] as number;
  const platformFee = Math.round(selectedPrice * 0.2);
  const artistEarnings = selectedPrice - platformFee;

  const handleLicense = () => {
    if (!selectedTier) return;
    licenseMutation.mutate({ tier: selectedTier, content_category: contentCategory, usage_description: usageDescription });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <Link href="/dashboard/marketplace" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden">
            <div className="relative h-40 bg-gradient-to-br from-brand-600 to-violet-700">
              <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
              {artist.is_featured && (
                <div className="absolute top-3 left-4 flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  Featured Artist
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-3xl font-bold shadow-card-md border-4 border-white shrink-0">
                  {artist.avatar_url ? (
                    <img src={artist.avatar_url} alt={artist.display_name} className="w-full h-full object-cover rounded-xl" />
                  ) : artist.display_name[0]}
                </div>
                <div className="mb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">{artist.display_name}</h1>
                    {artist.verification_status === "verified" && (
                      <ShieldCheck className="w-5 h-5 text-brand-500" />
                    )}
                  </div>
                  {artist.tagline && <p className="text-sm text-white/45">{artist.tagline}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4 text-sm text-white/60">
                {artist.rating_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold">{artist.avg_rating.toFixed(1)}</span>
                    <span className="text-white/35">({artist.rating_count} reviews)</span>
                  </div>
                )}
                <span className="text-slate-300">•</span>
                <span>{artist.total_licenses} licences granted</span>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {artist.languages.join(", ")}
                </div>
              </div>

              {artist.bio && <p className="text-sm text-slate-600 leading-relaxed mb-4">{artist.bio}</p>}

              {artist.dialects.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Dialects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {artist.dialects.map((d) => (
                      <span key={d} className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 text-xs rounded-full font-medium">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {artist.specialties.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {artist.specialties.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 text-xs rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {artist.sample_audio_urls.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-6">
              <h2 className="text-[15px] font-semibold text-white mb-4">Voice Samples</h2>
              <div className="space-y-3">
                {artist.sample_audio_urls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <button
                      onClick={() => setPlayingIdx(playingIdx === idx ? null : idx)}
                      className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center shadow-sm hover:bg-brand-700 transition-colors shrink-0"
                    >
                      {playingIdx === idx ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-400 rounded-full w-0" />
                    </div>
                    <span className="text-xs text-white/30 shrink-0">Sample {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold mb-0.5">Consent-first platform</p>
              <p className="text-amber-700 text-xs leading-relaxed">
                This artist has signed a digital consent agreement. Their voice may only be used for the purposes stated in your licence. Misuse can result in immediate revocation and legal action under Indian personality rights law.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-5">
            <h2 className="text-[15px] font-semibold text-white mb-4">Choose a Licence</h2>

            <div className="space-y-2.5 mb-5">
              {TIER_INFO.map((tier) => {
                const price = artist[tier.priceKey] as number;
                if (price === 0 && tier.id !== "personal") return null;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={clsx(
                      "w-full text-left p-3.5 rounded-xl border-2 transition-all relative",
                      selectedTier === tier.id ? tier.color : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    {tier.popular && (
                      <span className="absolute -top-2 left-3 text-[10px] font-bold px-2 py-0.5 bg-brand-600 text-white rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-slate-900">{tier.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{tier.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {price > 0 ? (
                          <div className="flex items-center gap-0.5">
                            <IndianRupee className="w-3 h-3 text-white/75" />
                            <span className="text-sm font-bold text-slate-900">{price.toLocaleString("en-IN")}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-600">Free</span>
                        )}
                      </div>
                    </div>
                    {selectedTier === tier.id && (
                      <div className="mt-2.5 space-y-1">
                        {tier.includes.map((item) => (
                          <div key={item} className="flex items-center gap-1.5 text-[11px] text-white/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Content Category
                </label>
                <select
                  value={contentCategory}
                  onChange={(e) => setContentCategory(e.target.value)}
                  className="input-field text-sm"
                >
                  {CONTENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Usage Description <span className="text-slate-400 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={usageDescription}
                  onChange={(e) => setUsageDescription(e.target.value)}
                  placeholder="Briefly describe how you plan to use this voice..."
                  className="input-field text-sm resize-none"
                  rows={3}
                />
              </div>
            </div>

            {selectedPrice > 0 && (
              <div className="bg-slate-50 rounded-xl p-3 mb-4 space-y-1.5 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Licence fee</span>
                  <span>₹{selectedPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-xs">
                  <span>Platform fee (20%)</span>
                  <span>₹{platformFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-emerald-700 text-xs font-medium border-t border-slate-200 pt-1.5">
                  <span>Artist receives</span>
                  <span>₹{artistEarnings.toLocaleString("en-IN")}</span>
                </div>
              </div>
            )}

            <button
              onClick={handleLicense}
              disabled={licenseMutation.isPending}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {licenseMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {selectedPrice > 0 ? `Request Licence — ₹${selectedPrice.toLocaleString("en-IN")}` : "Request Free Licence"}
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-5">
            <h3 className="text-[13px] font-semibold text-slate-900 mb-3">What&apos;s protected</h3>
            <div className="space-y-2">
              {[
                "Voice used only for agreed purpose",
                "Artist can revoke misused licences",
                "All consent documented digitally",
                "Compliant with Indian personality rights",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/60">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
