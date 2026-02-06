import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_PLANS, BOOSTER_OFFER } from "@/config/subscriptionPlans";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { Crown, Calendar, Settings, CreditCard, Check, Zap, Shield, ArrowRight } from "lucide-react";
import { PaymentMethodCard } from "@/components/subscription/PaymentMethodCard";

const ArtisanSubscription = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const {
    tier,
    subscriptionEnd,
    subscriptionStart,
    billingInterval: currentBillingInterval,
    paymentMethod,
    checkSubscription,
    openCustomerPortal,
  } = useSubscription();

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

  const exclusivitePlan = SUBSCRIPTION_PLANS[0];

  const exclusiviteFeatures = [
    "Visibilité maximale dans votre zone",
    "Chantiers qualifiés illimités",
    "Badge Artisan Exclusif",
    "Statistiques avancées",
    "Devis IA intégré",
    "Stories Live",
    "Support dédié",
    "Accès bêta exclusif",
  ];

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <ArtisanSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader
            title="Mon abonnement"
            subtitle="Gérez votre abonnement et accédez à plus de fonctionnalités"
          />

          <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6 overflow-auto">
            <div className="max-w-4xl mx-auto">
              {/* Current plan info */}
              {tier !== "free" && (
                <Card className="mb-8 border-primary/50">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Crown className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">Plan Exclusivité</CardTitle>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {subscriptionStart && (
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Date de souscription</p>
                            <p className="font-medium">
                              {new Date(subscriptionStart).toLocaleDateString("fr-FR", {
                                day: "numeric", month: "long", year: "numeric",
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
                                day: "numeric", month: "long", year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
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

              {/* Pricing Section */}
              <div className="mb-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Nos offres</h2>
                <p className="text-muted-foreground text-sm mb-8">
                  Une offre simple, transparente, pensée pour les artisans d'excellence
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Exclusivité Card */}
                <Card className="relative flex flex-col h-full border-2 border-yellow-500/70 hover:border-yellow-500 shadow-lg shadow-yellow-500/10">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
                    ⭐ Recommandé
                  </div>

                  <CardHeader className="text-center pb-2 pt-8">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-full bg-yellow-500/20">
                        <Crown className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{exclusivitePlan.name}</CardTitle>
                    <CardDescription>{exclusivitePlan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">99€</span>
                      <span className="text-muted-foreground"> HT/mois</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-lg bg-yellow-500/10 text-yellow-600 text-sm">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Top 3 de votre zone géographique</span>
                    </div>

                    <ul className="space-y-3">
                      {exclusiviteFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 flex-shrink-0 text-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4">
                    {tier === "exclusivite" ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Plan actuel
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white border-0"
                        onClick={handleManageSubscription}
                        disabled={isLoading}
                      >
                        {isLoading ? "Chargement..." : "Souscrire à l'Exclusivité"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                {/* Booster Card */}
                <Card className="relative flex flex-col h-full border-2 border-primary/50 hover:border-primary">
                  <div className="absolute -top-3 right-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Ponctuel
                  </div>

                  <CardHeader className="text-center pb-2 pt-8">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-full bg-primary/20">
                        <Zap className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{BOOSTER_OFFER.name}</CardTitle>
                    <CardDescription>Coup de boost ponctuel pour votre activité</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">500€</span>
                      <span className="text-muted-foreground"> HT</span>
                      <p className="text-sm text-muted-foreground mt-1">Paiement unique</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-lg bg-primary/10 text-primary text-sm">
                      <Zap className="w-4 h-4" />
                      <span className="font-medium">3 RDV chantier garantis</span>
                    </div>

                    <div className="bg-muted rounded-lg p-4 mb-4">
                      <p className="text-sm text-foreground">
                        {BOOSTER_OFFER.description}
                      </p>
                    </div>

                    <ul className="space-y-3">
                      {[
                        "3 rendez-vous qualifiés garantis",
                        "Prospects pré-qualifiés par notre équipe",
                        "Remboursé si objectif non atteint",
                        "Compatible avec ou sans abonnement",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 flex-shrink-0 text-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4">
                    <Button
                      className="w-full"
                      variant="default"
                      onClick={() => toast({
                        title: "Booster",
                        description: "Contactez-nous pour activer le Booster : contact@artisansvalides.fr",
                      })}
                    >
                      Activer le Booster
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ArtisanSubscription;
