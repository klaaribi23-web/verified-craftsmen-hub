import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Zap, Users, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";

const FAKE_PROJECTS = [
  { title: "Rénovation Villa Premium", city: "Lyon 6ème", budget: "45 000 €" },
  { title: "Extension Maison Architecte", city: "Bordeaux", budget: "62 000 €" },
  { title: "Équipement Cuisine Haut de Gamme", city: "Paris 16ème", budget: "28 000 €" },
];

const ActivationElite = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";
  const sector = searchParams.get("sector") || searchParams.get("city") || "VOTRE ZONE";

  const [phase, setPhase] = useState<"scanning" | "reveal">("scanning");
  const [timeLeft, setTimeLeft] = useState({ h: 23, m: 59, s: 59 });

  useEffect(() => {
    const timer = setTimeout(() => setPhase("reveal"), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const handleActivate = () => {
    navigate("/artisan/dashboard");
  };

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100vh", zIndex: 9999, backgroundColor: "hsl(215,62%,6%)", overflow: "auto" }} className="text-white">
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
              className="text-xl md:text-2xl font-bold text-primary text-center tracking-wide"
            >
              VÉRIFICATION DE VOTRE SECTEUR EN COURS…
            </motion.p>
            <p className="text-muted-foreground text-sm">Analyse IA Andrea • Audit sectoriel</p>
          </motion.div>
        ) : (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-12"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary font-semibold mb-4">
                <Shield className="w-4 h-4" /> CERTIFIÉ IA ANDREA
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold">
                <span className="text-primary">VOTRE SECTEUR EST RÉSERVÉ :</span>
                <br />
                <span className="text-white uppercase">{sector}</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
                2 places disponibles par secteur.{" "}
                <span className="text-primary font-bold">Ne laissez pas votre concurrent prendre la dernière.</span>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-xl font-bold text-white mb-4 text-center">
                🔒 Chantiers en attente dans votre zone
              </h2>
              <div className="grid md:grid-cols-3 gap-4">
                {FAKE_PROJECTS.map((p, i) => (
                  <div
                    key={i}
                    className="relative rounded-xl border border-primary/20 bg-[hsl(215,55%,10%)] p-6 overflow-hidden"
                  >
                    <div className="absolute inset-0 backdrop-blur-md bg-[hsl(215,62%,6%)]/60 z-10 flex flex-col items-center justify-center gap-2">
                      <Lock className="w-8 h-8 text-primary" />
                      <span className="text-xs text-primary font-bold tracking-wider">
                        DÉVERROUILLABLE APRÈS ACTIVATION
                      </span>
                    </div>
                    <p className="font-bold text-white text-lg">{p.title}</p>
                    <p className="text-white/60 text-sm mt-1">{p.city}</p>
                    <p className="text-primary font-bold mt-3">{p.budget}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-4"
            >
              {[
                { icon: Zap, text: "Filtrage IA Andrea : 0 curieux, 100% de rendez-vous qualifiés." },
                { icon: Users, text: "Exclusivité Partagée : Seulement 2 professionnels par métier." },
                { icon: TrendingUp, text: "Zéro Commission : Votre chiffre d'affaires vous appartient à 100%." },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-4 bg-[hsl(215,55%,10%)] border border-primary/15 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-white/90 text-base md:text-lg">{text}</p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center space-y-4"
            >
              <Button
                onClick={handleActivate}
                className="btn-shine bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-lg md:text-xl px-10 py-7 rounded-xl shadow-gold w-full md:w-auto"
              >
                DÉVERROUILLER MON SECTEUR ET ENCAISSER
              </Button>

              <div className="flex items-center justify-center gap-2 text-primary/80 text-sm font-semibold">
                <span>Votre priorité expire dans :</span>
                <span className="font-mono bg-primary/10 px-2 py-1 rounded text-primary">
                  {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ActivationElite;
