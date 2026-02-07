import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_PLAN, BOOSTER_OFFER, STRIPE_PRICES } from "@/config/subscriptionPlans";
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
    createCheckout,
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

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await createCheckout(STRIPE_PRICES.artisan_valide.monthly);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de lancer le paiement. Veuillez réessayer.",
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

  const isSubscribed = tier !== "free";

  const features = [
    "Visibilité maximale dans votre zone",
    "Chantiers qualifiés illimités",
    "Badge Artisan Validé",
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
              {isSubscribed && (
                <Card className="mb-8 border-primary/50">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Crown className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">Artisan Validé</CardTitle>
                            <SubscriptionBadge tier={tier} size="md" />
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Facturation mensuelle — 99€ HT/mois
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
                <h2 className="text-xl font-semibold mb-2">
                  {isSubscribed ? "Votre offre" : "Notre offre"}
                </h2>
                <p className="text-muted-foreground text-sm mb-8">
                  Une offre simple, transparente, pensée pour les artisans d'excellence
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Artisan Validé Card */}
                <Card className="relative flex flex-col h-full border-2 border-primary/50 hover:border-primary shadow-lg">
                  {!isSubscribed && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold shadow-md">
                      ⭐ Recommandé
                    </div>
                  )}

                  <CardHeader className="text-center pb-2 pt-8">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-full bg-primary/20">
                        <Crown className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-2xl">{SUBSCRIPTION_PLAN.name}</CardTitle>
                    <CardDescription>{SUBSCRIPTION_PLAN.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">99€</span>
                      <span className="text-muted-foreground"> HT/mois</span>
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-lg bg-primary/10 text-primary text-sm">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Visibilité prioritaire garantie</span>
                    </div>

                    <ul className="space-y-3">
                      {features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 flex-shrink-0 text-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4">
                    {isSubscribed ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Plan actuel
                      </Button>
                    ) : (
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-0"
                        onClick={handleSubscribe}
                        disabled={isLoading}
                      >
                        {isLoading ? "Chargement..." : "S'abonner — 99€ HT/mois"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                {/* Booster Card */}
                <Card className="relative flex flex-col h-full border-2 border-muted hover:border-muted-foreground/30">
                  <div className="absolute -top-3 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Ponctuel
                  </div>

                  <CardHeader className="text-center pb-2 pt-8">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-full bg-accent/20">
                        <Zap className="w-8 h-8 text-accent-foreground" />
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

                    <div className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-lg bg-accent/10 text-accent-foreground text-sm">
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
