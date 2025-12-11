import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Artisan {
  id: string;
  profile_id: string | null;
  business_name: string;
  description: string | null;
  category_id: string | null;
  city: string;
  department: string | null;
  region: string | null;
  hourly_rate: number | null;
  experience_years: number | null;
  status: "active" | "suspended" | "pending";
  is_verified: boolean | null;
  rating: number | null;
  review_count: number | null;
  missions_completed: number | null;
  photo_url: string | null;
  portfolio_images: string[] | null;
  siret: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
}

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  created_at: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  budget: number | null;
  city: string;
  status: "pending" | "assigned" | "completed" | "cancelled";
  created_at: string;
  client_id: string;
  category_id: string | null;
}

// Fetch all artisans
export const useArtisans = () => {
  return useQuery({
    queryKey: ["admin-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select(`
          *,
          category:categories(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Artisan[];
    },
  });
};

// Fetch all categories
export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Category[];
    },
  });
};

// Fetch all profiles (clients)
export const useProfiles = () => {
  return useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });
};

// Fetch all missions
export const useMissions = () => {
  return useQuery({
    queryKey: ["admin-missions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("missions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Mission[];
    },
  });
};

// Fetch dashboard stats
export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Get artisans count
      const { count: artisansCount } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true });

      // Get profiles count (clients)
      const { count: clientsCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get missions counts
      const { data: missions } = await supabase
        .from("missions")
        .select("status");

      const activeMissions = missions?.filter((m) => m.status === "pending" || m.status === "assigned").length || 0;
      const completedMissions = missions?.filter((m) => m.status === "completed").length || 0;
      const cancelledMissions = missions?.filter((m) => m.status === "cancelled").length || 0;

      return {
        totalArtisans: artisansCount || 0,
        totalClients: clientsCount || 0,
        activeMissions,
        completedMissions,
        cancelledMissions,
        totalMissions: missions?.length || 0,
      };
    },
  });
};

// Fetch new artisans (last 7 days)
export const useNewArtisans = () => {
  return useQuery({
    queryKey: ["new-artisans"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("artisans")
        .select(`
          *,
          category:categories(id, name)
        `)
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Artisan[];
    },
  });
};

// Fetch top artisans (by missions completed)
export const useTopArtisans = () => {
  return useQuery({
    queryKey: ["top-artisans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select(`
          *,
          category:categories(id, name)
        `)
        .eq("status", "active")
        .order("missions_completed", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Artisan[];
    },
  });
};

// Update artisan status
export const useUpdateArtisanStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "active" | "suspended" | "pending" }) => {
      const { error } = await supabase
        .from("artisans")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
};

// Add new artisan (by admin)
export const useAddArtisan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artisanData: {
      business_name: string;
      description?: string;
      category_id?: string;
      city: string;
      department?: string;
      region?: string;
      hourly_rate?: number;
      siret?: string;
      photo_url?: string;
      portfolio_images?: string[];
      facebook_url?: string;
      instagram_url?: string;
      linkedin_url?: string;
      website_url?: string;
    }) => {
      const { data, error } = await supabase
        .from("artisans")
        .insert([{ ...artisanData, status: "active", is_verified: true }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["new-artisans"] });
    },
  });
};
