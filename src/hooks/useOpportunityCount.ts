import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

/**
 * Returns the count of open missions matching the artisan's categories.
 */
export const useOpportunityCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["opportunity-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Get artisan's category IDs
      const { data: artisan } = await supabase
        .from("artisans")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!artisan) return 0;

      const { data: artisanCats } = await supabase
        .from("artisan_categories")
        .select("category_id")
        .eq("artisan_id", artisan.id);

      const categoryIds = artisanCats?.map((c) => c.category_id) || [];

      // Also get the artisan's main category_id
      const { data: artisanMain } = await supabase
        .from("artisans")
        .select("category_id")
        .eq("id", artisan.id)
        .single();

      if (artisanMain?.category_id) {
        categoryIds.push(artisanMain.category_id);
      }

      if (categoryIds.length === 0) return 0;

      // Count open/published missions in those categories
      const { count, error } = await supabase
        .from("missions")
        .select("id", { count: "exact", head: true })
        .in("category_id", categoryIds)
        .in("status", ["published", "pending_approval"]);

      if (error) return 0;
      return count || 0;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // refresh every minute
  });
};
