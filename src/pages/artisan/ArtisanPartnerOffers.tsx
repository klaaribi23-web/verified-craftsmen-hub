import { ArtisanSidebar } from "@/components/artisan-dashboard/ArtisanSidebar";
import { DashboardHeader } from "@/components/artisan-dashboard/DashboardHeader";
import { useSubscription } from "@/hooks/useSubscription";
import { FeatureGate } from "@/components/subscription/FeatureGate";
import { Construction, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export const ArtisanPartnerOffers = () => {
  const { tier, isLoading: isLoadingSubscription } = useSubscription();
  
  const hasPartnerOffersAccess = tier !== "free";

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen bg-background pt-28 lg:pt-20">
        <ArtisanSidebar />
      
        <div className="flex-1 flex flex-col">
          <DashboardHeader 
            title="Offres Partenaires" 
            subtitle="Profitez de réductions exclusives chez nos partenaires"
          />

          <main className="flex-1 p-3 md:p-6 pb-24 lg:pb-6 overflow-auto">
            <div className="max-w-6xl mx-auto">
              {isLoadingSubscription ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : !hasPartnerOffersAccess ? (
                <FeatureGate 
                  requiredTier="essential" 
                  feature="Offres Partenaires"
                >
                  <div />
                </FeatureGate>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="p-6 rounded-full bg-primary/10 mb-6">
                    <Construction className="w-16 h-16 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-3">
                    Page en construction
                  </h2>
                  <p className="text-muted-foreground text-center max-w-md">
                    Bientôt disponible ! Nous travaillons actuellement sur des 
                    partenariats exclusifs pour vous offrir les meilleures réductions.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};
