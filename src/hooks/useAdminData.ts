import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Artisan {
  id: string;
  profile_id: string | null;
  business_name: string;
  slug: string | null;
  description: string | null;
  category_id: string | null;
  city: string;
  department: string | null;
  region: string | null;
  postal_code: string | null;
  address: string | null;
  hourly_rate: number | null;
  experience_years: number | null;
  status: "active" | "suspended" | "pending";
  is_verified: boolean | null;
  rating: number | null;
  review_count: number | null;
  missions_completed: number | null;
  photo_url: string | null;
  portfolio_images: string[] | null;
  portfolio_videos: string[] | null;
  qualifications: string[] | null;
  siret: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  working_hours: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  } | null;
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
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
          category:categories(id, name),
          profile:profiles(id, first_name, last_name)
        `)
        .in("status", ["active", "suspended"])
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

// Fetch all profiles (clients only - filtered by role)
export const useProfiles = () => {
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      // Get user_ids with 'client' role only
      const { data: clientRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "client");

      if (rolesError) throw rolesError;
      if (!clientRoles || clientRoles.length === 0) return [];

      const clientUserIds = clientRoles.map(r => r.user_id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", clientUserIds)
        .neq("email", "demo-client@craftlink.internal")  // Exclure le profil fantôme
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

// Helper function to calculate trend percentage
const calculateTrend = (current: number, previous: number) => {
  if (previous === 0) {
    return current > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: true };
  }
  const percentChange = Math.round(((current - previous) / previous) * 100);
  return {
    value: Math.abs(percentChange),
    isPositive: percentChange >= 0
  };
};

// Fetch dashboard stats with real trends
export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // Define date ranges
      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // === ARTISANS ===
      // Total artisans
      const { count: artisansCount } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true });

      // Artisans created this month
      const { count: artisansThisMonth } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfCurrentMonth.toISOString());

      // Artisans created last month
      const { count: artisansLastMonth } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfPreviousMonth.toISOString())
        .lt("created_at", startOfCurrentMonth.toISOString());

      // === CLIENTS ===
      // Total clients
      const { count: clientsCount } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "client");

      // Get client user_ids for date filtering
      const { data: clientRoles } = await supabase
        .from("user_roles")
        .select("user_id, created_at")
        .eq("role", "client");

      const clientsThisMonth = clientRoles?.filter(
        (r) => new Date(r.created_at) >= startOfCurrentMonth
      ).length || 0;

      const clientsLastMonth = clientRoles?.filter(
        (r) => new Date(r.created_at) >= startOfPreviousMonth && new Date(r.created_at) < startOfCurrentMonth
      ).length || 0;

      // === MISSIONS ===
      const { data: missions } = await supabase
        .from("missions")
        .select("status, created_at");

      const activeMissions = missions?.filter((m) => m.status === "pending" || m.status === "assigned").length || 0;
      const completedMissions = missions?.filter((m) => m.status === "completed").length || 0;
      const cancelledMissions = missions?.filter((m) => m.status === "cancelled").length || 0;

      // Active missions trends
      const activeMissionsThisMonth = missions?.filter(
        (m) => (m.status === "pending" || m.status === "assigned") && new Date(m.created_at) >= startOfCurrentMonth
      ).length || 0;

      const activeMissionsLastMonth = missions?.filter(
        (m) => (m.status === "pending" || m.status === "assigned") && 
               new Date(m.created_at) >= startOfPreviousMonth && 
               new Date(m.created_at) < startOfCurrentMonth
      ).length || 0;

      // Completed missions trends
      const completedThisMonth = missions?.filter(
        (m) => m.status === "completed" && new Date(m.created_at) >= startOfCurrentMonth
      ).length || 0;

      const completedLastMonth = missions?.filter(
        (m) => m.status === "completed" && 
               new Date(m.created_at) >= startOfPreviousMonth && 
               new Date(m.created_at) < startOfCurrentMonth
      ).length || 0;

      return {
        totalArtisans: artisansCount || 0,
        artisansTrend: calculateTrend(artisansThisMonth || 0, artisansLastMonth || 0),
        totalClients: clientsCount || 0,
        clientsTrend: calculateTrend(clientsThisMonth, clientsLastMonth),
        activeMissions,
        activeMissionsTrend: calculateTrend(activeMissionsThisMonth, activeMissionsLastMonth),
        completedMissions,
        completedMissionsTrend: calculateTrend(completedThisMonth, completedLastMonth),
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
      console.log(`[Admin] Updating artisan ${id} to status: ${status}`);
      
      const { data, error } = await supabase
        .from("artisans")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("[Admin] Update failed:", error);
        throw error;
      }
      
      console.log("[Admin] Update successful:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["new-artisans"] });
      queryClient.invalidateQueries({ queryKey: ["top-artisans"] });
    },
    onError: (error) => {
      console.error("[Admin] Mutation error:", error);
    }
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
