import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ShieldCheck, Award, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const PowerBlock = () => {
  const [metier, setMetier] = useState("");
  const [ville, setVille] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (metier) params.set("metier", metier);
    if (ville) params.set("ville", ville);
    navigate(`/trouver-artisan?${params.toString()}`);
  };

  return (
    <section className="relative bg-[#0A192F] pt-28 md:pt-36 pb-24 md:pb-[120px] overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/5 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* H1 Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold max-w-5xl mx-auto leading-[1.2] tracking-tight font-sans"
        >
          <span className="block text-white">
            NE CONFIEZ PLUS VOS TRAVAUX AU{' '}
            <span className="relative inline-block">
              <span className="text-white">HASARD</span>
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-primary rounded-full" />
            </span>
            .
          </span>
          <span className="block text-white mt-3">
            ACCÉDEZ À{' '}
          <span className="text-primary font-extrabold">
              L'ÉLITE VÉRIFIÉE
            </span>
            .
          </span>
        </motion.h1>

        {/* Search bar */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          onSubmit={handleSearch}
          className="max-w-3xl mx-auto mb-8"
        >
          <div className="flex flex-col sm:flex-row items-stretch bg-white/[0.06] border border-white/10 rounded-xl sm:rounded-full overflow-hidden backdrop-blur-sm">
            {/* Métier */}
            <div className="flex items-center flex-1 px-5 py-3.5 gap-3 border-b sm:border-b-0 sm:border-r border-white/10">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                placeholder="Quel métier ?"
                value={metier}
                onChange={(e) => setMetier(e.target.value)}
                className="bg-transparent w-full text-white placeholder:text-white/40 text-sm md:text-base outline-none"
              />
            </div>
            {/* Ville */}
            <div className="flex items-center flex-1 px-5 py-3.5 gap-3 border-b sm:border-b-0 sm:border-r border-white/10">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <input
                type="text"
                placeholder="Quelle ville ?"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="bg-transparent w-full text-white placeholder:text-white/40 text-sm md:text-base outline-none"
              />
            </div>
            {/* CTA */}
            <Button
              type="submit"
              className="m-2 sm:m-1.5 px-7 py-3 rounded-lg sm:rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-sm md:text-base whitespace-nowrap shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              TROUVER MON EXPERT
            </Button>
          </div>
        </motion.form>

        {/* Micro-copy */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="max-w-xl mx-auto mb-10 pt-10 pb-5"
        >
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto mb-5" />
          <p className="text-center text-sm md:text-base text-white/90 font-medium tracking-wide">
            Accès direct aux{' '}
            <span className="text-primary font-black text-base md:text-lg drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]">5%</span>
            {' '}d'artisans sélectionnés pour leur fiabilité.
          </p>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent mx-auto mt-5" />
        </motion.div>

        {/* Trust badges — Elite Confidence Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="grid grid-cols-2 md:flex md:items-center md:justify-center gap-2 md:gap-3 mt-6 pt-8 -mb-[50px] relative z-20"
        >
          {[
            { icon: ShieldCheck, label: "Décennale Vérifiée" },
            { icon: Award, label: "Audit Terrain" },
            { icon: Star, label: "Avis Authentiques" },
            { icon: CheckCircle2, label: "Zéro Harcèlement" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="relative flex items-center gap-2 px-3 py-2 rounded-full bg-[#1E293B]/80 border border-primary/20 backdrop-blur-sm overflow-hidden"
            >
              {/* Glossy top highlight */}
              <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.10] to-transparent pointer-events-none rounded-t-full" />
              <div className="relative flex-shrink-0">
                <Icon className="w-5 h-5 text-[#00FF9D] drop-shadow-[0_0_10px_rgba(0,255,157,0.6)]" />
              </div>
              <span className="relative text-white font-semibold text-[10px] md:text-xs tracking-[0.12em] uppercase whitespace-nowrap">
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PowerBlock;
