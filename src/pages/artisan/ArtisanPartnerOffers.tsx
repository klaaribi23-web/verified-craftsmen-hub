import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Gift, Copy, CheckCircle2, ExternalLink, ShieldCheck, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";

interface PartnerOffer {
  id: string;
  name: string;
  description: string | null;
  discount_label: string;
  promo_code: string | null;
  logo_url: string | null;
  link_url: string | null;
  category: string | null;
  display_order: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  assurance: "🛡️ Assurances",
  materiau: "🧱 Matériaux",
  carburant: "⛽ Carburant",
  energie: "⚡ Énergie",
  outillage: "🔧 Outillage",
  general: "🎁 Général",
};

export const ArtisanPartnerOffers = () => {
  const { tier, isLoading: isLoadingSubscription } = useSubscription();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const hasAccess = tier !== "free";

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["artisan-partner-offers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partner_offers")
        .select("id, name, description, discount_label, promo_code, logo_url, link_url, category, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as PartnerOffer[];
    },
    enabled: hasAccess,
  });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success(`Code "${code}" copié !`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Group offers by category
  const grouped = offers.reduce<Record<string, PartnerOffer[]>>((acc, o) => {
    const cat = o.category || "general";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(o);
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background">
        <ArtisanSidebar />
      
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            title="Avantages Club" 
            subtitle="Tarifs négociés exclusifs pour les artisans du réseau"
          />

          <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              {isLoadingSubscription || isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !hasAccess ? (
                <FeatureGate 
                  requiredTier="exclusivite" 
                  feature="Avantages Club"
                >
                  <div />
                </FeatureGate>
              ) : offers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="p-6 rounded-full bg-primary/10 mb-6">
                    <Gift className="w-16 h-16 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    Offres à venir
                  </h2>
                  <p className="text-muted-foreground text-center max-w-md">
                    Nous finalisons les partenariats exclusifs pour vous offrir les meilleures réductions. Revenez très bientôt !
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Hero banner */}
                  <div className="rounded-xl bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
                    <div className="flex items-center gap-3 mb-2">
                      <Sparkles className="w-6 h-6" />
                      <h2 className="text-xl font-bold">Vos avantages exclusifs</h2>
                      <Badge className="bg-white/20 text-white border-0">
                        {offers.length} offre{offers.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                    <p className="text-primary-foreground/80 text-sm">
                      En tant que membre du réseau Artisans Validés, profitez de tarifs négociés sur vos assurances, matériaux et services professionnels.
                    </p>
                  </div>

                  {/* Grouped offers */}
                  {Object.entries(grouped).map(([category, categoryOffers]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        {CATEGORY_LABELS[category] || category}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryOffers.map((offer, i) => (
                          <motion.div
                            key={offer.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card className="overflow-hidden h-full flex flex-col border-border hover:border-primary/30 transition-colors">
                              <div className="p-5 flex-1 flex flex-col">
                                <div className="flex items-start gap-4 mb-4">
                                  {offer.logo_url ? (
                                    <img src={offer.logo_url} alt={offer.name} className="w-14 h-14 rounded-xl object-contain bg-muted p-2 shrink-0" />
                                  ) : (
                                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                      <ShieldCheck className="w-7 h-7 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-foreground">{offer.name}</h4>
                                    <p className="text-sm font-bold text-primary mt-0.5">{offer.discount_label}</p>
                                  </div>
                                </div>
                                
                                {offer.description && (
                                  <p className="text-sm text-muted-foreground mb-4 flex-1">{offer.description}</p>
                                )}

                                <div className="space-y-2 mt-auto">
                                  {offer.promo_code && (
                                    <Button
                                      variant="outline"
                                      className="w-full gap-2"
                                      onClick={() => handleCopyCode(offer.id, offer.promo_code!)}
                                    >
                                      {copiedId === offer.id ? (
                                        <>
                                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                                          Code copié !
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-4 h-4" />
                                          Obtenir mon code promo
                                        </>
                                      )}
                                    </Button>
                                  )}
                                  {offer.link_url && (
                                    <Button variant="default" className="w-full gap-2" asChild>
                                      <a href={offer.link_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="w-4 h-4" />
                                        Accéder à l'offre
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
