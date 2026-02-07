import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/config/subscriptionPlans";

interface PricingCardProps {
  plan: SubscriptionPlan;
  isCurrentPlan: boolean;
  onSubscribe: () => void;
  isLoading?: boolean;
}

export const PricingCard = ({
  plan,
  isCurrentPlan,
  onSubscribe,
  isLoading,
}: PricingCardProps) => {
  const BadgeIcon = Crown;

  const features = [
    { label: "Accès complet à la plateforme", included: true },
    { label: "Missions illimitées", included: true },
    { label: "Stories Live", included: plan.features.storiesLive },
    { label: `Badge ${plan.features.badgeLabel || ""}`, included: !!plan.features.badge },
    { label: "Devis IA", included: plan.features.devisAI },
    { label: "Statistiques avancées", included: plan.features.statistics },
    { label: `Support ${plan.features.support}`, included: true },
    { label: "Accès bêta exclusif", included: plan.features.betaAccess },
  ];

  return (
    <Card
      className={cn(
        "relative flex flex-col h-full transition-all duration-300 border-2 border-primary/50 hover:border-primary shadow-lg",
        isCurrentPlan && "ring-2 ring-primary"
      )}
    >
      {!isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
          ⭐ Recommandé
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 right-4 bg-success text-white px-3 py-1 rounded-full text-sm font-medium">
          Votre plan
        </div>
      )}

      <CardHeader className="text-center pb-2 pt-8">
        <div className="flex justify-center mb-2">
          <div className="p-2 rounded-full bg-primary/20">
            <BadgeIcon className="w-8 h-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="text-center mb-4">
          <span className="text-4xl font-bold">{plan.priceHT}€</span>
          <span className="text-muted-foreground"> HT/mois</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-lg text-sm bg-primary/10 text-primary">
          <TrendingUp className="w-4 h-4" />
          <span className="font-medium">Visibilité prioritaire garantie</span>
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
        ) : (
          <Button
            className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0"
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
