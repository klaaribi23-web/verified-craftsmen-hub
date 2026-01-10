import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useApprovalCounts = () => {
  return useQuery({
    queryKey: ["approval-counts"],
    queryFn: async () => {
      // Count pending artisans (with documents - awaiting document validation)
      // First get artisan IDs that have documents
      const { data: artisansWithDocs } = await supabase
        .from("artisan_documents")
        .select("artisan_id");
      
      const artisanIdsWithDocs = [...new Set(artisansWithDocs?.map(d => d.artisan_id) || [])];
      
      let pendingArtisansCount = 0;
      if (artisanIdsWithDocs.length > 0) {
        const { count } = await supabase
          .from("artisans")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .not("user_id", "is", null)
          .in("id", artisanIdsWithDocs);
        pendingArtisansCount = count || 0;
      }

      // Count pending missions (awaiting admin approval)
      const { count: pendingMissions } = await supabase
        .from("missions")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_approval");

      // Count prospect artisans (vitrines actives - awaiting prospection)
      const { count: prospectArtisans } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "prospect");

      // Count waiting artisans (email sent, account not created)
      const { count: waitingArtisans } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .is("user_id", null)
        .not("activation_sent_at", "is", null);

      // Count confirmed artisans (account created, no documents)
      let confirmedArtisans = 0;
      const { data: pendingWithUser } = await supabase
        .from("artisans")
        .select("id")
        .eq("status", "pending")
        .not("user_id", "is", null);
      
      if (pendingWithUser && pendingWithUser.length > 0) {
        const artisanIdsWithDocsSet = new Set(artisanIdsWithDocs);
        confirmedArtisans = pendingWithUser.filter(a => !artisanIdsWithDocsSet.has(a.id)).length;
      }

      // Count pending documents (awaiting validation)
      const { count: pendingDocuments } = await supabase
        .from("artisan_documents")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

      return {
        pendingArtisans: pendingArtisansCount,
        pendingMissions: pendingMissions || 0,
        prospectArtisans: prospectArtisans || 0,
        waitingArtisans: waitingArtisans || 0,
        confirmedArtisans: confirmedArtisans,
        pendingDocuments: pendingDocuments || 0,
        totalApprovals: pendingArtisansCount + (pendingMissions || 0),
        totalVitrines: (prospectArtisans || 0) + (waitingArtisans || 0) + confirmedArtisans,
        total: pendingArtisansCount + (pendingMissions || 0) + (prospectArtisans || 0) + (pendingDocuments || 0)
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });
};
