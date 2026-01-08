import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SUBSCRIPTION_PLANS } from "@/config/subscriptionPlans";
import type { SubscriptionTier } from "@/config/subscriptionPlans";

interface MissionLimitState {
  appliedThisMonth: number;
  limit: number | "unlimited";
  canApply: boolean;
  tier: SubscriptionTier;
  isLoading: boolean;
}

export const useMissionApplicationLimit = () => {
  const { user } = useAuth();
  const [state, setState] = useState<MissionLimitState>({
    appliedThisMonth: 0,
    limit: 1,
    canApply: true,
    tier: "free",
    isLoading: true,
  });

  const checkLimit = useCallback(async () => {
    if (!user) {
      setState({
        appliedThisMonth: 0,
        limit: 1,
        canApply: true,
        tier: "free",
        isLoading: false,
      });
      return;
    }

    try {
      // Get artisan data
      const { data: artisan, error } = await supabase
        .from("artisans")
        .select("subscription_tier, missions_applied_this_month, last_mission_reset")
        .eq("user_id", user.id)
        .single();

      if (error || !artisan) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const tier = (artisan.subscription_tier || "free") as SubscriptionTier;
      const plan = SUBSCRIPTION_PLANS.find((p) => p.id === tier);
      const limit = plan?.features.missionsPerMonth || 1;
      const applied = artisan.missions_applied_this_month || 0;

      const canApply = limit === "unlimited" || applied < limit;

      setState({
        appliedThisMonth: applied,
        limit,
        canApply,
        tier,
        isLoading: false,
      });
    } catch (err) {
      console.error("Error checking mission limit:", err);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  const incrementApplicationCount = async () => {
    if (!user) return false;

    try {
      const { data: artisan, error: fetchError } = await supabase
        .from("artisans")
        .select("id, missions_applied_this_month")
        .eq("user_id", user.id)
        .single();

      if (fetchError || !artisan) return false;

      const { error: updateError } = await supabase
        .from("artisans")
        .update({
          missions_applied_this_month: (artisan.missions_applied_this_month || 0) + 1,
        })
        .eq("id", artisan.id);

      if (updateError) return false;

      await checkLimit();
      return true;
    } catch (err) {
      console.error("Error incrementing application count:", err);
      return false;
    }
  };

  useEffect(() => {
    checkLimit();
  }, [checkLimit]);

  return {
    ...state,
    checkLimit,
    incrementApplicationCount,
  };
};
