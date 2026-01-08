import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, Award, Medal, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan, BillingInterval } from "@/config/subscriptionPlans";

interface PricingCardProps {
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  isCurrentPlan: boolean;
  onSubscribe: () => void;
  onContact?: () => void;
  isLoading?: boolean;
}

const badgeIcons = {
  gold: Crown,
  silver: Award,
  bronze: Medal,
};

export const PricingCard = ({
  plan,
  billingInterval,
  isCurrentPlan,
  onSubscribe,
  onContact,
  isLoading,
}: PricingCardProps) => {
  const price = billingInterval === "monthly" ? plan.prices.monthly : plan.prices.yearly;
  const isPopular = plan.id === "pro";
  const BadgeIcon = plan.features.badge ? badgeIcons[plan.features.badge] : null;

  const features = [
    { label: "Accès à la plateforme", included: true },
    {
      label: `${plan.features.missionsPerMonth === "unlimited" ? "Missions illimitées" : `${plan.features.missionsPerMonth} mission${plan.features.missionsPerMonth > 1 ? "s" : ""}/mois`}`,
      included: true,
    },
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
        "relative flex flex-col h-full transition-all duration-300",
        isPopular && "border-primary shadow-lg scale-105",
        isCurrentPlan && "ring-2 ring-primary"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
          Populaire
        </div>
      )}
      
      {isCurrentPlan && (
        <div className="absolute -top-3 right-4 bg-success text-white px-3 py-1 rounded-full text-sm font-medium">
          Votre plan
        </div>
      )}

      <CardHeader className="text-center pb-2">
        {BadgeIcon && (
          <div className="flex justify-center mb-2">
            <BadgeIcon
              className={cn(
                "w-8 h-8",
                plan.features.badge === "gold" && "text-yellow-500",
                plan.features.badge === "silver" && "text-slate-400",
                plan.features.badge === "bronze" && "text-amber-600"
              )}
            />
          </div>
        )}
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-6">
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

      <CardFooter>
        {plan.isContactSales ? (
          <Button
            className="w-full"
            variant="outline"
            onClick={onContact}
            disabled={isLoading}
          >
            <Phone className="w-4 h-4 mr-2" />
            Contacter le support
          </Button>
        ) : isCurrentPlan ? (
          <Button className="w-full" variant="secondary" disabled>
            Plan actuel
          </Button>
        ) : plan.id === "free" ? (
          <Button className="w-full" variant="outline" disabled>
            Plan gratuit
          </Button>
        ) : (
          <Button
            className="w-full"
            variant={isPopular ? "default" : "outline"}
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
