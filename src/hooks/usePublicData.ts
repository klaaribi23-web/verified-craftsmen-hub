import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  availability: Record<string, string> | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  } | null;
  categories?: {
    id: string;
    name: string;
  }[];
}

// Fetch all pending missions (real data)
export const useDemoMissions = () => {
  return useQuery({
    queryKey: ["public-missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select(`
          *,
          category:categories(id, name),
          client:profiles!missions_client_id_fkey(first_name, last_name, city)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform data to match expected format
      return data?.map(mission => ({
        ...mission,
        client_name: mission.client 
          ? `${mission.client.first_name || ""} ${mission.client.last_name || ""}`.trim() || "Client"
          : "Client",
        client_city: mission.client?.city || mission.city,
        applicants_count: 0, // TODO: Count from mission_applications table
      })) || [];
    },
  });
};

// Fetch all public artisans (active only) - uses secure public_artisans view
export const usePublicArtisans = () => {
  return useQuery({
    queryKey: ["public-artisans"],
    queryFn: async () => {
      // Fetch artisans
      const { data: artisans, error: artisansError } = await supabase
        .from("public_artisans")
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq("status", "active")
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

// Fetch featured artisans (top rated) - uses secure public_artisans view
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
        .eq("status", "active")
        .eq("is_verified", true)
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
          category:categories(id, name)
        `)
        .eq("slug", slugOrId)
        .maybeSingle();

      // If not found by slug, try by ID (for backwards compatibility)
      if (!data && !error) {
        const result = await supabase
          .from("public_artisans")
          .select(`
            *,
            category:categories(id, name)
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
          category:categories(id, name)
        `)
        .eq("artisan_id", data.id);

      return {
        ...data,
        categories: artisanCategories?.map(ac => ac.category).filter(Boolean) || []
      } as ArtisanPublic & { categories: { id: string; name: string }[] };
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
        .eq("status", "active")
        .neq("id", excludeId)
        .order("rating", { ascending: false })
        .limit(6);

      if (error) throw error;
      return data as ArtisanPublic[];
    },
    enabled: !!categoryId,
  });
};