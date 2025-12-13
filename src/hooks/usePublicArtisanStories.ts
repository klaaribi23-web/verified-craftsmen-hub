import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePublicArtisanStories = (artisanId: string | undefined) => {
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["public-artisan-stories", artisanId],
    queryFn: async () => {
      if (!artisanId) return [];

      const { data, error } = await supabase
        .from("artisan_stories")
        .select("id, media_url, media_type, created_at, expires_at")
        .eq("artisan_id", artisanId)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching public stories:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!artisanId,
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    stories,
    hasActiveStories: stories.length > 0,
    isLoading,
  };
};
