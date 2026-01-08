import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { PricingCard } from "@/components/subscription/PricingCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_PLANS, STRIPE_PRICES, getPlanById } from "@/config/subscriptionPlans";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { Crown, Calendar, Settings, CheckCircle2, XCircle } from "lucide-react";
import type { BillingInterval } from "@/config/subscriptionPlans";

const ArtisanSubscription = () => {
  const [searchParams] = useSearchParams();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const { tier, subscriptionEnd, checkSubscription, createCheckout, openCustomerPortal } = useSubscription();

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
      const priceId =
        planId === "essential"
          ? billingInterval === "monthly"
            ? STRIPE_PRICES.essential.monthly
            : STRIPE_PRICES.essential.yearly
          : billingInterval === "monthly"
            ? STRIPE_PRICES.pro.monthly
            : STRIPE_PRICES.pro.yearly;

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

  const handleContactSupport = () => {
    toast({
      title: "Contact Elite",
      description: "Cette fonctionnalité sera disponible prochainement.",
    });
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <ArtisanSidebar />
        <main className="flex-1 p-4 lg:p-8">
          <DashboardHeader
            title="Mon abonnement"
            subtitle="Gérez votre abonnement et accédez à plus de fonctionnalités"
          />

          {/* Current Plan Summary */}
          {tier !== "free" && currentPlan && (
            <Card className="mb-8 border-primary">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <Crown className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle>Votre abonnement actuel</CardTitle>
                    <p className="text-muted-foreground">Plan {currentPlan.name}</p>
                  </div>
                </div>
                <SubscriptionBadge tier={tier} size="lg" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-6">
                  {subscriptionEnd && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Prochain renouvellement :{" "}
                        {new Date(subscriptionEnd).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  <Button variant="outline" onClick={handleManageSubscription} disabled={isLoading}>
                    <Settings className="w-4 h-4 mr-2" />
                    Gérer mon abonnement
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                billingInterval={billingInterval}
                isCurrentPlan={tier === plan.id}
                onSubscribe={() => handleSubscribe(plan.id)}
                onContact={handleContactSupport}
                isLoading={isLoading}
              />
            ))}
          </div>

          {/* Features Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des fonctionnalités</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Fonctionnalité</th>
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <th key={plan.id} className="text-center py-3 px-4">
                          {plan.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Missions postulées</td>
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <td key={plan.id} className="text-center py-3 px-4">
                          {plan.features.missionsPerMonth === "unlimited"
                            ? "Illimitées"
                            : `${plan.features.missionsPerMonth}/mois`}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Badge</td>
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <td key={plan.id} className="text-center py-3 px-4">
                          {plan.features.badge ? (
                            <SubscriptionBadge tier={plan.id} size="sm" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Devis IA</td>
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <td key={plan.id} className="text-center py-3 px-4">
                          {plan.features.devisAI ? (
                            <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Statistiques avancées</td>
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <td key={plan.id} className="text-center py-3 px-4">
                          {plan.features.statistics ? (
                            <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Support</td>
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <td key={plan.id} className="text-center py-3 px-4 capitalize">
                          {plan.features.support === "vip" ? "VIP Dédié" : plan.features.support}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Accès bêta</td>
                      {SUBSCRIPTION_PLANS.map((plan) => (
                        <td key={plan.id} className="text-center py-3 px-4">
                          {plan.features.betaAccess ? (
                            <CheckCircle2 className="w-5 h-5 text-success mx-auto" />
                          ) : (
                            <XCircle className="w-5 h-5 text-muted-foreground mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
};

export default ArtisanSubscription;
