import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Zap, Users, TrendingUp, MapPin, Star, CheckCircle, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SKELETON_PROJECTS = [
  { title: "Rénovation Toiture Complète", city: "En attente…", budget: "25 000 €", urgency: "URGENT" },
  { title: "Extension Maison + Terrasse", city: "En attente…", budget: "40 000 €", urgency: "NOUVEAU" },
  { title: "Cuisine Haut de Gamme Sur-Mesure", city: "En attente…", budget: "18 500 €", urgency: "EXCLUSIF" },
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
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const sector = searchParams.get("sector") || searchParams.get("city") || "";

  const [phase, setPhase] = useState<"scanning" | "reveal">("scanning");
  const [artisan, setArtisan] = useState<ArtisanData | null>(null);
  const [displaySector, setDisplaySector] = useState(sector || "VOTRE ZONE");
  const [isActivating, setIsActivating] = useState(false);

  // Fetch artisan data from email
  useEffect(() => {
    const fetchArtisan = async () => {
      if (!email) return;
      const { data } = await supabase
        .from("artisans")
        .select("id, business_name, city, description, photo_url, rating, review_count, experience_years, is_audited, email, slug")
        .eq("email", email)
        .maybeSingle();
      if (data) {
        setArtisan(data);
        if (!sector) setDisplaySector(data.city);
      }
    };
    fetchArtisan();
  }, [email, sector]);

  // Scanner phase
  useEffect(() => {
    const timer = setTimeout(() => setPhase("reveal"), 3200);
    return () => clearTimeout(timer);
  }, []);

  // === ACTIVATION DIRECTE — ZÉRO FRICTION ===
  const handleActivate = () => {
    if (!email) {
      toast.error("Lien d'activation invalide.");
      return;
    }

    setIsActivating(true);

    // Stocker les données pour le bypass ProtectedRoute
    localStorage.setItem("elite_activation_email", email);
    if (artisan) {
      localStorage.setItem("elite_artisan_id", artisan.id);
      localStorage.setItem("elite_artisan_name", artisan.business_name);
    }

    // Redirection INSTANTANÉE — pas de délai, pas d'auth
    window.location.href = "/artisan/dashboard";
  };

  const handleRefuse = () => {
    if (confirm("⚠️ Êtes-vous sûr ? Votre vitrine sera supprimée et votre place libérée pour un concurrent direct.")) {
      navigate("/");
    }
  };

  return (
    <div
      className="text-white"
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100vh",
        zIndex: 9999, backgroundColor: "#0A192F", overflow: "auto",
      }}
    >
      <SEOHead
        title="Activation Élite — Alliance des Artisans Vérifiés"
        description="Activez votre secteur exclusif et accédez aux chantiers qualifiés de votre zone."
      />

      <AnimatePresence mode="wait">
        {phase === "scanning" ? (
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
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pb-40"
          >
            {/* ═══ 1. URGENCY BANNER ═══ */}
            <div
              className="w-full py-2.5 px-4 text-center text-sm md:text-base font-black tracking-wide"
              style={{
                background: "linear-gradient(90deg, #EA580C, #F97316, #EA580C)",
                color: "#FFFFFF",
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              ⚠️ ATTENTION : Appels clients en attente de déblocage pour{" "}
              <span className="underline">{artisan?.business_name || "votre entreprise"}</span>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 md:py-14 space-y-10">

              {/* ═══ HERO COPY ═══ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-5"
              >
                <div className="inline-flex items-center gap-2 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-full px-4 py-1.5 text-sm text-[#FFB800] font-bold">
                  <Shield className="w-4 h-4" /> CERTIFIÉ IA ANDREA
                </div>
                <h1 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight">
                  <span className="text-white">ARRÊTEZ D'ACHETER DES LEADS PARTAGÉS.</span>
                  <br />
                  <span className="text-[#FFB800]">PRENEZ L'EXCLUSIVITÉ SUR {displaySector.toUpperCase()}.</span>
                </h1>
                <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
                  Ici, pas de foire d'empoigne. On ne vend pas vos contacts à 10 concurrents.
                  On crée votre image de marque et on vous apporte l'exclusivité.{" "}
                  <span className="text-[#FFB800] font-bold">
                    C'est votre secteur, ou celui d'un autre.
                  </span>
                </p>
              </motion.div>

              {/* ═══ 2. LE MIROIR — FICHE ARTISAN ═══ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#0F1B2E",
                  border: "1px solid rgba(255,184,0,0.25)",
                  boxShadow: "0 0 40px rgba(255,184,0,0.08)",
                }}
              >
                <div className="p-5 md:p-8">
                  <p className="text-xs font-bold tracking-widest text-[#FFB800]/60 mb-4">
                    VOTRE VITRINE PROFESSIONNELLE
                  </p>

                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Photo */}
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden shrink-0 bg-[#1a2940]">
                      {artisan?.photo_url ? (
                        <img src={artisan.photo_url} alt={artisan.business_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Shield className="w-10 h-10 text-[#FFB800]/40" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-xl md:text-2xl font-black text-white">
                          {artisan?.business_name || "Votre Entreprise"}
                        </h2>
                        {artisan?.is_audited && (
                          <span className="inline-flex items-center gap-1 bg-[#FFB800]/15 border border-[#FFB800]/30 rounded-full px-2.5 py-0.5 text-xs font-bold text-[#FFB800]">
                            <CheckCircle className="w-3 h-3" /> AUDITÉ
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-white/60">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-[#FFB800]/70" />
                          {artisan?.city || displaySector}
                        </span>
                        {(artisan?.rating ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-[#FFB800]" fill="#FFB800" />
                            {artisan?.rating}/5 ({artisan?.review_count} avis)
                          </span>
                        )}
                        {(artisan?.experience_years ?? 0) > 0 && (
                          <span>{artisan?.experience_years} ans d'exp.</span>
                        )}
                      </div>

                      {artisan?.description && (
                        <p className="text-sm text-white/50 line-clamp-2">{artisan.description}</p>
                      )}
                    </div>
                  </div>

                  {/* CONTACT BLOQUÉ */}
                  <div
                    className="mt-6 rounded-xl p-4 flex items-center gap-4"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,184,0,0.08), rgba(255,184,0,0.03))",
                      border: "1px solid rgba(255,184,0,0.2)",
                    }}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#FFB800]/15 flex items-center justify-center shrink-0">
                      <Shield className="w-6 h-6 text-[#FFB800]" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-[#FFB800]">
                        🛡️ DOSSIER EN COURS DE VALIDATION FINALE
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        Votre vitrine est prête. On vérifie juste que vous êtes le bon partenaire pour nos clients.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ═══ 3. LE COFFRE-FORT — MISSIONS FLOUES ═══ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-black text-white">
                    🔒 Chantiers réservés — Secteur {displaySector}
                  </h2>
                  <span className="text-xs font-bold text-[#FFB800]/60 bg-[#FFB800]/10 px-3 py-1 rounded-full">
                    ACCÈS VERROUILLÉ
                  </span>
                </div>
                <p className="text-sm text-white/50 mb-5">
                  Ces chantiers sont réservés aux membres Élite du secteur <span className="text-[#FFB800] font-bold">{displaySector}</span>.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  {SKELETON_PROJECTS.map((p, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden"
                      style={{
                        border: "1px solid rgba(255,184,0,0.15)",
                        background: "#0F1B2E",
                      }}
                    >
                      <div className="absolute inset-0 z-10 backdrop-blur-md bg-[#0A192F]/70 flex flex-col items-center justify-center gap-2">
                        <Lock className="w-8 h-8 text-[#FFB800]" />
                        <span className="text-[10px] font-black tracking-widest text-[#FFB800]">
                          RÉSERVÉ AUX MEMBRES
                        </span>
                      </div>
                      <div className="p-5 space-y-2">
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded"
                          style={{
                            background: p.urgency === "URGENT" ? "rgba(234,88,12,0.2)" : "rgba(255,184,0,0.15)",
                            color: p.urgency === "URGENT" ? "#F97316" : "#FFB800",
                          }}
                        >
                          {p.urgency}
                        </span>
                        <p className="font-bold text-white text-lg">{p.title}</p>
                        <p className="text-white/40 text-sm">{p.city}</p>
                        <p className="text-[#FFB800] font-black text-xl mt-2">{p.budget}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ═══ 4. VALUE PROPS ═══ */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-3"
              >
                {[
                  { icon: Zap, text: "Filtrage IA Andrea : 0 curieux, 100% de rendez-vous qualifiés." },
                  { icon: Users, text: "Exclusivité Partagée : Seulement 2 professionnels par métier et par ville." },
                  { icon: TrendingUp, text: "Zéro Commission : Votre chiffre d'affaires vous appartient à 100%." },
                ].map(({ icon: Icon, text }, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 rounded-xl p-4"
                    style={{ background: "#0F1B2E", border: "1px solid rgba(255,184,0,0.1)" }}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FFB800]/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#FFB800]" />
                    </div>
                    <p className="text-white/85 text-sm md:text-base">{text}</p>
                  </div>
                ))}
              </motion.div>

              {/* ═══ 5. L'ULTIMATUM — CTAs ═══ */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.65 }}
                className="text-center space-y-5 pt-4"
              >
                <button
                  onClick={handleActivate}
                  disabled={isActivating}
                  className="w-full md:w-auto px-10 py-5 rounded-xl font-black text-base md:text-lg uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait"
                  style={{
                    background: "linear-gradient(135deg, #FFB800, #f0a500)",
                    color: "#0A192F",
                    boxShadow: "0 8px 30px rgba(255,184,0,0.35)",
                    fontFamily: "'Montserrat',sans-serif",
                  }}
                >
                  {isActivating ? (
                    <span className="flex items-center justify-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      ACTIVATION EN COURS…
                    </span>
                  ) : (
                    "✅ OUI, J'ACTIVE MON ACCÈS ÉLITE"
                  )}
                </button>

                <div>
                  <button
                    onClick={handleRefuse}
                    disabled={isActivating}
                    className="text-xs text-white/30 hover:text-red-400/70 transition-colors underline underline-offset-4 decoration-white/10 hover:decoration-red-400/30"
                  >
                    Non, supprimer ma vitrine et libérer ma place pour un concurrent.
                  </button>
                </div>
              </motion.div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivationElite;
