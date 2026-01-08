import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Award, Medal, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan, BillingInterval } from "@/config/subscriptionPlans";

interface PricingCardProps {
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  isCurrentPlan: boolean;
  onSubscribe: () => void;
  isLoading?: boolean;
}

const badgeIcons = {
  gold: Crown,
  silver: Award,
  bronze: Medal,
};

const borderStyles = {
  free: "border-muted hover:border-muted-foreground/30",
  essential: "border-amber-500/50 hover:border-amber-500",
  pro: "border-slate-400/50 hover:border-slate-400 shadow-lg",
  elite: "border-yellow-500/70 hover:border-yellow-500 shadow-lg shadow-yellow-500/10",
};

export const PricingCard = ({
  plan,
  billingInterval,
  isCurrentPlan,
  onSubscribe,
  isLoading,
}: PricingCardProps) => {
  const price = billingInterval === "monthly" ? plan.prices.monthly : plan.prices.yearly;
  const isPopular = plan.id === "pro";
  const BadgeIcon = plan.features.badge ? badgeIcons[plan.features.badge] : null;

  const features = [
    { label: "Accès à la plateforme", included: true },
    {
      label: `${plan.features.missionsPerMonth === "unlimited" ? "Missions illimitées" : `${plan.features.missionsPerMonth} mission${typeof plan.features.missionsPerMonth === "number" && plan.features.missionsPerMonth > 1 ? "s" : ""}/mois`}`,
      included: true,
    },
    { label: "Stories Live", included: plan.features.storiesLive },
    {
      label: plan.features.badge ? `Badge ${plan.features.badgeLabel}` : "Pas de badge",
      included: !!plan.features.badge,
    },
    { label: "Devis IA", included: plan.features.devisAI },
    { label: "Statistiques avancées", included: plan.features.statistics },
    { label: `Support ${plan.features.support}`, included: true },
    { label: "Accès bêta exclusif", included: plan.features.betaAccess },
  ];

  return (
    <Card
      className={cn(
        "relative flex flex-col h-full transition-all duration-300 border-2",
        borderStyles[plan.id],
        isCurrentPlan && "ring-2 ring-primary"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
          ⭐ Populaire
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4 bg-success text-white px-3 py-1 rounded-full text-sm font-medium">
          Votre plan
        </div>
      )}

      <CardHeader className="text-center pb-2 pt-6">
        {BadgeIcon && (
          <div className="flex justify-center mb-2">
            <div className={cn(
              "p-2 rounded-full",
              plan.features.badge === "gold" && "bg-yellow-500/20",
              plan.features.badge === "silver" && "bg-slate-400/20",
              plan.features.badge === "bronze" && "bg-amber-600/20"
            )}>
              <BadgeIcon
                className={cn(
                  "w-8 h-8",
                  plan.features.badge === "gold" && "text-yellow-500",
                  plan.features.badge === "silver" && "text-slate-400",
                  plan.features.badge === "bronze" && "text-amber-600"
                )}
              />
            </div>
          </div>
        )}
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-4">
          <span className="text-4xl font-bold">{price}€</span>
          <span className="text-muted-foreground">
            /{billingInterval === "monthly" ? "mois" : "an"}
          </span>
          {billingInterval === "yearly" && plan.prices.yearly > 0 && (
            <p className="text-sm text-success mt-1">
              Économisez {Math.round((1 - plan.prices.yearly / (plan.prices.monthly * 12)) * 100)}%
            </p>
          )}
        </div>

        {/* Priority/Positioning info */}
        <div className={cn(
          "flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-lg text-sm",
          plan.id === "elite" && "bg-yellow-500/10 text-yellow-600",
          plan.id === "pro" && "bg-slate-400/10 text-slate-600",
          plan.id === "essential" && "bg-amber-500/10 text-amber-600",
          plan.id === "free" && "bg-muted text-muted-foreground"
        )}>
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">Positionnement: {plan.priorityLabel}</span>
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 text-sm",
                !feature.included && "text-muted-foreground line-through"
              )}
            >
              <Check
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  feature.included ? "text-success" : "text-muted-foreground"
                )}
              />
              <span>{feature.label}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        {isCurrentPlan ? (
          <Button className="w-full" variant="secondary" disabled>
            Plan actuel
          </Button>
        ) : plan.id === "free" ? (
          <Button className="w-full" variant="outline" disabled>
            Plan gratuit
          </Button>
        ) : (
          <Button
            className={cn(
              "w-full",
              plan.id === "elite" && "bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0"
            )}
            variant={isPopular ? "default" : plan.id === "elite" ? "default" : "outline"}
            onClick={onSubscribe}
            disabled={isLoading}
          >
            {isLoading ? "Chargement..." : "S'abonner"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
