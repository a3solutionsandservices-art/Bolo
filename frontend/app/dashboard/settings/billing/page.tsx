"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Check, CreditCard } from "lucide-react";

interface Plan {
  tier: string;
  name: string;
  price_monthly: number | null;
  limits: { stt_minutes: number; tts_characters: number; conversations: number };
}

interface UsageData {
  plan_tier: string;
  period_start: string;
  limits: { stt_minutes: number; tts_characters: number; conversations: number };
  usage: { stt_minutes: number; tts_characters: number; conversations: number; translations: number };
}

function UsageBar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit < 0 ? 0 : Math.min(100, (used / limit) * 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-medium">
          {limit < 0 ? `${used.toLocaleString()} / Unlimited` : `${used.toLocaleString()} / ${limit.toLocaleString()}`}
        </span>
      </div>
      {limit >= 0 && (
        <div className="h-2 bg-gray-100 rounded-full">
          <div
            className={`h-2 rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-amber-500" : "bg-brand-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  const { data: plans } = useQuery<Plan[]>({
    queryKey: ["billing-plans"],
    queryFn: () => api.billing.plans().then((r) => r.data),
  });

  const { data: usage } = useQuery<UsageData>({
    queryKey: ["billing-usage"],
    queryFn: () => api.billing.usage().then((r) => r.data),
  });

  const subscribeMutation = useMutation({
    mutationFn: (tier: string) =>
      api.billing.subscribe(
        tier,
        `${window.location.origin}/dashboard/settings/billing?success=true`,
        `${window.location.origin}/dashboard/settings/billing`
      ).then((r) => r.data),
    onSuccess: (data: { checkout_url?: string }) => {
      if (data.checkout_url) window.location.href = data.checkout_url;
    },
    onError: () => toast.error("Failed to start checkout"),
  });

  const portalMutation = useMutation({
    mutationFn: () =>
      api.billing.portal(`${window.location.origin}/dashboard/settings/billing`).then((r) => r.data),
    onSuccess: (data: { portal_url?: string }) => {
      if (data.portal_url) window.location.href = data.portal_url;
    },
    onError: () => toast.error("Failed to open billing portal"),
  });

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
            <p className="text-gray-500 mt-1">Manage your plan and usage</p>
          </div>
          <button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <CreditCard className="w-4 h-4" />
            Manage Billing
          </button>
        </div>

        {usage && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Current Usage</h2>
              <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs font-medium capitalize">
                {usage.plan_tier} plan
              </span>
            </div>
            <div className="space-y-4">
              <UsageBar used={usage.usage.stt_minutes} limit={usage.limits.stt_minutes} label="STT Minutes" />
              <UsageBar used={usage.usage.tts_characters} limit={usage.limits.tts_characters} label="TTS Characters" />
              <UsageBar used={usage.usage.conversations} limit={usage.limits.conversations} label="Conversations" />
            </div>
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(plans || []).map((plan) => {
            const isCurrent = usage?.plan_tier === plan.tier;
            const PLAN_META: Record<string, { outcome: string; tagline: string; features: string[] }> = {
              starter: {
                outcome: "Handle up to 1,000 customer queries / month",
                tagline: "Perfect for getting started",
                features: [
                  `${plan.limits.conversations < 0 ? "Unlimited" : plan.limits.conversations.toLocaleString()} conversations / month`,
                  `${plan.limits.stt_minutes < 0 ? "Unlimited" : plan.limits.stt_minutes.toLocaleString()} transcription minutes`,
                  "3 Knowledge Bases",
                  "11 Indian languages",
                  "Website widget embed",
                ],
              },
              growth: {
                outcome: "Handle up to 10,000+ customer queries / month",
                tagline: "For growing businesses",
                features: [
                  `${plan.limits.conversations < 0 ? "Unlimited" : plan.limits.conversations.toLocaleString()} conversations / month`,
                  `${plan.limits.stt_minutes < 0 ? "Unlimited" : plan.limits.stt_minutes.toLocaleString()} transcription minutes`,
                  "20 Knowledge Bases",
                  "Voice Cloning — your brand voice",
                  "Voice Marketplace access",
                  "Priority support",
                ],
              },
              enterprise: {
                outcome: "Unlimited queries — zero cap, SLA guaranteed",
                tagline: "Unlimited scale, dedicated support",
                features: [
                  "Unlimited conversations",
                  "Unlimited transcription",
                  "Unlimited Knowledge Bases",
                  "Dialect fine-tuning",
                  "Dedicated account manager",
                  "Custom SLA & uptime guarantee",
                ],
              },
            };
            const meta = PLAN_META[plan.tier] || PLAN_META.starter;
            return (
              <div
                key={plan.tier}
                className={`bg-white rounded-xl p-6 border-2 ${isCurrent ? "border-brand-500" : "border-gray-100"} shadow-sm relative`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-600 text-white text-xs rounded-full font-medium">
                    Current Plan
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">{meta.tagline}</p>
                <div className="mb-1">
                  {plan.price_monthly ? (
                    <span className="text-3xl font-bold text-gray-900">₹{plan.price_monthly}<span className="text-base font-normal text-gray-500">/mo</span></span>
                  ) : (
                    <span className="text-2xl font-bold text-gray-900">Custom</span>
                  )}
                </div>
                <p className="text-xs font-semibold text-brand-600 mb-5">{meta.outcome}</p>
                <ul className="space-y-2 mb-6 text-sm text-gray-600">
                  {meta.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.price_monthly ? (
                  <button
                    onClick={() => subscribeMutation.mutate(plan.tier)}
                    disabled={isCurrent || subscribeMutation.isPending}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isCurrent
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-brand-600 text-white hover:bg-brand-700"
                    }`}
                  >
                    {isCurrent ? "Current Plan" : "Upgrade"}
                  </button>
                ) : (
                  <a href="mailto:sales@bolo.ai" className="block w-full py-2.5 border border-brand-600 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors text-center">
                    Talk to sales
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
