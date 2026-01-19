import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Mission {
  id: string;
  client_id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  budget: number | null;
  city: string;
  status: string;
  created_at: string;
  photos?: string[] | null;
  category?: {
    id: string;
    name: string;
  } | null;
  client?: {
    first_name: string | null;
    last_name: string | null;
    city: string | null;
  } | null;
}

export interface ArtisanPublic {
  id: string;
  slug: string | null;
  business_name: string;
  description: string | null;
  city: string;
  department: string | null;
  region: string | null;
  address: string | null;
  postal_code: string | null;
  hourly_rate: number | null;
  experience_years: number | null;
  rating: number | null;
  review_count: number | null;
  missions_completed: number | null;
  photo_url: string | null;
  portfolio_images: string[] | null;
  portfolio_videos: string[] | null;
  is_verified: boolean | null;
  status: string;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  qualifications: string[] | null;
  working_hours: Record<string, unknown> | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  google_id: string | null;
  google_maps_url: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  subscription_tier?: string | null;
  display_priority?: number | null;
  intervention_radius?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  category?: {
    id: string;
    name: string;
    icon?: string | null;
  } | null;
  categories?: {
    id: string;
    name: string;
    icon?: string | null;
  }[];
}

// Hook for realtime subscription to mission applications
export const useMissionApplicationsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('mission-applications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mission_applications',
        },
        () => {
          // Invalidate the query to refetch data when applications change
          queryClient.invalidateQueries({ queryKey: ["public-missions"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

// Fetch all pending missions (real data) with dynamic applicant count and user's application status
// userId and userRole are passed as parameters to avoid hook dependency issues
export const useDemoMissions = (userId?: string, userRole?: string) => {
  // Subscribe to realtime updates
  useMissionApplicationsRealtime();

  return useQuery({
    queryKey: ["public-missions", userId],
    queryFn: async () => {
      // 1. Fetch missions
      const { data: missions, error } = await supabase
        .from("missions")
        .select(`
          *,
          category:categories(id, name),
          client:profiles!missions_client_id_fkey(first_name, last_name, city)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!missions || missions.length === 0) return [];

      const missionIds = missions.map(m => m.id);

      // 2. Fetch applicant counts from mission_applications
      const { data: applicationsData, error: appError } = await supabase
        .from("mission_applications")
        .select("mission_id")
        .in("mission_id", missionIds);

      if (appError) throw appError;

      // 3. Count applicants per mission
      const applicantsCounts = new Map<string, number>();
      applicationsData?.forEach(app => {
        const count = applicantsCounts.get(app.mission_id) || 0;
        applicantsCounts.set(app.mission_id, count + 1);
      });

      // 4. Fetch artisan's own applications if logged in as artisan
      let myAppliedMissions = new Set<string>();
      if (userId && userRole === "artisan") {
        const { data: artisanData } = await supabase
          .from("artisans")
          .select("id")
          .eq("user_id", userId)
          .single();

        if (artisanData?.id) {
          const { data: myApplications } = await supabase
            .from("mission_applications")
            .select("mission_id")
            .eq("artisan_id", artisanData.id)
            .in("mission_id", missionIds);

          myApplications?.forEach(app => {
            myAppliedMissions.add(app.mission_id);
          });
        }
      }

      // 5. Transform data with real applicant count + fake applicants and application status
      return missions.map(mission => {
        const realApplicants = applicantsCounts.get(mission.id) || 0;
        const fakeApplicants = (mission as any).fake_applicants_count || 0;
        
        return {
          ...mission,
          client_name: mission.client 
            ? `${mission.client.first_name || ""} ${mission.client.last_name || ""}`.trim() || "Client"
            : "Client",
          client_city: mission.client?.city || mission.city,
          applicants_count: realApplicants + fakeApplicants,
          has_applied: myAppliedMissions.has(mission.id),
        };
      });
    },
  });
};

// Fetch all public artisans (active + prospect) - uses secure public_artisans view
export const usePublicArtisans = () => {
  return useQuery({
    queryKey: ["public-artisans"],
    queryFn: async () => {
      // Fetch artisans (active + prospect for showcase profiles)
      const { data: artisans, error: artisansError } = await supabase
        .from("public_artisans")
        .select(`
          *,
          category:categories(id, name)
        `)
        .in("status", ["active", "prospect"])
        .order("display_priority", { ascending: true, nullsFirst: false })
        .order("rating", { ascending: false });

      if (artisansError) throw artisansError;

      // Fetch all artisan categories
      const { data: artisanCategories, error: catError } = await supabase
        .from("artisan_categories")
        .select(`
          artisan_id,
          category:categories(id, name)
        `);

      if (catError) throw catError;

      // Map categories to artisans
      const artisansWithCategories = artisans?.map(artisan => ({
        ...artisan,
        categories: artisanCategories
          ?.filter(ac => ac.artisan_id === artisan.id)
          .map(ac => ac.category)
          .filter(Boolean) || []
      })) || [];

      return artisansWithCategories as (ArtisanPublic & { categories: { id: string; name: string }[] })[];
    },
  });
};

// Fetch featured artisans (top rated, active + prospect) - uses secure public_artisans view
export const useFeaturedArtisans = () => {
  return useQuery({
    queryKey: ["featured-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_artisans")
        .select(`
          *,
          category:categories(id, name)
        `)
        .in("status", ["active", "prospect"])
        .order("display_priority", { ascending: true, nullsFirst: false })
        .order("rating", { ascending: false })
        .limit(12);

      if (error) throw error;
      return data as ArtisanPublic[];
    },
  });
};

// Re-export categories hooks from useCategories for backwards compatibility
export { 
  useCategories as usePublicCategories,
  useCategoriesWithCount 
} from "./useCategories";

// Fetch single artisan by slug or ID - uses secure public_artisans view
export const useArtisanBySlug = (slugOrId: string) => {
  return useQuery({
    queryKey: ["artisan", slugOrId],
    queryFn: async () => {
      // Try by slug first
      let { data, error } = await supabase
        .from("public_artisans")
        .select(`
          *,
          category:categories(id, name, icon)
        `)
        .eq("slug", slugOrId)
        .maybeSingle();

      // If not found by slug, try by ID (for backwards compatibility)
      if (!data && !error) {
        const result = await supabase
          .from("public_artisans")
          .select(`
            *,
            category:categories(id, name, icon)
          `)
          .eq("id", slugOrId)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      if (!data) return null;

      // Fetch multiple categories from junction table
      const { data: artisanCategories } = await supabase
        .from("artisan_categories")
        .select(`
          category:categories(id, name, icon)
        `)
        .eq("artisan_id", data.id);

      return {
        ...data,
        categories: artisanCategories?.map(ac => ac.category).filter(Boolean) || []
      } as ArtisanPublic & { categories: { id: string; name: string; icon?: string | null }[] };
    },
    enabled: !!slugOrId,
  });
};

// Alias for backwards compatibility
export const useArtisanById = useArtisanBySlug;

// Fetch artisan services
export const useArtisanServices = (artisanId: string) => {
  return useQuery({
    queryKey: ["artisan-services", artisanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisan_services")
        .select("*")
        .eq("artisan_id", artisanId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!artisanId,
  });
};

// Fetch artisan reviews
export const useArtisanReviews = (artisanId: string) => {
  return useQuery({
    queryKey: ["artisan-reviews", artisanId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select(`
          *,
          client:profiles!reviews_client_id_fkey(first_name, last_name)
        `)
        .eq("artisan_id", artisanId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!artisanId,
  });
};

// Fetch similar artisans (same category, different id) - uses secure public_artisans view
export const useSimilarArtisans = (categoryId: string | null, excludeId: string) => {
  return useQuery({
    queryKey: ["similar-artisans", categoryId, excludeId],
    queryFn: async () => {
      if (!categoryId) return [];
      
      const { data, error } = await supabase
        .from("public_artisans")
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq("category_id", categoryId)
        .in("status", ["active", "prospect"])
        .neq("id", excludeId)
        .order("rating", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as ArtisanPublic[];
    },
    enabled: !!categoryId,
  });
};