"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";

interface TenantData {
  name?: string;
  logo_url?: string | null;
  primary_color?: string;
  widget_name?: string;
  default_source_language?: string;
  default_target_language?: string;
  supported_languages?: string[];
  widget_allowed_domains?: string[];
}

interface WidgetConfigData {
  embed_snippet?: string;
  tenant_id?: string;
}

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: tenant, isLoading } = useQuery<TenantData>({
    queryKey: ["tenant"],
    queryFn: () => api.tenant.me().then((r) => r.data),
  });

  const { data: widgetConfig } = useQuery<WidgetConfigData>({
    queryKey: ["widget-config"],
    queryFn: () => api.tenant.widgetConfig().then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.tenant.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant"] });
      toast.success("Settings updated");
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const handleCopyEmbed = () => {
    if (widgetConfig?.embed_snippet) {
      navigator.clipboard.writeText(widgetConfig.embed_snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return <div className="flex h-screen bg-gray-50"><Sidebar /><main className="flex-1 p-8"><div className="animate-pulse space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-200 rounded" />)}</div></main></div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Branding</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input
                  defaultValue={tenant?.name || ""}
                  onBlur={(e) => mutation.mutate({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Widget Name</label>
                <input
                  defaultValue={tenant?.widget_name || ""}
                  onBlur={(e) => mutation.mutate({ widget_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    defaultValue={tenant?.primary_color || "#6366f1"}
                    onBlur={(e) => mutation.mutate({ primary_color: e.target.value })}
                    className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">{tenant?.primary_color || "#6366f1"}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Language Defaults</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { field: "default_source_language", label: "Default Source Language" },
                { field: "default_target_language", label: "Default Target Language" },
              ].map(({ field, label }) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <select
                    defaultValue={(tenant as Record<string, unknown>)?.[field] as string || "en"}
                    onChange={(e) => mutation.mutate({ [field]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {[["hi", "Hindi"], ["ta", "Tamil"], ["te", "Telugu"], ["bn", "Bengali"], ["gu", "Gujarati"], ["mr", "Marathi"], ["en", "English"]].map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Embed Widget</h2>
              <button
                onClick={handleCopyEmbed}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy code"}
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Add this snippet before the closing &lt;/body&gt; tag on your website.</p>
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
              {widgetConfig?.embed_snippet || "Loading..."}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
