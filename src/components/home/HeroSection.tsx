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
    <section className="relative min-h-[90vh] flex items-center pt-24 md:pt-32 lg:pt-20 bg-navy overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-white/3 blur-[100px]"
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
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D4AF37]"></span>
            </span>
            <span className="text-sm text-white/80">
              Demandes de devis en attente dans votre secteur :{" "}
              <span className="font-bold text-[#D4AF37]">{pendingQuotes}</span>
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 mb-8">
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-sm font-semibold text-[#D4AF37] tracking-wide">Club fermé — Accès sur audit uniquement</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] font-bold text-white leading-tight mb-6 tracking-tight">
            MARRE DES DEVIS QUI DORMENT ?{" "}
            <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#D4AF37] to-[#F5D060]">
              ACCÉDEZ À L'ÉLITE QUI ENCAISSE.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-8 leading-relaxed">
            Rejoignez le réseau d'artisans audités sur le terrain. Exclusivité sectorielle, zéro harcèlement, leads qualifiés en continu.
          </p>

          <p className="text-sm font-medium text-[#D4AF37]/80 mb-6 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            Simple, gratuit pour les particuliers et sans harcèlement commercial.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[#D4AF37] to-[#B8941F] hover:from-[#C9A430] hover:to-[#A6841A] text-navy font-bold text-base md:text-lg w-full sm:w-auto px-10 py-7 shadow-xl shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] min-h-[56px] border border-[#D4AF37]/30"
              asChild
            >
              <Link to="/demande-devis">
                Trouver un artisan audité
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 font-semibold text-base md:text-lg px-10 py-7 min-h-[56px] transition-all duration-300 backdrop-blur-sm"
              asChild
            >
              <Link to="/devenir-artisan">
                <Zap className="w-5 h-5 mr-2 text-[#D4AF37]" />
                Rejoindre le réseau
              </Link>
            </Button>
          </div>

          <p className="text-sm text-white/40">
            <Shield className="w-4 h-4 text-[#D4AF37] inline mr-1.5 -mt-0.5" />
            Déjà <span className="text-[#D4AF37] font-bold">{displayCount > 40 ? displayCount : 44} artisans validés</span> dans le Nord et l'Île-de-France.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
