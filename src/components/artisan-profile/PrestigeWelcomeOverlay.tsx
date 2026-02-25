import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PRICES } from "@/config/subscriptionPlans";
import { Shield, Lock, Clock, Star, Sparkles, Crown, Loader2, Users, AlertTriangle } from "lucide-react";

interface PrestigeWelcomeOverlayProps {
  artisanName: string;
  city: string;
  artisanEmail?: string | null;
  artisanId: string;
  categoryName?: string | null;
  categoryId?: string | null;
}

const PrestigeWelcomeOverlay = ({
  artisanName,
  city,
  artisanEmail,
  artisanId,
  categoryName,
  categoryId,
}: PrestigeWelcomeOverlayProps) => {
  const [open, setOpen] = useState(false);
  const [sectorCount, setSectorCount] = useState<number | null>(null);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState("");

  // Show overlay after short delay
  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // Check sector availability
  useEffect(() => {
    const checkSector = async () => {
      let query = supabase
        .from("artisans")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .eq("city", city);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { count } = await query;
      setSectorCount(count || 0);
    };
    checkSector();
  }, [city, categoryId]);

  // Dynamic 24h countdown from first visit (stored in localStorage)
  useEffect(() => {
    const storageKey = `prestige_first_visit_${artisanId}`;
    let firstVisit = localStorage.getItem(storageKey);
    if (!firstVisit) {
      firstVisit = new Date().toISOString();
      localStorage.setItem(storageKey, firstVisit);
    }
    const deadline = new Date(new Date(firstVisit).getTime() + 24 * 60 * 60 * 1000);

    const tick = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();
      if (diff <= 0) {
        setCountdown("EXPIRÉ");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [artisanId]);

  const isSectorFull = sectorCount !== null && sectorCount >= 2;
  const placesLeft = sectorCount !== null ? Math.max(0, 2 - sectorCount) : 1;

  const handleCheckout = useCallback(async (priceId: string) => {
    setLoadingPriceId(priceId);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        // Not logged in — redirect to subscription page
        window.location.href = "/artisan/abonnement";
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { price_id: priceId },
        headers: { Authorization: `Bearer ${session.session.access_token}` },
      });

      if (error) throw error;
      const responseData = typeof data === "string" ? JSON.parse(data) : data;
      if (responseData?.url) {
        window.location.href = responseData.url;
      }
    } catch {
      // Fallback: redirect to subscription page
      window.location.href = "/artisan/abonnement";
    } finally {
      setLoadingPriceId(null);
    }
  }, []);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-xl p-0 border-0 overflow-hidden bg-transparent shadow-none [&>button]:text-white/60 [&>button]:hover:text-white"
      >
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #0A192F 0%, #060C18 100%)",
            border: "2px solid rgba(212,175,55,0.4)",
            boxShadow: "0 0 0 1px rgba(212,175,55,0.1), 0 30px 80px rgba(0,0,0,0.8)",
          }}
        >
          {/* Sector full banner */}
          {isSectorFull && (
            <div className="bg-red-500/15 border-b border-red-500/30 px-6 py-3 text-center">
              <p className="text-sm font-bold text-red-400 flex items-center justify-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                SECTEUR COMPLET — Liste d'attente activée
              </p>
            </div>
          )}

          {/* Header */}
          <div className="px-6 pt-8 pb-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 mb-4">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-[3px]">Artisans Validés</span>
            </div>

            <h2
              className="text-xl md:text-2xl font-black text-white mb-2 leading-tight"
              style={{ fontFamily: "'DM Sans',sans-serif" }}
            >
              Félicitations {artisanName.split(" ")[0]},
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-md mx-auto">
              Votre <span className="text-primary font-bold">Actif Numérique Prestige</span> est prêt.
              <br />
              État : <span className="text-amber-400 font-bold">EN ATTENTE DE VERROUILLAGE</span>
            </p>

            {/* Scarcity badge */}
            <div className="flex items-center justify-center gap-3 mt-5">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-white">
                  Places sur {city} :
                  <span className={placesLeft === 0 ? "text-red-400 ml-1" : "text-primary ml-1"}>
                    {placesLeft}/2
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/8 border border-red-500/20">
                <Clock className="h-4 w-4 text-red-400" />
                <span className="text-sm font-bold text-red-400 font-mono">{countdown}</span>
              </div>
            </div>
          </div>

          {/* Pricing cards */}
          {!isSectorFull ? (
            <div className="px-6 pb-6 pt-2">
              <p className="text-center text-[10px] font-bold text-white/30 uppercase tracking-[3px] mb-4">
                Choisissez votre formule d'activation
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Monthly */}
                <div className="rounded-xl p-5 border border-white/10 bg-white/3 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="h-5 w-5 text-white/60" />
                    <span className="text-sm font-bold text-white">Activation Mensuelle</span>
                  </div>
                  <div className="mb-3">
                    <span className="text-3xl font-black text-white">99€</span>
                    <span className="text-white/40 text-sm"> HT/mois</span>
                  </div>
                  <ul className="space-y-1.5 mb-5 text-xs text-white/50">
                    <li className="flex items-center gap-1.5"><Lock className="h-3 w-3 text-primary" /> Exclusivité secteur immédiate</li>
                    <li className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-primary" /> Badge Artisan Validé</li>
                     <li className="flex items-center gap-1.5"><Star className="h-3 w-3 text-primary" /> Sans engagement</li>
                  </ul>
                  <p className="text-[10px] text-white/40 mb-3 text-center">✓ Satisfait ou remboursé 30 jours · Résiliation en 1 clic</p>
                  <Button
                    className="w-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:bg-primary/90"
                    onClick={() => handleCheckout(STRIPE_PRICES.artisan_valide.monthly)}
                    disabled={!!loadingPriceId}
                  >
                    {loadingPriceId === STRIPE_PRICES.artisan_valide.monthly ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirection…</>
                    ) : "🔒 ACTIVER — 99€/mois"}
                  </Button>
                </div>

                {/* Yearly — highlighted */}
                <div
                  className="rounded-xl p-5 relative border-2 border-primary/50 bg-primary/5"
                  style={{ boxShadow: "0 0 40px rgba(212,175,55,0.1)" }}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-[10px] font-black px-3 py-1 shadow-lg">
                      <Star className="h-3 w-3 fill-white mr-1" />
                      MEILLEUR CHOIX
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mb-3 mt-1">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm font-bold text-primary">Boost Annuel</span>
                  </div>
                  <div className="mb-1">
                    <span className="text-3xl font-black text-white">990€</span>
                    <span className="text-white/40 text-sm"> HT/an</span>
                  </div>
                  <p className="text-xs text-white/40 mb-3">soit 82,50€/mois — <span className="text-primary font-bold">2 mois offerts</span></p>
                  <ul className="space-y-1.5 mb-5 text-xs text-white/50">
                    <li className="flex items-center gap-1.5"><Lock className="h-3 w-3 text-primary" /> Exclusivité secteur immédiate</li>
                    <li className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-amber-400" /> Badge Audité offert</li>
                     <li className="flex items-center gap-1.5"><Star className="h-3 w-3 text-amber-400" /> 3 RDV qualifiés garantis</li>
                  </ul>
                  <p className="text-[10px] text-white/40 mb-3 text-center">✓ Satisfait ou remboursé 30 jours · Résiliation en 1 clic</p>
                  <Button
                    className="w-full bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider hover:bg-primary/90 relative overflow-hidden"
                    onClick={() => handleCheckout(STRIPE_PRICES.artisan_valide.yearly)}
                    disabled={!!loadingPriceId}
                  >
                    {loadingPriceId === STRIPE_PRICES.artisan_valide.yearly ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirection…</>
                    ) : "🔒 ACTIVER — 990€/an"}
                    {!loadingPriceId && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Guarantee */}
              <p className="text-center text-[10px] text-white/25 mt-4">
                ✅ 100% satisfait ou remboursé sous 30 jours · Résiliation en 1 clic
              </p>
            </div>
          ) : (
            /* Sector full — waitlist mode */
            <div className="px-6 pb-8 pt-4 text-center">
              <div className="p-6 rounded-xl bg-red-500/5 border border-red-500/20 mb-4">
                <Lock className="h-8 w-8 text-red-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">
                  Secteur {city} — {categoryName || "votre métier"} complet
                </h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Les 2 places exclusives sont déjà attribuées. 
                  Inscrivez-vous en liste d'attente pour être prioritaire dès qu'une place se libère.
                </p>
              </div>
              <Button
                className="bg-white/10 text-white font-bold hover:bg-white/15 border border-white/20"
                onClick={() => setOpen(false)}
              >
                Consulter ma fiche en attendant
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </Dialog>
  );
};

export default PrestigeWelcomeOverlay;
