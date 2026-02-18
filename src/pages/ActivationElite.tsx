import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Zap, Users, TrendingUp, MapPin, Star, CheckCircle, Loader2, Mail, AlertTriangle } from "lucide-react";
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

  const [phase, setPhase] = useState<"scanning" | "reveal" | "sent">("scanning");
  const [artisan, setArtisan] = useState<ArtisanData | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);

  // Force sign out to prevent session conflicts
  useEffect(() => {
    supabase.auth.signOut().catch(() => {});
  }, []);

  // Enrich from DB (optional — URL params are primary)
  useEffect(() => {
    if (!email) return;
    supabase.functions.invoke("get-artisan-public", { body: { email } })
      .then(({ data }) => { if (data?.artisan) setArtisan(data.artisan); })
      .catch(() => {});
  }, [email]);

  // Scanner → reveal after 3.2s
  useEffect(() => {
    const t = setTimeout(() => setPhase("reveal"), 3200);
    return () => clearTimeout(t);
  }, []);

  // ═══ 1-CLICK: Send OTP immediately using URL email ═══
  const handleClaim = async () => {
    if (!email) {
      toast.error("Email manquant dans le lien. Contactez votre conseiller.");
      return;
    }
    setIsSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/artisan/dashboard`,
        },
      });
      if (error) {
        console.warn("[ActivationElite] OTP error:", error.message);
        // Fallback: store and redirect
        localStorage.setItem("elite_activation_email", email);
        if (artisan) {
          localStorage.setItem("elite_artisan_id", artisan.id);
          localStorage.setItem("elite_artisan_name", artisan.business_name);
        }
        toast.success("Accès activé ! Redirection…");
        setTimeout(() => { window.location.href = "/artisan/dashboard"; }, 1200);
        return;
      }
      setPhase("sent");
      toast.success("🔑 Lien d'accès envoyé !");
    } catch {
      localStorage.setItem("elite_activation_email", email);
      window.location.href = "/artisan/dashboard";
    } finally {
      setIsSending(false);
    }
  };

  const displayName = nom || artisan?.business_name || "Votre Entreprise";
  const displayCity = ville || artisan?.city || sector;

  return (
    <div
      className="text-white"
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100vh",
        zIndex: 9999, backgroundColor: "#0A192F", overflow: "auto",
      }}
    >
      <SEOHead
        title="Sélection Élite — Alliance des Artisans Vérifiés"
        description="Revendiquez votre profil exclusif et accédez aux chantiers qualifiés de votre zone."
      />

      {/* ═══ REFUSE DIALOG ═══ */}
      <AlertDialog open={showRefuseDialog} onOpenChange={setShowRefuseDialog}>
        <AlertDialogContent className="bg-[#0F1B2E] border-red-500/30 text-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-400 flex items-center gap-2 text-lg">
              <AlertTriangle className="w-5 h-5" />
              Suppression définitive
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70 text-base leading-relaxed">
              Êtes-vous sûr de vouloir <span className="text-red-400 font-bold">supprimer votre fiche</span> et
              laisser vos chantiers à un concurrent direct sur{" "}
              <span className="text-[#FFB800] font-bold">{sector}</span> ?
              <br /><br />
              <span className="text-white/50 text-sm">
                Cette action est irréversible. Votre place sera immédiatement libérée.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="bg-[#FFB800] text-[#0A192F] font-black border-none hover:bg-[#f0a500]">
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
              <div className="absolute inset-0 rounded-full border-4 border-[#FFB800]/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-[#FFB800]/60 animate-spin" style={{ animationDuration: "2s" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-14 h-14 text-[#FFB800]" />
              </div>
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl font-black text-[#FFB800] text-center tracking-wider"
            >
              ANALYSE DE VOTRE SECTEUR EN COURS…
            </motion.p>
            <p className="text-white/40 text-sm">Audit IA Andrea • Vérification sectorielle</p>
          </motion.div>
        )}

        {/* ═══ PHASE: SUCCESS ═══ */}
        {phase === "sent" && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-screen gap-6 px-4 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-[#FFB800]/15 flex items-center justify-center">
              <Mail className="w-12 h-12 text-[#FFB800]" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-[#FFB800]">
              ✅ LIEN D'ACCÈS ENVOYÉ !
            </h2>
            <p className="text-white/70 max-w-md text-lg">
              Vérifiez vos emails pour débloquer{" "}
              <span className="text-[#FFB800] font-bold">{displayName}</span>.
            </p>
            <p className="text-white/40 text-sm">
              Un lien sécurisé a été envoyé à <span className="text-[#FFB800]">{email}</span>.
            </p>
            <p className="text-white/25 text-xs mt-4">Vérifiez vos spams si nécessaire.</p>
          </motion.div>
        )}

        {/* ═══ PHASE: REVEAL (main page) ═══ */}
        {phase === "reveal" && (
          <motion.div key="reveal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-40">

            {/* ── URGENCY BANNER ── */}
            <div
              className="w-full py-3 px-4 text-center text-sm md:text-base font-black tracking-wide"
              style={{
                background: "linear-gradient(90deg, #EA580C, #F97316, #EA580C)",
                color: "#FFF",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              ⚠️ RÉSERVE EXCLUSIVE : 3 CHANTIERS EN ATTENTE SUR{" "}
              <span className="underline uppercase">{displayCity}</span>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 md:py-14 space-y-10">

              {/* ── HERO ── */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-5">
                <div className="inline-flex items-center gap-2 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-full px-4 py-1.5 text-sm text-[#FFB800] font-bold">
                  <Shield className="w-4 h-4" /> CERTIFIÉ IA ANDREA
                </div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight">
                  <span className="text-white">REVENDIQUEZ VOTRE FICHE :</span>
                  <br />
                  <span className="text-[#FFB800]">{displayName}</span>
                </h1>
                <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                  Ici, pas de foire d'empoigne. On ne vend pas vos contacts à 10 concurrents.
                  On crée votre image de marque et on vous apporte l'exclusivité.{" "}
                  <span className="text-[#FFB800] font-bold">C'est votre secteur, ou celui d'un autre.</span>
                </p>
              </motion.div>

              {/* ── FICHE ARTISAN (MIROIR) ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl overflow-hidden"
                style={{ background: "#0F1B2E", border: "1px solid rgba(255,184,0,0.25)", boxShadow: "0 0 40px rgba(255,184,0,0.08)" }}
              >
                <div className="p-5 md:p-8">
                  <p className="text-xs font-bold tracking-widest text-[#FFB800]/60 mb-4">VOTRE VITRINE PROFESSIONNELLE</p>
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shrink-0 bg-[#1a2940]">
                      {artisan?.photo_url ? (
                        <img src={artisan.photo_url} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shield className="w-10 h-10 text-[#FFB800]/40" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl md:text-2xl font-black text-white">{displayName}</h2>
                        {artisan?.is_audited && (
                          <span className="inline-flex items-center gap-1 bg-[#FFB800]/15 border border-[#FFB800]/30 rounded-full px-2.5 py-0.5 text-xs font-bold text-[#FFB800]">
                            <CheckCircle className="w-3 h-3" /> AUDITÉ
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-[#FFB800]/70" /> {displayCity}
                        </span>
                        {(artisan?.rating ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-[#FFB800]" fill="#FFB800" />
                            {artisan?.rating}/5 ({artisan?.review_count} avis)
                          </span>
                        )}
                      </div>
                      {artisan?.description && <p className="text-sm text-white/50 line-clamp-2">{artisan.description}</p>}
                    </div>
                  </div>

                  {/* BADGE STATUS */}
                  <div
                    className="mt-6 rounded-xl p-4 flex items-center gap-4"
                    style={{ background: "linear-gradient(135deg, rgba(255,184,0,0.08), rgba(255,184,0,0.03))", border: "1px solid rgba(255,184,0,0.2)" }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FFB800]/15 flex items-center justify-center shrink-0 relative">
                      <Lock className="w-6 h-6 text-[#FFB800]" />
                      <div className="absolute inset-0 rounded-full animate-pulse" style={{ boxShadow: "0 0 15px rgba(255,184,0,0.3)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#FFB800]">
                        🔒 STATUT : VÉRIFICATION D'IDENTITÉ REQUISE
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        Confirmez votre identité en un clic pour débloquer vos contacts clients.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── MISSIONS FLOUES ── */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-black text-white">🔒 Chantiers réservés — {sector}</h2>
                  <span className="text-xs font-bold text-[#FFB800]/60 bg-[#FFB800]/10 px-3 py-1 rounded-full">ACCÈS VERROUILLÉ</span>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {SKELETON_PROJECTS.map((p, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,184,0,0.15)", background: "#0F1B2E" }}>
                      <div className="absolute inset-0 z-10 backdrop-blur-md bg-[#0A192F]/70 flex flex-col items-center justify-center gap-2">
                        <Lock className="w-8 h-8 text-[#FFB800]" />
                        <span className="text-[10px] font-black tracking-widest text-[#FFB800]">RÉSERVÉ AUX MEMBRES</span>
                      </div>
                      <div className="p-5 space-y-2">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded"
                          style={{ background: p.urgency === "URGENT" ? "rgba(234,88,12,0.2)" : "rgba(255,184,0,0.15)", color: p.urgency === "URGENT" ? "#F97316" : "#FFB800" }}
                        >{p.urgency}</span>
                        <p className="font-bold text-white text-lg">{p.title}</p>
                        <p className="text-white/40 text-sm">Secteur {sector}</p>
                        <p className="text-[#FFB800] font-black text-xl mt-2">{p.budget}</p>
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
                  <div key={i} className="flex items-start gap-4 rounded-xl p-4" style={{ background: "#0F1B2E", border: "1px solid rgba(255,184,0,0.1)" }}>
                    <div className="w-10 h-10 rounded-full bg-[#FFB800]/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#FFB800]" />
                    </div>
                    <p className="text-white/85 text-sm md:text-base">{text}</p>
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
                  disabled={isSending}
                  className="w-full md:w-auto px-10 py-5 rounded-xl font-black text-base md:text-lg uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #FFB800, #f0a500)",
                    color: "#0A192F",
                    boxShadow: "0 8px 30px rgba(255,184,0,0.35)",
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSending ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> ENVOI EN COURS…</>
                    ) : (
                      <>✅ OUI, JE REVENDIQUE MON PROFIL ET MES CHANTIERS</>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </button>

                {/* BOUTON GRIS — REFUS */}
                <div>
                  <button
                    onClick={() => setShowRefuseDialog(true)}
                    className="text-xs text-white/30 hover:text-red-400/70 transition-colors underline underline-offset-4 decoration-white/10 hover:decoration-red-400/30"
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
