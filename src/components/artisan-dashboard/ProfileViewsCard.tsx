import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfileViewsCardProps {
  artisanId: string | undefined;
}

export const ProfileViewsCard = ({ artisanId }: ProfileViewsCardProps) => {
  const { data: viewsCount = 0 } = useQuery({
    queryKey: ["profile-views", artisanId],
    queryFn: async () => {
      if (!artisanId) return 0;
      // Use review_count as a proxy for profile engagement, 
      // or story_views as profile visibility indicator
      const { count } = await supabase
        .from("story_views")
        .select("*", { count: "exact", head: true })
        .in("story_id", 
          (await supabase
            .from("artisan_stories")
            .select("id")
            .eq("artisan_id", artisanId)
          ).data?.map(s => s.id) || []
        );
      return count || 0;
    },
    enabled: !!artisanId,
  });

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-6 mb-6 md:mb-8">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <Eye className="w-7 h-7 text-accent" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">Vues de votre profil</p>
          <p className="text-3xl md:text-4xl font-bold text-foreground">{viewsCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Augmentez votre visibilité avec l'abonnement Pro à 99€/mois
          </p>
        </div>
      </div>
    </div>
  );
};
