"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { Mic, Plus, Upload, Trash2, Play, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface VoiceClone {
  id: string;
  name: string;
  description: string | null;
  language: string;
  status: "pending" | "training" | "ready" | "failed";
  sarvam_voice_id: string | null;
  is_default: boolean;
  sample_audio_urls: string[];
  created_at: string;
}

const STATUS_CONFIG: Record<VoiceClone["status"], {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}> = {
  pending: { label: "Pending", icon: Clock, color: "text-gray-500 bg-white/[0.03]" },
  training: { label: "Training", icon: Loader2, color: "text-amber-600 bg-amber-50" },
  ready: { label: "Ready", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  failed: { label: "Failed", icon: AlertCircle, color: "text-red-600 bg-red-50" },
};

const LANGUAGES = [
  { code: "hi", name: "Hindi" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "bn", name: "Bengali" },
  { code: "gu", name: "Gujarati" },
  { code: "mr", name: "Marathi" },
  { code: "kn", name: "Kannada" },
  { code: "ml", name: "Malayalam" },
  { code: "pa", name: "Punjabi" },
  { code: "or", name: "Odia" },
  { code: "en", name: "English" },
];

export default function VoiceClonesPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLang, setNewLang] = useState("hi");

  const { data: clones, isLoading } = useQuery<VoiceClone[]>({
    queryKey: ["voice-clones"],
    queryFn: () => api.voiceClones.list().then((r) => r.data),
    refetchInterval: (query) => {
      const data = query.state.data as VoiceClone[] | undefined;
      return data?.some((c) => c.status === "training") ? 5000 : false;
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.voiceClones.create({ name: newName, description: newDesc || undefined, language: newLang }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-clones"] });
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      toast.success("Voice clone created");
    },
    onError: () => toast.error("Failed to create voice clone"),
  });

  const trainMutation = useMutation({
    mutationFn: (id: string) => api.voiceClones.train(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-clones"] });
      toast.success("Training started — this may take a few minutes");
    },
    onError: (err: unknown) => {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail || "Failed to start training");
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.voiceClones.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-clones"] });
      toast.success("Default voice updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.voiceClones.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["voice-clones"] });
      toast.success("Voice clone deleted");
    },
  });

  const handleUploadSample = async (cloneId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      await api.voiceClones.uploadSample(cloneId, file);
      queryClient.invalidateQueries({ queryKey: ["voice-clones"] });
      toast.success("Sample uploaded");
    } catch {
      toast.error("Upload failed — check file size (max 50 MB)");
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Voice Clones</h1>
          <p className="text-gray-500 mt-1">Create branded AI voices for your assistant</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          New Voice Clone
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Voice Clone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Priya Support Voice"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-white/35">(optional)</span>
                </label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description of the voice"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                <select
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowCreate(false); setNewName(""); setNewDesc(""); }}
                className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newName.trim() || createMutation.isPending}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {createMutation.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>How it works:</strong> Create a voice clone, upload 3–10 audio samples (WAV/MP3, 10–60s each),
        then click &ldquo;Start Training&rdquo; to submit to Sarvam AI. Training takes a few minutes.
        Once ready, set it as your default voice.
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (clones || []).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/[0.04] rounded-xl border border-white/[0.07]">
          <Mic className="w-12 h-12 text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium">No voice clones yet</p>
          <p className="text-gray-400 text-sm mt-1 text-center max-w-sm">
            Upload audio samples of a speaker to create a custom AI voice for your assistant
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium"
          >
            Create your first voice clone
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {(clones || []).map((clone) => {
            const { icon: StatusIcon, label: statusLabel, color: statusColor } =
              STATUS_CONFIG[clone.status] ?? STATUS_CONFIG.pending;

            return (
              <div
                key={clone.id}
                className={`bg-white rounded-xl border-2 ${
                  clone.is_default ? "border-brand-300" : "border-gray-100"
                } shadow-sm p-6`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Mic className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-gray-900">{clone.name}</h3>
                        {clone.is_default && (
                          <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-medium rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {LANGUAGES.find((l) => l.code === clone.language)?.name} ·{" "}
                        {clone.sample_audio_urls.length} sample
                        {clone.sample_audio_urls.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    <StatusIcon
                      className={`w-3.5 h-3.5 ${clone.status === "training" ? "animate-spin" : ""}`}
                    />
                    {statusLabel}
                  </span>
                </div>

                {clone.description && (
                  <p className="text-sm text-gray-500 mb-3">{clone.description}</p>
                )}

                {clone.sarvam_voice_id && (
                  <p className="text-xs text-white/30 mb-3 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                    Voice ID: {clone.sarvam_voice_id}
                  </p>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg text-sm cursor-pointer hover:bg-white/[0.04] transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Sample
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleUploadSample(clone.id, e)}
                    />
                  </label>

                  {(clone.status === "pending" || clone.status === "failed") && clone.sample_audio_urls.length > 0 && (
                    <button
                      onClick={() => trainMutation.mutate(clone.id)}
                      disabled={trainMutation.isPending}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-white transition-colors disabled:opacity-50 ${
                        clone.status === "failed" ? "bg-amber-500 hover:bg-amber-600" : "bg-brand-600 hover:bg-brand-700"
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {clone.status === "failed" ? "Retry Training" : "Start Training"}
                    </button>
                  )}

                  {clone.status === "ready" && !clone.is_default && (
                    <button
                      onClick={() => setDefaultMutation.mutate(clone.id)}
                      disabled={setDefaultMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Set as Default
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Delete "${clone.name}"? This cannot be undone.`)) {
                        deleteMutation.mutate(clone.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="ml-auto p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {clone.status === "pending" && clone.sample_audio_urls.length === 0 && (
                  <p className="text-xs text-amber-600 mt-3">
                    Upload at least one audio sample to begin training.
                  </p>
                )}

                <p className="text-xs text-white/30 mt-3">
                  Created {formatDistanceToNow(new Date(clone.created_at), { addSuffix: true })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
