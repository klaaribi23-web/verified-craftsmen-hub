import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, Shield, Lock, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { motion, AnimatePresence } from "framer-motion";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [targetDashboard, setTargetDashboard] = useState<string>("/client/dashboard");
  const [isClient, setIsClient] = useState(false);
  const [sectorName, setSectorName] = useState("NORD");

  // Countdown timer
  const [countdown, setCountdown] = useState({ h: 23, m: 59, s: 59 });
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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
            .select("id, city, department, region")
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

          // Determine sector name from artisan data
          if (artisanRecord) {
            setSectorName(artisanRecord.department || artisanRecord.region || artisanRecord.city || "NORD");
          }

          let dashboard = "/client/dashboard";
          if (roles?.role === "admin") {
            dashboard = "/admin/dashboard";
          } else if (artisanRecord || roles?.role === "artisan") {
            dashboard = "/artisan/dashboard";
          } else {
            setIsClient(true);
          }

          setTargetDashboard(dashboard);
          setShowSuccess(true);

          setTimeout(() => {
            navigate(dashboard);
          }, 4000);
        } else {
          navigate("/auth");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        setError("Une erreur est survenue lors de la confirmation. Veuillez réessayer.");
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto bg-destructive/20 rounded-full flex items-center justify-center border border-destructive/30">
            <Shield className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-white text-lg">{error}</p>
          <Button variant="gold" onClick={() => navigate("/auth")}>Retour à la connexion</Button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A192F' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 p-8 max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto bg-primary/20 rounded-full flex items-center justify-center border-2 border-primary/50 shadow-gold"
          >
            <CheckCircle className="h-12 w-12 text-primary" />
          </motion.div>

          <h1 className="text-3xl font-black text-primary uppercase tracking-wide">
            {isClient ? "BIENVENUE DANS L'ÉLITE" : "ACCÈS SECTEUR CONFIRMÉ"}
          </h1>
          <p className="text-lg text-white">
            {isClient
              ? "Confiez votre projet aux meilleurs artisans certifiés."
              : `Secteur ${sectorName.toUpperCase()} — Votre exclusivité est activée.`}
          </p>

          {/* Progress bar */}
          <motion.div
            className="w-full h-1.5 bg-secondary rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="h-full bg-gradient-gold rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3.5, ease: "easeInOut" }}
            />
          </motion.div>

          <div className="flex items-center justify-center gap-2 text-white/60">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Redirection vers votre espace...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Scanner / Loading state — the "Magic Link Entry"
  return (
    <>
      <SEOHead title="Vérification en cours" description="Accès sécurisé à votre espace" noIndex={true} />
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#0A192F' }}>
        {/* Scanner sweep animation */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.08) 50%, transparent 100%)' }}
          animate={{ y: ['-100%', '100%'] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 text-center px-6 max-w-lg"
        >
          {/* Scanner icon */}
          <motion.div
            className="w-20 h-20 mx-auto mb-6 rounded-2xl border-2 border-primary/40 flex items-center justify-center bg-primary/10"
            animate={{ borderColor: ['rgba(212,175,55,0.4)', 'rgba(212,175,55,0.8)', 'rgba(212,175,55,0.4)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Scan className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Scanner text */}
          <motion.p
            className="text-sm font-semibold text-primary uppercase tracking-[0.2em] mb-4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            VÉRIFICATION DE VOTRE ACCÈS ÉLITE...
          </motion.p>

          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide mb-3">
            ACCÈS EXCLUSIF
          </h1>
          <p className="text-lg text-white mb-2">
            Secteur <span className="text-primary font-bold">{sectorName.toUpperCase()}</span> réservé
          </p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-1 my-6">
            <Lock className="w-4 h-4 text-primary mr-2" />
            <span className="text-xs text-white uppercase tracking-wider mr-3">Priorité expire dans</span>
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map((unit, i) => (
              <span key={i} className="flex items-center">
                <span className="border border-primary/30 rounded-lg px-3 py-2 text-xl font-mono font-bold text-primary tabular-nums" style={{ background: '#020617' }}>
                  {unit}
                </span>
                {i < 2 && <span className="text-primary font-bold mx-1">:</span>}
              </span>
            ))}
          </div>

          {/* Verification badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mt-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-white font-medium">✅ CERTIFIÉ IA ANDREA</span>
          </div>

          {/* Subtle loading bar */}
          <div className="mt-8 w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(212,175,55,0.15)' }}>
            <motion.div
              className="h-full bg-gradient-gold rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "85%" }}
              transition={{ duration: 8, ease: "easeOut" }}
            />
          </div>
          <p className="text-xs text-white/60 mt-3">Vérification sécurisée de votre identité...</p>
        </motion.div>
      </div>
    </>
  );
};

export default AuthCallback;
