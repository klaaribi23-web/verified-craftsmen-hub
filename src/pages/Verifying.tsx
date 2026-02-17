import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { motion } from "framer-motion";
import { Scan, Shield, Lock } from "lucide-react";

const Verifying = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const target = searchParams.get("target") || "/";
  const sector = searchParams.get("sector") || "NORD";

  const [countdown, setCountdown] = useState({ h: 23, m: 59, s: 59 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
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

  // Redirect after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      // Navigate to target with view=owner
      const separator = target.includes("?") ? "&" : "?";
      navigate(`${target}${separator}view=owner`, { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  }, [target, navigate]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <>
      <SEOHead
        title="Vérification de votre accès"
        description="Accès sécurisé à votre espace exclusif"
        noIndex={true}
      />
      <div
        className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
        style={{ background: "#0A192F" }}
      >
        {/* Scanner sweep */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(212,175,55,0.08) 50%, transparent 100%)",
          }}
          animate={{ y: ["-100%", "100%"] }}
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
            animate={{
              borderColor: [
                "rgba(212,175,55,0.4)",
                "rgba(212,175,55,0.8)",
                "rgba(212,175,55,0.4)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Scan className="w-10 h-10 text-primary" />
          </motion.div>

          {/* Pulse text */}
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
            Secteur{" "}
            <span className="text-primary font-bold">
              {sector.toUpperCase()}
            </span>{" "}
            réservé
          </p>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-1 my-6">
            <Lock className="w-4 h-4 text-primary mr-2" />
            <span className="text-xs text-white uppercase tracking-wider mr-3">
              Priorité expire dans
            </span>
            {[pad(countdown.h), pad(countdown.m), pad(countdown.s)].map(
              (unit, i) => (
                <span key={i} className="flex items-center">
                  <span
                    className="border border-primary/30 rounded-lg px-3 py-2 text-xl font-mono font-bold text-primary tabular-nums"
                    style={{ background: "#020617" }}
                  >
                    {unit}
                  </span>
                  {i < 2 && (
                    <span className="text-primary font-bold mx-1">:</span>
                  )}
                </span>
              )
            )}
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mt-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-white font-medium">
              ✅ CERTIFIÉ IA ANDREA
            </span>
          </div>

          {/* Progress bar */}
          <div
            className="mt-8 w-full h-1 rounded-full overflow-hidden"
            style={{ background: "rgba(212,175,55,0.15)" }}
          >
            <motion.div
              className="h-full bg-gradient-gold rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3.5, ease: "easeInOut" }}
            />
          </div>
          <p className="text-xs text-white/60 mt-3">
            Chargement de votre vitrine professionnelle...
          </p>
        </motion.div>
      </div>
    </>
  );
};

export default Verifying;
