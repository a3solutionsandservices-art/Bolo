"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Search,
  Star,
  Mic,
  Radio,
  Music2,
  BookOpen,
  Users,
  Film,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Play,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

const CATEGORIES = [
  { id: "", label: "All Voices", icon: Mic },
  { id: "celebrity", label: "Celebrities", icon: Sparkles },
  { id: "voice_artist", label: "Voice Artists", icon: Film },
  { id: "rj", label: "Radio Jockeys", icon: Radio },
  { id: "singer", label: "Singers", icon: Music2 },
  { id: "narrator", label: "Narrators", icon: BookOpen },
  { id: "community_speaker", label: "Community Speakers", icon: Users },
];

const LANGUAGES = ["All", "Hindi", "Tamil", "Telugu", "Bengali", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Odia", "Bhojpuri", "Awadhi", "Maithili"];

const CATEGORY_COLORS: Record<string, string> = {
  celebrity: "bg-amber-100 text-amber-700 border-amber-200",
  voice_artist: "bg-brand-100 text-brand-700 border-brand-200",
  rj: "bg-violet-100 text-violet-700 border-violet-200",
  singer: "bg-pink-100 text-pink-700 border-pink-200",
  narrator: "bg-emerald-100 text-emerald-700 border-emerald-200",
  community_speaker: "bg-orange-100 text-orange-700 border-orange-200",
};

const TIER_LABELS: Record<string, string> = {
  personal: "Personal",
  commercial: "Commercial",
  broadcast: "Broadcast",
  exclusive: "Exclusive",
};

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

function ArtistCard({ artist }: { artist: Artist }) {
  const lowestPrice = Math.min(
    ...[artist.price_personal_inr, artist.price_commercial_inr]
      .filter((p) => p > 0)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card hover:shadow-card-md transition-all duration-200 overflow-hidden group">
      <div className="relative h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
        {artist.avatar_url ? (
          <img src={artist.avatar_url} alt={artist.display_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 bg-brand-gradient rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-glow-brand">
            {artist.display_name[0]}
          </div>
        )}
        {artist.is_featured && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-white text-[10px] font-bold rounded-full shadow-sm">
            <Sparkles className="w-2.5 h-2.5" />
            Featured
          </div>
        )}
        {artist.sample_audio_urls.length > 0 && (
          <button className="absolute bottom-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
            <Play className="w-3.5 h-3.5 text-brand-600 ml-0.5" />
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-[14px] font-bold text-slate-900 leading-tight">{artist.display_name}</h3>
              {artist.verification_status === "verified" && (
                <ShieldCheck className="w-3.5 h-3.5 text-brand-500 shrink-0" />
              )}
            </div>
            {artist.tagline && (
              <p className="text-xs text-slate-500 mt-0.5 leading-tight">{artist.tagline}</p>
            )}
          </div>
          <span className={clsx("shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border", CATEGORY_COLORS[artist.category])}>
            {CATEGORY_LABELS[artist.category] || artist.category}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {artist.languages.slice(0, 3).map((lang) => (
            <span key={lang} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">
              {lang}
            </span>
          ))}
          {artist.languages.length > 3 && (
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[10px] rounded font-medium">
              +{artist.languages.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {artist.rating_count > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-xs font-semibold text-white/75">{artist.avg_rating.toFixed(1)}</span>
                <span className="text-xs text-white/30">({artist.rating_count})</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5">{artist.total_licenses} licenses</p>
          </div>
          <div className="text-right">
            {lowestPrice > 0 ? (
              <>
                <p className="text-[10px] text-white/35">from</p>
                <div className="flex items-center gap-0.5">
                  <IndianRupee className="w-3 h-3 text-white/75" />
                  <span className="text-sm font-bold text-slate-900">{lowestPrice.toLocaleString("en-IN")}</span>
                </div>
              </>
            ) : (
              <span className="text-xs font-semibold text-emerald-600">Free</span>
            )}
          </div>
        </div>

        <Link
          href={`/dashboard/marketplace/artist/${artist.slug}`}
          className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-brand-50 hover:bg-brand-100 text-brand-700 text-[13px] font-semibold rounded-lg transition-colors group"
        >
          View & License
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  celebrity: "Celebrity",
  voice_artist: "Voice Artist",
  rj: "RJ",
  singer: "Singer",
  narrator: "Narrator",
  community_speaker: "Community",
};

export default function MarketplacePage() {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [search, setSearch] = useState("");

  const { data: featured = [] } = useQuery<Artist[]>({
    queryKey: ["marketplace-featured"],
    queryFn: () => apiClient.get("/api/v1/marketplace/featured").then((r) => r.data),
  });

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["marketplace", selectedCategory, selectedLanguage, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedLanguage !== "All") params.set("language", selectedLanguage);
      if (search) params.set("q", search);
      return apiClient.get(`/api/v1/marketplace?${params}`).then((r) => r.data);
    },
  });

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Voice Marketplace</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            License authentic Indian voices from celebrities, RJs, and community speakers
          </p>
        </div>
        <Link
          href="/dashboard/marketplace/my-voice"
          className="btn-secondary flex items-center gap-2 text-sm"
        >
          <Mic className="w-4 h-4" />
          Monetise My Voice
        </Link>
      </div>

      {featured.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-[15px] font-semibold text-white">Featured Artists</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map((a) => <ArtistCard key={a.id} artist={a} />)}
          </div>
        </div>
      )}

      <div className="bg-white/[0.04] rounded-2xl border border-white/[0.07] p-5 mb-6">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35" />
            <input
              type="text"
              placeholder="Search by name, language, or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedCategory(id)}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all",
                  selectedCategory === id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={clsx(
                  "shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all border",
                  selectedLanguage === lang
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand-300"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-72 bg-slate-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : artists.length === 0 ? (
        <div className="text-center py-20">
          <Mic className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No artists found</h3>
          <p className="text-sm text-slate-400 mb-6">
            {search || selectedCategory || selectedLanguage !== "All"
              ? "Try adjusting your filters"
              : "The marketplace is growing — be the first to list your voice"}
          </p>
          <Link href="/dashboard/marketplace/my-voice" className="btn-primary inline-flex items-center gap-2">
            <Mic className="w-4 h-4" />
            List My Voice
          </Link>
        </div>
      ) : (
        <>
          <p className="text-xs text-white/30 mb-4">{artists.length} voices available</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
          </div>
        </>
      )}

      <div className="mt-12 bg-hero-gradient rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Are you a voice artist or celebrity?</h2>
            <p className="text-white/60 text-sm max-w-md">
              Monetise your voice on India&apos;s first consent-first voice licensing platform.
              Set your own prices. Control what your voice is used for. Earn royalties every time.
            </p>
          </div>
          <Link
            href="/dashboard/marketplace/my-voice"
            className="shrink-0 flex items-center gap-2 px-5 py-3 bg-white text-brand-700 font-semibold text-sm rounded-xl hover:bg-white/90 transition-colors shadow-card-md"
          >
            <Mic className="w-4 h-4" />
            Start Earning
          </Link>
        </div>
      </div>
    </div>
  );
}
