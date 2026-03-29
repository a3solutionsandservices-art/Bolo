"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, Plus, Upload, Trash2, FileText } from "lucide-react";

interface KnowledgeBase { id: string; name: string; description: string; document_count: number; languages: string[]; created_at: string }
interface KnowledgeDocument { id: string; title: string; filename: string; status: string; chunk_count: number; language: string; file_size_bytes: number }

const STATUS_COLORS: Record<string, string> = {
  ready: "text-emerald-600 bg-emerald-50",
  processing: "text-amber-600 bg-amber-50",
  pending: "text-gray-600 bg-white/[0.03]",
  failed: "text-red-600 bg-red-50",
};

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const [selectedKb, setSelectedKb] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newKbName, setNewKbName] = useState("");

  const { data: kbs } = useQuery<KnowledgeBase[]>({
    queryKey: ["knowledge-bases"],
    queryFn: () => api.knowledge.list().then((r) => r.data),
  });

  const { data: docs } = useQuery<KnowledgeDocument[]>({
    queryKey: ["knowledge-docs", selectedKb],
    queryFn: () => selectedKb ? api.knowledge.listDocuments(selectedKb).then((r) => r.data) : Promise.resolve([]),
    enabled: !!selectedKb,
  });

  const createKb = useMutation({
    mutationFn: (name: string) => api.knowledge.create(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      setShowCreate(false);
      setNewKbName("");
      toast.success("Knowledge base created");
    },
  });

  const uploadDoc = useMutation({
    mutationFn: ({ kbId, file }: { kbId: string; file: File }) =>
      api.knowledge.uploadDocument(kbId, file, file.name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-docs", selectedKb] });
      toast.success("Document uploaded and queued for processing");
    },
    onError: () => toast.error("Upload failed"),
  });

  const deleteDoc = useMutation({
    mutationFn: ({ kbId, docId }: { kbId: string; docId: string }) =>
      api.knowledge.deleteDocument(kbId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-docs", selectedKb] });
      toast.success("Document deleted");
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedKb) {
      uploadDoc.mutate({ kbId: selectedKb, file });
    }
    e.target.value = "";
  };

  const selectedKbData = kbs?.find((kb) => kb.id === selectedKb);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Knowledge Bases</h1>
          <p className="text-gray-500 mt-1">Document collections for AI-powered Q&A</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          New Knowledge Base
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Knowledge Base</h2>
            <input
              value={newKbName}
              onChange={(e) => setNewKbName(e.target.value)}
              placeholder="e.g. Product FAQ"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button
                onClick={() => createKb.mutate(newKbName)}
                disabled={!newKbName || createKb.isPending}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Libraries</h2>
          {(kbs || []).length === 0 && (
            <div className="text-center py-12 bg-white/[0.04] rounded-xl border border-white/[0.07]">
              <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-white/35">No knowledge bases yet</p>
            </div>
          )}
          {(kbs || []).map((kb) => (
            <button
              key={kb.id}
              onClick={() => setSelectedKb(kb.id)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                selectedKb === kb.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-100 bg-white hover:border-brand-200"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/85">{kb.name}</p>
                  <p className="text-xs text-white/35 mt-0.5">{kb.document_count} documents</p>
                </div>
                <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>

        <div className="lg:col-span-2">
          {selectedKb && selectedKbData ? (
            <div className="bg-white/[0.04] rounded-xl border border-white/[0.07] shadow-sm">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{selectedKbData.name}</h2>
                  <p className="text-xs text-white/35">{selectedKbData.document_count} documents</p>
                </div>
                <label className="flex items-center gap-2 px-3 py-2 bg-brand-600 text-white rounded-lg text-sm cursor-pointer hover:bg-brand-700">
                  <Upload className="w-4 h-4" />
                  Upload
                  <input type="file" className="hidden" accept=".txt,.pdf,.md,.json,.csv" onChange={handleFileUpload} />
                </label>
              </div>
              <div className="p-4">
                {(docs || []).length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-white/35">Upload documents to build the knowledge base</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {docs?.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.04] border border-gray-50">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/85 truncate">{doc.title}</p>
                          <p className="text-xs text-white/35">{doc.chunk_count} chunks · {doc.language}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[doc.status] || "bg-gray-50 text-white/60"}`}>
                          {doc.status}
                        </span>
                        <button
                          onClick={() => deleteDoc.mutate({ kbId: selectedKb, docId: doc.id })}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-white/[0.04] rounded-xl border border-white/[0.07] border-dashed">
              <p className="text-gray-400 text-sm">Select a knowledge base to manage documents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
