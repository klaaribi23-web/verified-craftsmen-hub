import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubscribedArtisan {
  id: string;
  business_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  slug: string | null;
  status: string;
  subscription_tier: string | null;
  subscription_end: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  category: {
    name: string;
  } | null;
}

export const useSubscribedArtisans = () => {
  return useQuery({
    queryKey: ["subscribed-artisans"],
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artisans")
        .select(`
          id,
          business_name,
          email,
          phone,
          photo_url,
          slug,
          status,
          subscription_tier,
          subscription_end,
          stripe_customer_id,
          created_at,
          category:categories(name)
        `)
        .neq("subscription_tier", "free")
        .not("subscription_tier", "is", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SubscribedArtisan[];
    },
  });
};
