import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Recommendation {
  id: string;
  artisan_id: string;
  client_id: string;
  punctuality_rating: number;
  presentation_rating: number;
  work_quality_rating: number;
  communication_rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  client?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
  artisan?: {
    business_name: string;
    photo_url: string | null;
    slug: string | null;
    category?: {
      name: string;
    };
  };
}

export interface CreateRecommendationData {
  artisan_id: string;
  punctuality_rating: number;
  presentation_rating: number;
  work_quality_rating: number;
  communication_rating: number;
  comment?: string;
}

// Get all recommendations for an artisan
export const useArtisanRecommendations = (artisanId: string | undefined) => {
  return useQuery({
    queryKey: ["recommendations", "artisan", artisanId],
    queryFn: async () => {
      if (!artisanId) return [];
      
      const { data, error } = await supabase
        .from("recommendations")
        .select(`
          *,
          client:profiles!recommendations_client_id_fkey(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq("artisan_id", artisanId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Recommendation[];
    },
    enabled: !!artisanId,
  });
};

// Get all recommendations made by the current client
export const useClientRecommendations = () => {
  return useQuery({
    queryKey: ["recommendations", "client"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get profile ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return [];

      const { data, error } = await supabase
        .from("recommendations")
        .select(`
          *,
          artisan:artisans!recommendations_artisan_id_fkey(
            business_name,
            photo_url,
            slug,
            category:categories(name)
          )
        `)
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Recommendation[];
    },
  });
};

// Check if the current user has already recommended an artisan
export const useHasRecommended = (artisanId: string | undefined) => {
  return useQuery({
    queryKey: ["recommendations", "hasRecommended", artisanId],
    queryFn: async () => {
      if (!artisanId) return false;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Get profile ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return false;

      const { data, error } = await supabase
        .from("recommendations")
        .select("id")
        .eq("artisan_id", artisanId)
        .eq("client_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!artisanId,
  });
};

// Get current user's recommendation for a specific artisan
export const useMyRecommendation = (artisanId: string | undefined) => {
  return useQuery({
    queryKey: ["recommendations", "my", artisanId],
    queryFn: async () => {
      if (!artisanId) return null;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get profile ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) return null;

      const { data, error } = await supabase
        .from("recommendations")
        .select("*")
        .eq("artisan_id", artisanId)
        .eq("client_id", profile.id)
        .maybeSingle();

      if (error) throw error;
      return data as Recommendation | null;
    },
    enabled: !!artisanId,
  });
};

// Create a new recommendation
export const useCreateRecommendation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateRecommendationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Get profile ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profil non trouvé");

      const { data: recommendation, error } = await supabase
        .from("recommendations")
        .insert({
          ...data,
          client_id: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return recommendation;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", "artisan", variables.artisan_id] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", "hasRecommended", variables.artisan_id] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", "my", variables.artisan_id] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", "client"] });
      toast({
        title: "Recommandation publiée !",
        description: "Merci d'avoir partagé votre expérience.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de publier la recommandation.",
        variant: "destructive",
      });
    },
  });
};

// Update an existing recommendation
export const useUpdateRecommendation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CreateRecommendationData> & { id: string }) => {
      const { data: recommendation, error } = await supabase
        .from("recommendations")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return recommendation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", "artisan", data.artisan_id] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", "my", data.artisan_id] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", "client"] });
      toast({
        title: "Recommandation modifiée",
        description: "Votre recommandation a été mise à jour.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier la recommandation.",
        variant: "destructive",
      });
    },
  });
};

// Delete a recommendation
export const useDeleteRecommendation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, artisanId }: { id: string; artisanId: string }) => {
      const { error } = await supabase
        .from("recommendations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, artisanId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["recommendations", "artisan", data.artisanId] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", "hasRecommended", data.artisanId] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", "my", data.artisanId] });
      queryClient.invalidateQueries({ queryKey: ["recommendations", "client"] });
      toast({
        title: "Recommandation supprimée",
        description: "Votre recommandation a été supprimée.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la recommandation.",
        variant: "destructive",
      });
    },
  });
};
