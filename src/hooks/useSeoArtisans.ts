import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SeoCity, SeoMetier } from "./useSeoData";

export const useSeoArtisans = (metier: SeoMetier | null | undefined, city: SeoCity | null | undefined) => {
  return useQuery({
    queryKey: ["seo-artisans", metier?.id, city?.id],
    queryFn: async () => {
      if (!metier || !city) return [];

      // Get categories matching this metier's category_name
      const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .ilike("name", `%${metier.category_name}%`);

      const categoryIds = categories?.map((c) => c.id) || [];

      if (categoryIds.length === 0) return [];

      // Get artisan IDs that have matching categories
      const { data: artisanCategories } = await supabase
        .from("artisan_categories")
        .select("artisan_id")
        .in("category_id", categoryIds);

      const artisanIds = [...new Set(artisanCategories?.map((ac) => ac.artisan_id) || [])];

      if (artisanIds.length === 0) return [];

      // Fetch public artisans matching these IDs
      const { data: artisans, error } = await supabase
        .from("public_artisans")
        .select("*")
        .in("id", artisanIds)
        .in("status", ["active", "prospect"]);

      if (error) throw error;
      if (!artisans) return [];

      // Filter by proximity (within intervention_radius or same city/department)
      const filtered = artisans.filter((a) => {
        if (a.city?.toLowerCase() === city.name.toLowerCase()) return true;
        if (a.department === city.department) return true;
        if (a.latitude && a.longitude) {
          const dist = Math.sqrt(
            Math.pow((a.latitude - city.latitude) * 111, 2) +
            Math.pow((a.longitude - city.longitude) * 111 * Math.cos(city.latitude * Math.PI / 180), 2)
          );
          return dist <= (a.intervention_radius || 50);
        }
        return false;
      });

      // Filter by subscription_status = active (only paying artisans)
      return filtered.filter((a) => a.subscription_status === 'active' || a.status === 'active');
    },
    enabled: !!metier && !!city,
  });
};
