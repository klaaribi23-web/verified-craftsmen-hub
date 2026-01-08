import { Link } from "react-router-dom";
import { Crown, ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { getPlanById, type SubscriptionTier } from "@/config/subscriptionPlans";

interface SubscriptionDashboardCardProps {
  tier: SubscriptionTier;
  subscriptionEnd: string | null;
}

export const SubscriptionDashboardCard = ({
  tier,
  subscriptionEnd,
}: SubscriptionDashboardCardProps) => {
  const currentPlan = getPlanById(tier);
  const isFreeTier = tier === "free";

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft p-4 md:p-6 mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isFreeTier ? "bg-muted" : "bg-primary/10"
            }`}
          >
            <Crown
              className={`w-6 h-6 ${isFreeTier ? "text-muted-foreground" : "text-primary"}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">Mon abonnement</h3>
              <SubscriptionBadge tier={tier} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground">
              Plan {currentPlan?.name || "Gratuit"}
              {!isFreeTier && subscriptionEnd && (
                <span className="inline-flex items-center gap-1 ml-2">
                  <Calendar className="w-3 h-3" />
                  Renouvellement le{" "}
                  {new Date(subscriptionEnd).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
        <Link to="/artisan/abonnement">
          <Button
            variant={isFreeTier ? "default" : "outline"}
            size="sm"
            className="w-full sm:w-auto"
          >
            {isFreeTier ? "Passer au niveau supérieur" : "Gérer"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
