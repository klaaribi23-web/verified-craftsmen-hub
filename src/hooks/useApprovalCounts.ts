import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const MANDATORY_DOC_IDS = ["rc_pro", "decennale", "kbis", "identite"];

export const useApprovalCounts = () => {
  return useQuery({
    queryKey: ["approval-counts"],
    queryFn: async () => {
      // Get all documents grouped by artisan to find those with ALL 4 mandatory docs
      const { data: allDocs } = await supabase
        .from("artisan_documents")
        .select("artisan_id, name");
      
      // Count mandatory documents per artisan
      const mandatoryDocCountByArtisan: Record<string, Set<string>> = {};
      allDocs?.forEach(doc => {
        if (MANDATORY_DOC_IDS.includes(doc.name)) {
          if (!mandatoryDocCountByArtisan[doc.artisan_id]) {
            mandatoryDocCountByArtisan[doc.artisan_id] = new Set();
          }
          mandatoryDocCountByArtisan[doc.artisan_id].add(doc.name);
        }
      });

      // Get artisan IDs with ALL 4 mandatory documents
      const artisanIdsWithAllDocs = Object.entries(mandatoryDocCountByArtisan)
        .filter(([_, docs]) => docs.size >= MANDATORY_DOC_IDS.length)
        .map(([id]) => id);

      // Get artisan IDs with at least 1 document (for confirmed artisans calculation)
      const artisanIdsWithAnyDocs = [...new Set(allDocs?.map(d => d.artisan_id) || [])];
      
      let pendingArtisansCount = 0;
      if (artisanIdsWithAllDocs.length > 0) {
        const { count } = await supabase
          .from("artisans")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending")
          .not("user_id", "is", null)
          .in("id", artisanIdsWithAllDocs);
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

      // Count confirmed artisans (account created, but not all 4 documents)
      let confirmedArtisans = 0;
      const { data: pendingWithUser } = await supabase
        .from("artisans")
        .select("id")
        .eq("status", "pending")
        .not("user_id", "is", null);
      
      if (pendingWithUser && pendingWithUser.length > 0) {
        const artisanIdsWithAllDocsSet = new Set(artisanIdsWithAllDocs);
        confirmedArtisans = pendingWithUser.filter(a => !artisanIdsWithAllDocsSet.has(a.id)).length;
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
