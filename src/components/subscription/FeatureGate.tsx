import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import type { SubscriptionTier } from "@/config/subscriptionPlans";

interface FeatureGateProps {
  requiredTier: SubscriptionTier | SubscriptionTier[];
  feature: string;
  children: ReactNode;
}

const tierOrder: SubscriptionTier[] = ["free", "essential", "pro", "elite"];

const getTierLevel = (tier: SubscriptionTier): number => {
  return tierOrder.indexOf(tier);
};

export const FeatureGate = ({ requiredTier, feature, children }: FeatureGateProps) => {
  const { tier, isLoading } = useSubscription();

  if (isLoading) {
    return null;
  }

  const currentTierLevel = getTierLevel(tier);
  const requiredTiers = Array.isArray(requiredTier) ? requiredTier : [requiredTier];
  const minRequiredLevel = Math.min(...requiredTiers.map(getTierLevel));
  
  const hasAccess = currentTierLevel >= minRequiredLevel;

  if (hasAccess) {
    return <>{children}</>;
  }

  const minRequiredTier = tierOrder[minRequiredLevel];
  const tierNames: Record<SubscriptionTier, string> = {
    free: "Gratuit",
    essential: "Essentiel",
    pro: "Pro",
    elite: "Elite",
  };

  return (
    <Card className="border-dashed border-2 border-muted">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-2">
          {feature}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-4">
          Cette fonctionnalité est réservée aux abonnements{" "}
          <span className="font-medium text-primary">{tierNames[minRequiredTier]}</span> et supérieurs.
        </p>
        <Button asChild className="gap-2">
          <Link to="/artisan/abonnement">
            <Crown className="w-4 h-4" />
            Mettre à niveau
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};
