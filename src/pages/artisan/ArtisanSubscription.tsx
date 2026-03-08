import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { MONTHLY_PLAN, YEARLY_PLAN, STRIPE_PRICES } from "@/config/subscriptionPlans";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";
import { Crown, Calendar, Settings, CreditCard, Check, Shield, Star, Sparkles, Loader2 } from "lucide-react";
import { PaymentMethodCard } from "@/components/subscription/PaymentMethodCard";
import MoneySection from "@/components/subscription/MoneySection";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ArtisanSubscription = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
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

  const handleSubscribe = async (e: React.MouseEvent, priceId: string) => {
    e.stopPropagation();
    if (loadingPriceId) return;
    setLoadingPriceId(priceId);
    setCheckoutError(null);
    try {
      await createCheckout(priceId);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      setCheckoutError(msg);
      toast({
        title: "Erreur de paiement",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoadingPriceId(null);
    }
  };

  const handleManageSubscription = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingPriceId("manage");
    try {
      await openCustomerPortal();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ouvrir le portail de gestion. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoadingPriceId(null);
    }
  };

  // Fetch artisan profile for MoneySection context
  const { data: artisanProfile } = useQuery({
    queryKey: ["artisan-profile-sub", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("artisans")
        .select("city, category_id, categories:category_id(name)")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const isSubscribed = tier !== "free";
  const isLegacy = tier === "legacy";

  const sharedFeatures = [
    "Visibilité maximale dans votre zone",
    "Chantiers qualifiés illimités",
    "Badge Artisan Validé",
    "Statistiques avancées",
    "Devis IA intégré",
    "Stories Live",
    "Support dédié",
    "Accès bêta exclusif",
  ];

  const yearlyExtras = [
    "Badge Audité offert",
    "3 RDV chantier qualifiés garantis",
    "Économisez 2 mois (10 mois pour le prix de 12)",
  ];

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background">
        <ArtisanSidebar />
        
        <div className="flex-1 flex flex-col">
          <DashboardHeader
            title="Mon abonnement"
            subtitle="Gérez votre abonnement et accédez à plus de fonctionnalités"
          />

           <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6 overflow-auto">
            <div className="max-w-5xl mx-auto">
              {checkoutError && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm font-medium">
                  <p className="font-bold mb-1">❌ Erreur Stripe</p>
                  <p>{checkoutError}</p>
                </div>
              )}
            {/* Legacy Partner Card */}
              {isLegacy && (
                <Card className="mb-8 border-primary/50 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">Partenaire Historique</CardTitle>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow">
                              <Star className="w-3 h-3 fill-current" />
                              LEGACY
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Votre abonnement historique est maintenu — aucune action requise.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
                      <Check className="w-5 h-5 text-success" />
                      <p className="text-sm font-medium text-foreground">
                        Statut : <span className="text-success font-bold">Actif</span> — Accès complet à toutes les fonctionnalités de la plateforme.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Current plan info (Stripe subscribers only) */}
              {isSubscribed && !isLegacy && (
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
                            {currentBillingInterval === "yearly" 
                              ? "Facturation annuelle — 990€ HT/an" 
                              : "Facturation mensuelle — 99€ HT/mois"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={(e) => handleManageSubscription(e)} disabled={loadingPriceId === "manage"}>
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

              {/* Pricing Section — hidden for legacy */}
              {!isLegacy && (
              <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold mb-2">
                  {isSubscribed ? "Votre offre" : "Choisissez votre offre"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  Une offre pensée pour les artisans d'excellence
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Monthly Card */}
                <Card className="relative flex flex-col h-full border-2 border-border hover:border-primary/40 transition-all">
                  <CardHeader className="text-center pb-2 pt-8">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-full bg-muted">
                        <Crown className="w-7 h-7 text-muted-foreground" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{MONTHLY_PLAN.name}</CardTitle>
                    <CardDescription>{MONTHLY_PLAN.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">99€</span>
                      <span className="text-muted-foreground"> HT/mois</span>
                    </div>

                    <ul className="space-y-3">
                      {sharedFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 flex-shrink-0 text-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4">
                    {isSubscribed && currentBillingInterval === "monthly" ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Plan actuel
                      </Button>
                    ) : isSubscribed ? (
                      <Button className="w-full" variant="outline" disabled>
                        —
                      </Button>
                    ) : (
                      <Button
                        id="checkout-99"
                        className="w-full bg-gradient-gold text-primary-foreground font-bold shadow-gold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-0"
                        onClick={(e) => handleSubscribe(e, STRIPE_PRICES.artisan_valide.monthly)}
                        disabled={!!loadingPriceId}
                      >
                        {loadingPriceId === STRIPE_PRICES.artisan_valide.monthly ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirection…</>
                        ) : "🔒 ACTIVER MON EXCLUSIVITÉ SECTEUR — 99€/mois"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>

                {/* Yearly Card — highlighted */}
                <Card className={cn(
                  "relative flex flex-col h-full border-2 transition-all shadow-xl",
                  "border-primary ring-2 ring-primary/20 scale-[1.02]"
                )}>
                  {/* Best deal badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-1.5 rounded-full text-sm font-bold shadow-lg flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-white" />
                      LE MEILLEUR DEAL
                    </div>
                  </div>

                  <CardHeader className="text-center pb-2 pt-10">
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-full bg-primary/20">
                        <Sparkles className="w-7 h-7 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">{YEARLY_PLAN.name}</CardTitle>
                    <CardDescription className="text-primary font-medium">
                      {YEARLY_PLAN.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-center mb-2">
                      <span className="text-4xl font-bold">990€</span>
                      <span className="text-muted-foreground"> HT/an</span>
                    </div>
                    <p className="text-center text-sm text-muted-foreground mb-6">
                      soit <span className="font-semibold text-foreground">82,50€/mois</span> — 2 mois offerts
                    </p>

                    {/* Exclusive yearly perks */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
                      <p className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
                        <Shield className="w-4 h-4" />
                        Avantages exclusifs annuels
                      </p>
                      <ul className="space-y-2">
                        {yearlyExtras.map((extra) => (
                          <li key={extra} className="flex items-center gap-2 text-sm font-medium">
                            <Star className="w-3.5 h-3.5 flex-shrink-0 text-amber-500 fill-amber-500" />
                            <span>{extra}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <ul className="space-y-3">
                      {sharedFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 flex-shrink-0 text-success" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4">
                    {isSubscribed && currentBillingInterval === "yearly" ? (
                      <Button className="w-full" variant="secondary" disabled>
                        Plan actuel
                      </Button>
                    ) : (
                      <Button
                        id="checkout-990"
                        className="w-full bg-gradient-gold text-primary-foreground font-bold shadow-gold hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border-0 text-base"
                        onClick={(e) => handleSubscribe(e, STRIPE_PRICES.artisan_valide.yearly)}
                        disabled={!!loadingPriceId}
                      >
                        {loadingPriceId === STRIPE_PRICES.artisan_valide.yearly ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redirection…</>
                        ) : "🔒 ACTIVER MON EXCLUSIVITÉ SECTEUR — 990€/an"}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </div>
              </>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ArtisanSubscription;
