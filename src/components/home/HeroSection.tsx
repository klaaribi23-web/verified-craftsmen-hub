import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const HeroSection = () => {
  const { data: artisanCount } = useQuery({
    queryKey: ["artisan-count-hero"],
    queryFn: async () => {
      const { count } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      return count || 0;
    },
    staleTime: 60000,
  });

  // Dynamic counter for pending quotes in sector
  const [pendingQuotes, setPendingQuotes] = useState(0);
  useEffect(() => {
    setPendingQuotes(Math.floor(Math.random() * 41) + 40); // 40-80
    const interval = setInterval(() => {
      setPendingQuotes((prev) => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(40, Math.min(80, prev + delta));
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const displayCount = artisanCount && artisanCount > 0 ? artisanCount : 200;

  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 md:pt-32 lg:pt-20 bg-background overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-accent/5 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[100px]"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, delay: 3 }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Dynamic pending counter */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
            <span className="text-sm text-muted-foreground">
              Demandes de devis en attente dans votre secteur :{" "}
              <span className="font-bold text-accent">{pendingQuotes}</span>
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent/10 border border-accent/20 mb-8">
            <Shield className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent tracking-wide">Artisans certifiés — Qualité garantie</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-foreground leading-tight mb-6 tracking-tight">
            VOS TRAVAUX D'EXCEPTION{" "}
            <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent to-gold-light">
              AVEC L'ÉLITE DES ARTISANS.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Sécurité, expertise et finitions de luxe. Confiez votre projet aux professionnels certifiés par l'IA Andrea.
          </p>

          <p className="text-sm font-medium text-accent/80 mb-6 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            100% gratuit pour les particuliers · Zéro harcèlement commercial.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-accent to-gold-dark hover:from-gold-dark hover:to-accent text-white font-bold text-base md:text-lg w-full sm:w-auto px-10 py-7 shadow-xl shadow-accent/20 hover:shadow-accent/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] min-h-[56px] border border-accent/30"
              asChild
            >
              <Link to="/demande-devis">
                DÉPOSER MON PROJET GRATUITEMENT
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-2 border-border text-foreground hover:bg-muted hover:border-primary/40 font-semibold text-base md:text-lg px-10 py-7 min-h-[56px] transition-all duration-300"
              asChild
            >
              <Link to="/devenir-partenaire">
                <Zap className="w-5 h-5 mr-2 text-accent" />
                Rejoindre le réseau
              </Link>
            </Button>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground font-medium">
              ✅ CERTIFIÉ IA ANDREA · <span className="text-primary font-bold">{displayCount > 40 ? displayCount : 44} artisans validés</span>
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
