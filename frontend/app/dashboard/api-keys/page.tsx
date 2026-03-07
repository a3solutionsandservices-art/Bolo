"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { Key, Plus, Copy, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
}

interface NewKeyData {
  id: string;
  name: string;
  key: string;
  key_prefix: string;
  scopes: string[];
  created_at: string;
}

export default function APIKeysPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  const { data: keys } = useQuery<APIKey[]>({
    queryKey: ["api-keys"],
    queryFn: () => api.auth.listApiKeys().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => api.auth.createApiKey(name).then((r) => r.data),
    onSuccess: (data: NewKeyData) => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      setCreatedKey(data.key);
      setShowCreate(false);
      setNewKeyName("");
    },
    onError: () => toast.error("Failed to create API key"),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.auth.revokeApiKey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
    },
  });

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 mt-1">Manage developer access keys</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </button>
      </div>

      {createdKey && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-emerald-800 mb-2">
            Copy your API key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-3 bg-white border border-emerald-200 rounded-lg px-3 py-2">
            <code className="flex-1 text-sm font-mono text-gray-900 break-all">{createdKey}</code>
            <button onClick={() => copyKey(createdKey)} className="text-emerald-600 hover:text-emerald-700">
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setCreatedKey(null)} className="mt-2 text-xs text-emerald-700 hover:underline">
            I&apos;ve saved my key
          </button>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create API Key</h2>
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Widget"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm">Cancel</button>
              <button
                onClick={() => createMutation.mutate(newKeyName)}
                disabled={!newKeyName || createMutation.isPending}
                className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {(keys || []).length === 0 ? (
          <div className="text-center py-16">
            <Key className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No API keys yet</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-brand-600 hover:underline">
              Create your first API key
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Name", "Key", "Scopes", "Last Used", "Created"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {keys?.map((key) => (
                <tr key={key.id}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{key.name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono bg-gray-50 px-2 py-1 rounded text-gray-600">
                      vai_{key.key_prefix}••••••••
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {key.scopes.map((s) => (
                        <span key={s} className="px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded text-xs">{s}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {key.last_used_at ? formatDistanceToNow(new Date(key.last_used_at), { addSuffix: true }) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDistanceToNow(new Date(key.created_at), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        if (confirm("Revoke this API key? This cannot be undone.")) {
                          revokeMutation.mutate(key.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
