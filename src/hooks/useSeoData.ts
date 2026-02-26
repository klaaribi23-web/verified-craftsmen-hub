import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SeoCity {
  id: string;
  name: string;
  slug: string;
  department: string;
  region: string;
  latitude: number;
  longitude: number;
  population: number;
  is_active: boolean;
}

export interface SeoMetier {
  id: string;
  name: string;
  slug: string;
  category_name: string;
  is_rge_eligible: boolean;
  meta_description_template: string | null;
  is_active: boolean;
}

export const useSeoCity = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["seo-city", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("seo_cities")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as SeoCity;
    },
    enabled: !!slug,
  });
};

export const useSeoMetier = (slug: string | undefined) => {
  return useQuery({
    queryKey: ["seo-metier", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("seo_metiers")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as SeoMetier;
    },
    enabled: !!slug,
  });
};

export const useAllSeoCities = () => {
  return useQuery({
    queryKey: ["seo-cities-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_cities")
        .select("*")
        .eq("is_active", true)
        .order("population", { ascending: false });
      if (error) throw error;
      return data as SeoCity[];
    },
  });
};

export const useAllSeoMetiers = () => {
  return useQuery({
    queryKey: ["seo-metiers-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_metiers")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as SeoMetier[];
    },
  });
};

export const useNearbyCities = (city: SeoCity | null | undefined, limit = 5) => {
  return useQuery({
    queryKey: ["seo-nearby-cities", city?.id],
    queryFn: async () => {
      if (!city) return [];
      const { data, error } = await supabase
        .from("seo_cities")
        .select("*")
        .eq("is_active", true)
        .neq("id", city.id)
        .order("population", { ascending: false });
      if (error) throw error;
      // Sort by distance from current city
      const cities = (data as SeoCity[]).map((c) => ({
        ...c,
        distance: Math.sqrt(
          Math.pow((c.latitude - city.latitude) * 111, 2) +
          Math.pow((c.longitude - city.longitude) * 111 * Math.cos(city.latitude * Math.PI / 180), 2)
        ),
      }));
      cities.sort((a, b) => a.distance - b.distance);
      return cities.slice(0, limit);
    },
    enabled: !!city,
  });
};

export const useRelatedMetiers = (metier: SeoMetier | null | undefined, limit = 5) => {
  return useQuery({
    queryKey: ["seo-related-metiers", metier?.id],
    queryFn: async () => {
      if (!metier) return [];
      const { data, error } = await supabase
        .from("seo_metiers")
        .select("*")
        .eq("is_active", true)
        .neq("id", metier.id)
        .order("name")
        .limit(limit);
      if (error) throw error;
      return data as SeoMetier[];
    },
    enabled: !!metier,
  });
};
