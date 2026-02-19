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
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-[#D4AF37]/5 blur-[140px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* H1 Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-black max-w-5xl mx-auto"
          style={{ lineHeight: '1.15', letterSpacing: '-0.02em' }}
        >
          <span className="block text-white">
            NE CONFIEZ PLUS VOS TRAVAUX AU{' '}
            <span className="relative inline-block">
              <span className="text-white">HASARD</span>
              <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#D4AF37] rounded-full" />
            </span>
            .
          </span>
          <span className="block text-white" style={{ marginTop: '15px' }}>
            ACCÉDEZ À{' '}
          <span className="text-[#D4AF37] font-extrabold">
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
          className="max-w-3xl mx-auto mb-5"
        >
          <div className="flex flex-col sm:flex-row items-stretch bg-white/[0.06] border border-white/10 rounded-xl sm:rounded-full overflow-hidden backdrop-blur-sm">
            {/* Métier */}
            <div className="flex items-center flex-1 px-5 py-3.5 gap-3 border-b sm:border-b-0 sm:border-r border-white/10">
              <Search className="w-5 h-5 text-[#D4AF37] shrink-0" />
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
              <MapPin className="w-5 h-5 text-[#D4AF37] shrink-0" />
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
              className="m-2 sm:m-1.5 px-7 py-3 rounded-lg sm:rounded-full bg-[#D4AF37] hover:bg-[#C9A430] text-[#0A192F] font-extrabold text-sm md:text-base whitespace-nowrap shadow-lg shadow-[#D4AF37]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              TROUVER MON EXPERT
            </Button>
          </div>
        </motion.form>

        {/* Micro-copy */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="text-center text-sm text-[#E2E8F0]/60 mb-10 max-w-lg mx-auto"
        >
          Accès direct aux 5% d'artisans sélectionnés pour leur fiabilité.
        </motion.p>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex items-center justify-center gap-6 md:gap-10 flex-wrap mt-6 pt-8 -mb-[50px] relative z-20"
        >
          {[
            { icon: ShieldCheck, label: "Assurance Décennale Vérifiée" },
            { icon: Award, label: "Audit Terrain Systématique" },
            { icon: Star, label: "Avis Clients Authentiques" },
            { icon: CheckCircle2, label: "Zéro Harcèlement Commercial" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-[#E2E8F0]/50 text-xs md:text-sm">
              <Icon className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default PowerBlock;
