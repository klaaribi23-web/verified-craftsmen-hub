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
  hourly_rate: number | null;
  experience_years: number | null;
  rating: number | null;
  review_count: number | null;
  missions_completed: number | null;
  photo_url: string | null;
  portfolio_images: string[] | null;
  is_verified: boolean | null;
  status: string;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string;
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

// Fetch all public artisans (active only)
export const usePublicArtisans = () => {
  return useQuery({
    queryKey: ["public-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
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

// Fetch featured artisans (top rated)
export const useFeaturedArtisans = () => {
  return useQuery({
    queryKey: ["featured-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
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

// Fetch categories
export const usePublicCategories = () => {
  return useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
};

// Fetch single artisan by ID
export const useArtisanById = (id: string) => {
  return useQuery({
    queryKey: ["artisan", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
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
