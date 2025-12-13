import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useApprovalCounts = () => {
  return useQuery({
    queryKey: ["approval-counts"],
    queryFn: async () => {
      // Count pending artisans (awaiting document validation)
      const { count: pendingArtisans } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      // Count pending missions (awaiting admin approval)
      const { count: pendingMissions } = await supabase
        .from("missions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_approval");

      // Count prospect artisans (awaiting activation)
      const { count: prospectArtisans } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "prospect");

      return {
        pendingArtisans: pendingArtisans || 0,
        pendingMissions: pendingMissions || 0,
        prospectArtisans: prospectArtisans || 0,
        total: (pendingArtisans || 0) + (pendingMissions || 0) + (prospectArtisans || 0)
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });
};
