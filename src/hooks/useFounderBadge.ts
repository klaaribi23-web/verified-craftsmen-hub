import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Cache the first 20 subscriber IDs globally
let founderIds: string[] | null = null;

export const useFounderBadge = (artisanId?: string) => {
  const { data: founders = [] } = useQuery({
    queryKey: ["founder-artisans"],
    queryFn: async () => {
      if (founderIds) return founderIds;
      
      // Get first 20 unique artisans who subscribed (by subscription_events)
      const { data } = await supabase
        .from("subscription_events")
        .select("artisan_id")
        .eq("event_type", "checkout.session.completed")
        .order("created_at", { ascending: true })
        .limit(100);

      const uniqueIds: string[] = [];
      const seen = new Set<string>();
      for (const row of data || []) {
        if (row.artisan_id && !seen.has(row.artisan_id)) {
          seen.add(row.artisan_id);
          uniqueIds.push(row.artisan_id);
          if (uniqueIds.length >= 20) break;
        }
      }
      
      founderIds = uniqueIds;
      return uniqueIds;
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  });

  return {
    isFounder: artisanId ? founders.includes(artisanId) : false,
    founderIds: founders,
  };
};
