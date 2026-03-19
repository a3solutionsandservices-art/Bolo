"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export function usePlan() {
  const { isAuthenticated } = useAuthStore();
  const { data } = useQuery({
    queryKey: ["billing-usage-plan"],
    queryFn: () => api.billing.usage().then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });
  const tier = data?.plan_tier ?? "starter";
  return {
    tier,
    isStarter: tier === "starter",
    isGrowth: tier === "growth",
    isEnterprise: tier === "enterprise",
    isPaid: tier !== "starter",
  };
}
