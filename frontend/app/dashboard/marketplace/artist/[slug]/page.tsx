"use client";

import { useState } from "react";
import Image from "next/image";
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
    color: "border-white/[0.15]",
    badge: "bg-white/[0.08] text-white/60",
  },
  {
    id: "commercial",
    label: "Commercial",
    desc: "Brand content, ads, customer-facing products",
    priceKey: "price_commercial_inr" as keyof Artist,
    includes: ["Commercial use", "All products & services", "12-month licence", "Digital channels"],
    color: "border-brand-500/50 ring-1 ring-brand-500/20",
    badge: "bg-brand-500/20 text-brand-400",
    popular: true,
  },
  {
    id: "broadcast",
    label: "Broadcast",
    desc: "TV, OTT, radio, wide-distribution media",
    priceKey: "price_broadcast_inr" as keyof Artist,
    includes: ["All commercial rights", "Broadcast & OTT", "Unlimited reach", "24-month licence"],
    color: "border-violet-500/40",
    badge: "bg-violet-500/20 text-violet-400",
  },
  {
    id: "exclusive",
    label: "Exclusive",
    desc: "Sole rights — artist cannot be licensed to others",
    priceKey: "price_exclusive_inr" as keyof Artist,
    includes: ["Exclusive worldwide rights", "Perpetual licence", "No competing licences", "Direct support"],
    color: "border-amber-500/40",
    badge: "bg-amber-500/20 text-amber-400",
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
        <div className="h-8 bg-white/[0.06] rounded w-48" />
        <div className="h-64 bg-white/[0.04] rounded-2xl" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/45">Artist not found.</p>
        <Link href="/dashboard/marketplace" className="text-brand-400 mt-2 inline-block">← Back to marketplace</Link>
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
      <Link href="/dashboard/marketplace" className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="card-dark rounded-2xl overflow-hidden">
            <div className="relative h-40 bg-gradient-to-br from-saffron-600/30 to-brand-700/30">
              <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
              {artist.is_featured && (
                <div className="absolute top-3 left-4 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full">
                  <Sparkles className="w-2.5 h-2.5" />
                  Featured Artist
                </div>
              )}
            </div>
            <div className="px-6 pb-6">
              <div className="flex items-end gap-4 -mt-10 mb-4">
                <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-2 border-white/[0.12] shrink-0 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #FF6B00, #fbbf24)" }}>
                  {artist.avatar_url ? (
                    <Image src={artist.avatar_url} alt={artist.display_name} fill className="object-cover rounded-xl" />
                  ) : artist.display_name[0]}
                </div>
                <div className="mb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">{artist.display_name}</h1>
                    {artist.verification_status === "verified" && (
                      <ShieldCheck className="w-5 h-5 text-brand-400" />
                    )}
                  </div>
                  {artist.tagline && <p className="text-sm text-white/45">{artist.tagline}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mb-4 text-sm text-white/55">
                {artist.rating_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-semibold text-white/80">{artist.avg_rating.toFixed(1)}</span>
                    <span className="text-white/35">({artist.rating_count} reviews)</span>
                  </div>
                )}
                <span className="text-white/20">•</span>
                <span>{artist.total_licenses} licences granted</span>
                <span className="text-white/20">•</span>
                <div className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  {artist.languages.join(", ")}
                </div>
              </div>

              {artist.bio && <p className="text-sm text-white/55 leading-relaxed mb-4">{artist.bio}</p>}

              {artist.dialects.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-white/35 uppercase tracking-wide mb-2">Dialects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {artist.dialects.map((d) => (
                      <span key={d} className="lang-pill text-xs">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {artist.specialties.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-white/35 uppercase tracking-wide mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-1.5">
                    {artist.specialties.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-brand-500/15 text-brand-400 border border-brand-500/25 text-xs rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {artist.sample_audio_urls.length > 0 && (
            <div className="card-dark rounded-2xl p-6">
              <h2 className="text-[15px] font-semibold text-white mb-4">Voice Samples</h2>
              <div className="space-y-3">
                {artist.sample_audio_urls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/[0.04] rounded-xl border border-white/[0.06]">
                    <button
                      onClick={() => setPlayingIdx(playingIdx === idx ? null : idx)}
                      className="w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-all shrink-0"
                      style={{ background: "linear-gradient(135deg, #FF6B00, #f97316)" }}
                    >
                      {playingIdx === idx ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white ml-0.5" />
                      )}
                    </button>
                    <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div className="h-full bg-saffron-500 rounded-full w-0" />
                    </div>
                    <span className="text-xs text-white/30 shrink-0">Sample {idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 p-4 rounded-xl" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-300 mb-0.5">Consent-first platform</p>
              <p className="text-amber-400/70 text-xs leading-relaxed">
                This artist has signed a digital consent agreement. Their voice may only be used for the purposes stated in your licence. Misuse can result in immediate revocation and legal action under Indian personality rights law.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="card-dark rounded-2xl p-5">
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
                      selectedTier === tier.id ? tier.color : "border-white/[0.08] hover:border-white/[0.15]",
                      selectedTier === tier.id ? "bg-white/[0.04]" : ""
                    )}
                  >
                    {tier.popular && (
                      <span className="absolute -top-2 left-3 text-[10px] font-bold px-2 py-0.5 bg-brand-600 text-white rounded-full">
                        Most Popular
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-white">{tier.label}</p>
                        <p className="text-[11px] text-white/40 mt-0.5 leading-tight">{tier.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {price > 0 ? (
                          <div className="flex items-center gap-0.5">
                            <IndianRupee className="w-3 h-3 text-white/70" />
                            <span className="text-sm font-bold text-white">{price.toLocaleString("en-IN")}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-400">Free</span>
                        )}
                      </div>
                    </div>
                    {selectedTier === tier.id && (
                      <div className="mt-2.5 space-y-1">
                        {tier.includes.map((item) => (
                          <div key={item} className="flex items-center gap-1.5 text-[11px] text-white/55">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
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
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wide mb-1.5">
                  Content Category
                </label>
                <select
                  value={contentCategory}
                  onChange={(e) => setContentCategory(e.target.value)}
                  className="input-dark text-sm w-full"
                >
                  {CONTENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-white/40 uppercase tracking-wide mb-1.5">
                  Usage Description <span className="text-white/25 normal-case font-normal">(optional)</span>
                </label>
                <textarea
                  value={usageDescription}
                  onChange={(e) => setUsageDescription(e.target.value)}
                  placeholder="Briefly describe how you plan to use this voice..."
                  className="input-dark text-sm resize-none w-full"
                  rows={3}
                />
              </div>
            </div>

            {selectedPrice > 0 && (
              <div className="rounded-xl p-3 mb-4 space-y-1.5 text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex justify-between text-white/55">
                  <span>Licence fee</span>
                  <span>₹{selectedPrice.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-white/35 text-xs">
                  <span>Platform fee (20%)</span>
                  <span>₹{platformFee.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-emerald-400 text-xs font-medium border-t border-white/[0.07] pt-1.5">
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
                  {selectedPrice > 0 ? `Request Licence — ₹${selectedPrice.toLocaleString("en-IN")}` : "Get Free Licence"}
                </>
              )}
            </button>

            <p className="text-[11px] text-white/25 text-center mt-3 leading-relaxed">
              Licence is active after artist approval. Free licences are auto-approved.
            </p>
          </div>

          <div className="card-dark rounded-2xl p-5">
            <h3 className="text-[13px] font-semibold text-white mb-3">Content Restrictions</h3>
            {Object.keys(artist.content_restrictions).length > 0 ? (
              <ul className="space-y-1.5">
                {Object.entries(artist.content_restrictions).map(([key, val]) => (
                  <li key={key} className="flex items-start gap-2 text-xs text-white/45">
                    <AlertTriangle className="w-3 h-3 text-amber-400/70 shrink-0 mt-0.5" />
                    <span>{key}: {String(val)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-white/35">No specific content restrictions set by this artist.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
