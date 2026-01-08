import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { PricingCard } from "@/components/subscription/PricingCard";
import { PaymentMethodCard } from "@/components/subscription/PaymentMethodCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_PLANS, STRIPE_PRICES, getPlanById } from "@/config/subscriptionPlans";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { Crown, Calendar, Settings, CreditCard } from "lucide-react";
import type { BillingInterval } from "@/config/subscriptionPlans";

const ArtisanSubscription = () => {
  const [searchParams] = useSearchParams();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const {
    tier,
    subscriptionEnd,
    subscriptionStart,
    billingInterval: currentBillingInterval,
    paymentMethod,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  } = useSubscription();

  const currentPlan = getPlanById(tier);

  // Handle success/cancel from Stripe
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Abonnement activé !",
        description: "Merci pour votre confiance. Votre abonnement est maintenant actif.",
      });
      checkSubscription();
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Abonnement annulé",
        description: "Vous avez annulé le processus d'abonnement.",
        variant: "destructive",
      });
    }
  }, [searchParams, checkSubscription]);

  const handleSubscribe = async (planId: string) => {
    if (planId === "free") return;

    setIsLoading(true);
    try {
      let priceId: string;
      
      if (planId === "essential") {
        priceId = billingInterval === "monthly"
          ? STRIPE_PRICES.essential.monthly
          : STRIPE_PRICES.essential.yearly;
      } else if (planId === "pro") {
        priceId = billingInterval === "monthly"
          ? STRIPE_PRICES.pro.monthly
          : STRIPE_PRICES.pro.yearly;
      } else if (planId === "elite") {
        priceId = billingInterval === "monthly"
          ? STRIPE_PRICES.elite.monthly
          : STRIPE_PRICES.elite.yearly;
      } else {
        throw new Error("Plan inconnu");
      }

      await createCheckout(priceId);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le portail de gestion. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-16 lg:pt-20">
        <ArtisanSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader
            title="Mon abonnement"
            subtitle="Gérez votre abonnement et accédez à plus de fonctionnalités"
          />

          <main className="flex-1 p-4 lg:p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
            {tier !== "free" && currentPlan && (
              <Card className="mb-8 border-primary/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Crown className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">Plan {currentPlan.name}</CardTitle>
                        <SubscriptionBadge tier={tier} size="md" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Facturation {currentBillingInterval === "yearly" ? "annuelle" : "mensuelle"}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading}>
                    <Settings className="w-4 h-4 mr-2" />
                    Gérer mon abonnement
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subscriptionStart && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date de souscription</p>
                        <p className="font-medium">
                          {new Date(subscriptionStart).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  {subscriptionEnd && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Prochain renouvellement</p>
                        <p className="font-medium">
                          {new Date(subscriptionEnd).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                {paymentMethod && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Moyen de paiement</p>
                    </div>
                    <PaymentMethodCard
                      last4={paymentMethod.last4}
                      brand={paymentMethod.brand}
                      expMonth={paymentMethod.exp_month}
                      expYear={paymentMethod.exp_year}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

            {/* Change Plan Section */}
            <div className="mb-8 text-center">
            <h2 className="text-xl font-semibold mb-2">
              {tier === "free" ? "Choisir un forfait" : "Changer de forfait"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {tier === "free"
                ? "Débloquez plus de fonctionnalités en passant à un plan payant"
                : "Passez à un forfait supérieur pour plus d'avantages"}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <Label
                htmlFor="billing-toggle"
                className={billingInterval === "monthly" ? "font-semibold" : "text-muted-foreground"}
              >
                Mensuel
              </Label>
              <Switch
                id="billing-toggle"
                checked={billingInterval === "yearly"}
                onCheckedChange={(checked) => setBillingInterval(checked ? "yearly" : "monthly")}
              />
              <Label
                htmlFor="billing-toggle"
                className={billingInterval === "yearly" ? "font-semibold" : "text-muted-foreground"}
              >
                Annuel
                <Badge variant="secondary" className="ml-2">
                  -17%
                </Badge>
              </Label>
            </div>
          </div>

            {/* Pricing Cards - Grid Layout with proper spacing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  billingInterval={billingInterval}
                  isCurrentPlan={tier === plan.id}
                  onSubscribe={() => handleSubscribe(plan.id)}
                  isLoading={isLoading}
                />
              ))}
            </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ArtisanSubscription;
