import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Fingerprint, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { motion, AnimatePresence } from "framer-motion";
import { useConfetti, ConfettiLayer } from "@/components/marketing-lab/GoldenConfetti";
import { Progress } from "@/components/ui/progress";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"loading" | "success">("loading");
  const [progress, setProgress] = useState(0);
  const [targetDashboard, setTargetDashboard] = useState("/client/dashboard");
  const [artisanName, setArtisanName] = useState<string | null>(null);
  const [showStamp, setShowStamp] = useState(false);
  const { particles, burst } = useConfetti();

  // Animate progress bar
  useEffect(() => {
    if (phase !== "loading") return;
    const steps = [
      { target: 25, delay: 300 },
      { target: 55, delay: 800 },
      { target: 75, delay: 1400 },
      { target: 90, delay: 2000 },
    ];
    const timers = steps.map(({ target, delay }) =>
      setTimeout(() => setProgress(target), delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [phase]);

  const triggerSuccess = useCallback((name: string | null, dashboard: string) => {
    setProgress(100);
    setTimeout(() => {
      setArtisanName(name);
      setTargetDashboard(dashboard);
      setPhase("success");
      // Burst confetti
      setTimeout(() => burst(0, -20), 300);
      setTimeout(() => burst(30, -40), 500);
      // Show stamp
      setTimeout(() => setShowStamp(true), 800);
    }, 400);
  }, [burst]);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get("code");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error("Exchange error:", exchangeError);
            setError("Le lien de confirmation a expiré ou est invalide. Veuillez réessayer.");
            return;
          }
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session?.user) {
          const { data: existingRole } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!existingRole) {
            await supabase.from("user_roles").insert([{ user_id: session.user.id, role: "client" }]);
          }

          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .single();

          const { data: artisanRecord } = await supabase
            .from("artisans")
            .select("id, business_name")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (artisanRecord && roles?.role !== "artisan" && roles?.role !== "admin") {
            await supabase.from("user_roles").update({ role: "artisan" as any }).eq("user_id", session.user.id);
          }

          if (roles?.role === "artisan" && !artisanRecord) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("id, city")
              .eq("user_id", session.user.id)
              .single();

            if (profile) {
              await supabase.from("artisans").insert([
                {
                  user_id: session.user.id,
                  profile_id: profile.id,
                  business_name: "Non renseigné",
                  city: profile.city || "Non renseigné",
                  status: "pending",
                },
              ]);
            }
          }

          let dashboard = "/client/dashboard";
          if (roles?.role === "admin") {
            dashboard = "/admin/dashboard";
          } else if (artisanRecord || roles?.role === "artisan") {
            dashboard = "/artisan/dashboard";
          }

          const displayName = artisanRecord?.business_name || session.user.email?.split("@")[0] || null;

          // Trigger success with delay for premium feel
          setTimeout(() => triggerSuccess(displayName, dashboard), 1800);
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setError("Une erreur est survenue lors de la confirmation. Veuillez réessayer.");
      }
    };

    handleCallback();
  }, [navigate, searchParams, triggerSuccess]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#020617" }}>
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <Button onClick={() => navigate("/auth")}>Retour à la connexion</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Accès Élite" description="Vérification de votre identité" noIndex={true} />
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "#020617" }}>
        {/* Subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at center, rgba(212,175,55,0.06) 0%, transparent 70%)"
        }} />

        {/* Confetti layer */}
        <ConfettiLayer particles={particles} />

        <AnimatePresence mode="wait">
          {phase === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="relative max-w-md w-full mx-4"
            >
              {/* Card with animated gold border */}
              <div className="relative rounded-2xl p-[1px] overflow-hidden">
                {/* Animated border */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "conic-gradient(from 0deg, #D4AF37, #B8941F, #D4AF37, #F5E6A3, #D4AF37)",
                    animation: "spin 3s linear infinite",
                  }}
                />
                <div className="relative rounded-2xl p-8 text-center" style={{ background: "#0F172A" }}>
                  {/* Icon */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
                    style={{ background: "linear-gradient(135deg, #D4AF37, #B8941F)" }}
                  >
                    <Fingerprint className="w-8 h-8" style={{ color: "#020617" }} />
                  </motion.div>

                  <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: "#D4AF37" }}>
                    Vérification sécurisée
                  </p>

                  <h1 className="text-xl font-bold text-white mb-2">
                    IDENTITÉ RECONNUE
                  </h1>
                  <p className="text-sm text-slate-400 mb-6">
                    Accès Élite en cours de génération...
                  </p>

                  {/* Gold progress bar */}
                  <div className="relative h-2 w-full rounded-full overflow-hidden mb-3" style={{ background: "#1E293B" }}>
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #D4AF37, #F5E6A3, #D4AF37)",
                        backgroundSize: "200% 100%",
                        animation: "shimmer 1.5s linear infinite",
                      }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">{progress}%</p>
                </div>
              </div>
            </motion.div>
          )}

          {phase === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              className="relative max-w-lg w-full mx-4"
            >
              <div className="relative rounded-2xl p-[1px] overflow-hidden">
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: "conic-gradient(from 0deg, #D4AF37, #B8941F, #D4AF37, #F5E6A3, #D4AF37)",
                    animation: "spin 4s linear infinite",
                  }}
                />
                <div className="relative rounded-2xl p-8 md:p-10 text-center" style={{ background: "#0F172A" }}>

                  {/* Certification stamp */}
                  <AnimatePresence>
                    {showStamp && (
                      <motion.div
                        initial={{ scale: 3, opacity: 0, rotate: -20 }}
                        animate={{ scale: 1, opacity: 1, rotate: 0 }}
                        transition={{ duration: 0.5, type: "spring", stiffness: 300 }}
                        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 border-2"
                        style={{
                          borderColor: "#D4AF37",
                          background: "linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))",
                          boxShadow: "0 0 30px rgba(212,175,55,0.3)",
                        }}
                      >
                        <Shield className="w-10 h-10" style={{ color: "#D4AF37" }} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xs font-bold uppercase tracking-[0.25em] mb-3"
                    style={{ color: "#D4AF37" }}
                  >
                    Certifié Artisans Validés
                  </motion.p>

                  <motion.h1
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-2xl md:text-3xl font-bold text-white mb-3"
                  >
                    BIENVENU DANS LE RÉSEAU ÉLITE
                    {artisanName && (
                      <span className="block mt-1" style={{ color: "#D4AF37" }}>
                        {artisanName}
                      </span>
                    )}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-slate-400 mb-2 text-sm"
                  >
                    Nous avons vérifié vos informations.
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="text-slate-300 mb-8 text-sm font-medium"
                  >
                    Votre secteur est désormais sous protection.
                  </motion.p>

                  {/* CTA Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    <Button
                      size="lg"
                      className="w-full text-base font-bold btn-shine"
                      style={{
                        background: "linear-gradient(135deg, #D4AF37, #B8941F)",
                        color: "#020617",
                        boxShadow: "0 4px 20px rgba(212,175,55,0.35)",
                      }}
                      onClick={() => navigate(targetDashboard)}
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      PRENDRE LES COMMANDES DE MON BUSINESS
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spinning border keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default AuthCallback;
