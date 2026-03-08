import { Eye, TrendingUp, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ProfileViewsCardProps {
  artisanId: string | undefined;
  demoMode?: boolean;
  isSubscribed?: boolean;
}

export const ProfileViewsCard = ({ artisanId, demoMode, isSubscribed }: ProfileViewsCardProps) => {
  // Total views
  const { data: totalViews = 0 } = useQuery({
    queryKey: ["profile-views-total", artisanId],
    queryFn: async () => {
      if (!artisanId) return 0;
      const { count } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("artisan_id", artisanId);
      return count || 0;
    },
    enabled: !!artisanId && !demoMode,
  });

  // Views this week
  const { data: weekViews = 0 } = useQuery({
    queryKey: ["profile-views-week", artisanId],
    queryFn: async () => {
      if (!artisanId) return 0;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count } = await supabase
        .from("profile_views")
        .select("*", { count: "exact", head: true })
        .eq("artisan_id", artisanId)
        .gte("viewed_at", weekAgo.toISOString());
      return count || 0;
    },
    enabled: !!artisanId && !demoMode,
  });

  const displayTotal = demoMode ? 124 : totalViews;
  const displayWeek = demoMode ? 12 : weekViews;

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-6 mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <Eye className="w-7 h-7 text-accent" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium">Vues de votre profil</p>
            <div className="flex items-baseline gap-3">
              <p className="text-3xl md:text-4xl font-black text-foreground">{displayTotal}</p>
              {displayWeek > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  +{displayWeek} cette semaine
                </span>
              )}
            </div>
            {!isSubscribed && !demoMode && (
              <p className="text-xs text-muted-foreground mt-1">
                ⚡ Les abonnés reçoivent <strong>5x plus de vues</strong> grâce au référencement prioritaire
              </p>
            )}
          </div>
        </div>
        {!isSubscribed && !demoMode && (
          <Link to="/artisan/abonnement">
            <Button variant="gold" size="sm" className="whitespace-nowrap gap-1">
              Booster ma visibilité <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
