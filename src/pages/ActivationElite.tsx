import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Zap, Users, TrendingUp, MapPin, Star, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SKELETON_PROJECTS = [
  { title: "Rénovation Toiture Complète", budget: "25 000 €", urgency: "URGENT" },
  { title: "Extension Maison + Terrasse", budget: "40 000 €", urgency: "NOUVEAU" },
  { title: "Cuisine Haut de Gamme Sur-Mesure", budget: "18 500 €", urgency: "EXCLUSIF" },
];

interface ArtisanData {
  business_name: string;
  city: string;
  description: string | null;
  photo_url: string | null;
  rating: number | null;
  review_count: number | null;
  experience_years: number | null;
  is_audited: boolean;
  id: string;
  email: string | null;
  slug: string | null;
}

const ActivationElite = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const nom = searchParams.get("nom") || "";
  const ville = searchParams.get("ville") || "";
  const sector = ville || "votre secteur";

  const [phase, setPhase] = useState<"scanning" | "reveal">("scanning");
  const [artisan, setArtisan] = useState<ArtisanData | null>(null);
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);
  const [loading, setLoading] = useState(!!email);

  // Force sign out to prevent session conflicts
  useEffect(() => {
    supabase.auth.signOut().catch(() => {});
  }, []);

  // Enrich from DB (optional — URL params are primary)
  // Auto-tracking (pending → suspended) is handled server-side in get-artisan-public
  useEffect(() => {
    if (!email) return;
    setLoading(true);
    supabase.functions.invoke("get-artisan-public", { body: { email } })
      .then(({ data }) => { if (data?.artisan) setArtisan(data.artisan); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  // Scanner → reveal after 3.2s
  useEffect(() => {
    const t = setTimeout(() => setPhase("reveal"), 3200);
    return () => clearTimeout(t);
  }, []);

  // ═══ VOIR MA FICHE: Redirect to artisan public profile ═══
  const handleClaim = async () => {
    // If we already have the slug, redirect immediately
    if (artisan?.slug) {
      window.location.href = `/artisan/${artisan.slug}?view=owner`;
      return;
    }

    // If no artisan data yet but we have email, try fetching now
    if (email) {
      try {
        const { data } = await supabase.functions.invoke("get-artisan-public", { body: { email } });
        if (data?.artisan?.slug) {
          window.location.href = `/artisan/${data.artisan.slug}?view=owner`;
          return;
        }
      } catch {}
    }

    // Fail-safe: redirect to /devenir-artisan with pre-filled params (never lose a prospect)
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (nom) params.set("nom", nom);
    if (ville) params.set("ville", ville);
    window.location.href = `/devenir-artisan?${params.toString()}`;
  };

  const displayName = nom || artisan?.business_name || "Votre Entreprise";
  const displayCity = ville || artisan?.city || sector;

  return (
    <div
      className="text-white font-['DM_Sans']"
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100vh",
        zIndex: 9999, backgroundColor: "hsl(var(--background))", overflow: "auto",
      }}
    >
      <SEOHead
        title="Sélection Élite — Alliance des Artisans Vérifiés"
        description="Revendiquez votre profil exclusif et accédez aux chantiers qualifiés de votre zone."
      />

      {/* ═══ REFUSE DIALOG ═══ */}
      <AlertDialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
        <AlertDialogContent className="bg-card border-red-500/30 text-foreground max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5" />
              Suppression définitive
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70 text-base leading-relaxed">
              Êtes-vous sûr de vouloir <span className="text-red-400 font-bold">supprimer votre fiche</span> et
              laisser vos chantiers à un concurrent direct sur{" "}
              <span className="text-primary font-bold">{sector}</span> ?
              <br /><br />
              <span className="text-white/50 text-sm">
                Cette action est irréversible. Votre place sera immédiatement libérée.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="bg-primary text-primary-foreground font-black border-none hover:bg-primary/90">
              NON, JE GARDE MA PLACE
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { setShowRefuseDialog(false); window.location.href = "/"; }}
              className="bg-red-600/20 text-red-400 border border-red-500/30 hover:bg-red-600/40"
            >
              Oui, supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence mode="wait">
        {/* ═══ PHASE 1: SCANNER ═══ */}
        {phase === "scanning" && (
          <motion.div
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen gap-8 px-4"
          >
            <div className="relative w-40 h-40">
              <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-primary/60 animate-spin" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-14 h-14 text-primary" />
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl font-black text-primary text-center tracking-wider"
            >
              ANALYSE DE VOTRE SECTEUR EN COURS…
            </motion.p>
            <p className="text-muted-foreground text-sm">Audit IA Andrea • Vérification sectorielle</p>
          </motion.div>
        )}


        {/* ═══ PHASE: REVEAL (main page) ═══ */}
        {phase === "reveal" && (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-40">

            {/* ── URGENCY BANNER ── */}
            <div
              className="w-full py-3 px-4 text-center text-sm md:text-base font-black tracking-wide bg-gradient-gold text-primary-foreground"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
            >
              ⚠️ RÉSERVE EXCLUSIVE : 3 CHANTIERS EN ATTENTE SUR{" "}
              <span className="underline uppercase">{displayCity}</span>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 md:py-14 space-y-10">

              {/* ── HERO ── */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-5">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary font-bold">
                  <Shield className="w-4 h-4" /> CERTIFIÉ IA ANDREA
                </div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                  <span className="text-foreground">REVENDIQUEZ VOTRE FICHE :</span>
                  <br />
                  <span className="text-primary">{displayName}</span>
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Ici, pas de foire d'empoigne. On ne vend pas vos contacts à 10 concurrents.
                  On crée votre image de marque et on vous apporte l'exclusivité.{" "}
                  <span className="text-primary font-bold">C'est votre secteur, ou celui d'un autre.</span>
                </p>
              </motion.div>

              {/* ── FICHE ARTISAN (MIROIR) ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl overflow-hidden bg-card"
                style={{ border: "1px solid hsl(var(--primary) / 0.25)", boxShadow: "0 0 40px hsl(var(--primary) / 0.08)" }}
              >
                <div className="p-5 md:p-8">
                  <p className="text-xs font-bold tracking-widest text-primary/60 mb-4">VOTRE VITRINE PROFESSIONNELLE</p>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shrink-0 bg-muted">
                      {artisan?.photo_url ? (
                        <img src={artisan.photo_url} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shield className="w-10 h-10 text-primary/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl md:text-2xl font-black text-foreground">{displayName}</h2>
                        {artisan?.is_audited && (
                          <span className="inline-flex items-center gap-1 bg-primary/15 border border-primary/30 rounded-full px-2.5 py-0.5 text-xs font-bold text-primary">
                            <CheckCircle className="w-3 h-3" /> AUDITÉ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-primary/70" /> {displayCity}
                        </span>
                        {(artisan?.rating ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-primary" fill="hsl(var(--primary))" />
                            {artisan?.rating}/5 ({artisan?.review_count} avis)
                          </span>
                        )}
                      </div>
                      {artisan?.description && <p className="text-sm text-muted-foreground line-clamp-2">{artisan.description}</p>}
                    </div>
                  </div>

                  {/* BADGE STATUS */}
                  <div
                    className="mt-6 rounded-xl p-4 flex items-center gap-4 bg-primary/5"
                    style={{ border: "1px solid hsl(var(--primary) / 0.2)" }}
                  >
                    <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0 relative">
                      <Lock className="w-6 h-6 text-primary" />
                      <div className="absolute inset-0 rounded-full animate-pulse" style={{ boxShadow: "0 0 15px hsl(var(--primary) / 0.3)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-primary">
                        🔒 STATUT : VÉRIFICATION D'IDENTITÉ REQUISE
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Confirmez votre identité en un clic pour débloquer vos contacts clients.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── MISSIONS FLOUES ── */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-black text-foreground">🔒 Chantiers réservés — {sector}</h2>
                  <span className="text-xs font-bold text-primary/60 bg-primary/10 px-3 py-1 rounded-full">ACCÈS VERROUILLÉ</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {SKELETON_PROJECTS.map((p, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden bg-card" style={{ border: "1px solid hsl(var(--primary) / 0.15)" }}>
                      <div className="absolute inset-0 z-10 backdrop-blur-md bg-background/70 flex flex-col items-center justify-center gap-2">
                        <Lock className="w-8 h-8 text-primary" />
                        <span className="text-[10px] font-black tracking-widest text-primary">RÉSERVÉ AUX MEMBRES</span>
                      </div>
                      <div className="p-5 space-y-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded"
                          style={{ background: p.urgency === "URGENT" ? "rgba(234,88,12,0.2)" : "hsl(var(--primary) / 0.15)", color: p.urgency === "URGENT" ? "#F97316" : "hsl(var(--primary))" }}
                        >{p.urgency}</span>
                        <p className="font-bold text-foreground text-lg">{p.title}</p>
                        <p className="text-muted-foreground text-sm">Secteur {sector}</p>
                        <p className="text-primary font-black text-xl mt-2">{p.budget}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ── VALUE PROPS ── */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3">
                {[
                  { icon: Zap, text: "Filtrage IA Andrea : 0 curieux, 100% de rendez-vous qualifiés." },
                  { icon: Users, text: "Exclusivité Partagée : Seulement 2 professionnels par métier et par ville." },
                  { icon: TrendingUp, text: "Zéro Commission : Votre chiffre d'affaires vous appartient à 100%." },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-start gap-4 rounded-xl p-4 bg-card" style={{ border: "1px solid hsl(var(--primary) / 0.1)" }}>
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-foreground/85 text-sm md:text-base">{text}</p>
                  </div>
                ))}
              </motion.div>

              {/* ═══ ZONE DE DÉCISION : 1-CLICK ═══ */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 }}
                className="text-center space-y-5 pt-4"
              >
                {/* BOUTON OR — ENVOI IMMÉDIAT */}
                <button
                  onClick={handleClaim}
                  disabled={loading}
                  className="w-full md:w-auto px-10 py-5 rounded-xl font-black text-base md:text-lg uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden disabled:opacity-70 disabled:cursor-wait bg-primary text-primary-foreground"
                  style={{
                    boxShadow: "0 8px 30px hsl(var(--primary) / 0.35)",
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> CHARGEMENT…</> : "👁️ VOIR MA FICHE"}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </button>

                {/* BOUTON GRIS — REFUS */}
                <div>
                  <button
                    onClick={() => setShowRefuseDialog(true)}
                    className="text-xs text-muted-foreground/50 hover:text-red-400/70 transition-colors underline underline-offset-4 decoration-muted/20 hover:decoration-red-400/30"
                  >
                    Non, supprimer ma fiche et céder mes chantiers à un concurrent.
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ActivationElite;
