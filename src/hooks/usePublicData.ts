import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DemoMission {
  id: string;
  client_name: string;
  client_city: string;
  title: string;
  description: string | null;
  category_id: string | null;
  budget: number | null;
  city: string;
  status: string;
  applicants_count: number | null;
  created_at: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface ArtisanPublic {
  id: string;
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
}

// Fetch all demo missions
export const useDemoMissions = () => {
  return useQuery({
    queryKey: ["demo-missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("demo_missions")
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as DemoMission[];
    },
  });
};

// Fetch all public artisans (active only) - uses secure public_artisans view
export const usePublicArtisans = () => {
  return useQuery({
    queryKey: ["public-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_artisans")
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq("status", "active")
        .order("rating", { ascending: false });

      if (error) throw error;
      return data as ArtisanPublic[];
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

// Fetch single artisan by ID - uses secure public_artisans view
export const useArtisanById = (id: string) => {
  return useQuery({
    queryKey: ["artisan", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_artisans")
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as ArtisanPublic | null;
    },
    enabled: !!id,
  });
};

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
