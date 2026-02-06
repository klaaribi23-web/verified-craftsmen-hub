import { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import type { SubscriptionTier } from "@/config/subscriptionPlans";

interface FeatureGateProps {
  requiredTier: SubscriptionTier | SubscriptionTier[] | string | string[];
  feature: string;
  children: ReactNode;
}

const tierOrder: string[] = ["free", "exclusivite"];

const getTierLevel = (tier: string): number => {
  const idx = tierOrder.indexOf(tier);
  return idx === -1 ? 0 : idx;
};

export const FeatureGate = ({ requiredTier, feature, children }: FeatureGateProps) => {
  const { tier, isLoading } = useSubscription();

  if (isLoading) {
    return null;
  }

  const currentTierLevel = getTierLevel(tier);
  const requiredTiers = Array.isArray(requiredTier) ? requiredTier : [requiredTier];
  const minRequiredLevel = Math.min(...requiredTiers.map(t => getTierLevel(t)));
  
  const hasAccess = currentTierLevel >= minRequiredLevel;

  if (hasAccess) {
    return <>{children}</>;
  }

  // Even without access, show content with a validated shield — no locks
  return (
    <Card className="border border-success/30">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <ShieldCheck className="w-8 h-8 text-success" />
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-2">
          {feature}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          Section sécurisée et validée par notre équipe.
        </p>
      </CardContent>
    </Card>
  );
};
