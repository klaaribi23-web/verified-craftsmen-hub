import { motion } from "framer-motion";
import { ShieldCheck, Cpu, Banknote, ArrowUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const pillars = [
  {
    icon: ShieldCheck,
    title: "SÉLECTION DRACONIENNE",
    desc: "Chaque artisan est audité sur le terrain par nos experts métier. Assurances, références, qualité de finition — rien n'est laissé au hasard.",
  },
  {
    icon: Cpu,
    title: "CONTRÔLE IA",
    desc: "Notre algorithme de confiance analyse en continu la fiabilité, les avis et la réactivité de chaque professionnel du réseau.",
  },
  {
    icon: Banknote,
    title: "ZÉRO AVANCE",
    desc: "Aucun paiement avant intervention. Vous ne payez que le travail réalisé, directement à l'artisan. Transparence totale.",
  },
];

const TrustPillars = () => {
  const scrollToSearch = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="relative bg-[#0A192F]">
      {/* Gold separator line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

      <div className="container mx-auto px-4 pt-20 pb-16 md:pt-24 md:pb-20">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-black text-white max-w-3xl mx-auto"
            style={{ lineHeight: '1.3', letterSpacing: '-0.02em' }}
          >
            POURQUOI LES MEILLEURS CLIENTS{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FFB800] to-[#D4AF37]">
              NOUS FONT CONFIANCE
            </span>
          </h2>
        </motion.div>

        {/* 3 Pillars — uniform height */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10 max-w-5xl mx-auto mb-10">
          {pillars.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group relative bg-[#112240] rounded-2xl p-7 md:p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-12px_rgba(212,175,55,0.15)] min-h-[260px] flex flex-col items-center"
              style={{ border: '0.5px solid rgba(212,175,55,0.15)', }}
            >
              {/* Left gold accent bar */}
              <div className="absolute left-0 top-6 bottom-6 w-[2px] rounded-full bg-gradient-to-b from-[#D4AF37]/40 via-[#D4AF37]/20 to-transparent transition-all duration-300 group-hover:from-[#D4AF37]/60 group-hover:via-[#D4AF37]/30" />

              {/* Icon seal */}
              <div className="w-12 h-12 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/5 flex items-center justify-center mb-5 transition-all duration-300 group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/10">
                <Icon className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
              </div>

              {/* Title */}
              <h3
                className="text-sm md:text-base font-black uppercase mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#FFB800] to-[#D4AF37]"
                style={{ letterSpacing: '0.1em', lineHeight: '1.2' }}
              >
                {title}
              </h3>

              {/* Description */}
              <p
                className="text-sm text-[#E2E8F0]/70 max-w-xs"
                style={{ lineHeight: '1.6' }}
              >
                {desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Engagement phrase + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-center space-y-5"
        >
          <p className="text-[#E2E8F0]/60 text-sm italic">
            Convaincu ? Rejoignez ceux qui ne laissent rien au hasard.
          </p>

          <Button
            onClick={scrollToSearch}
            variant="outline"
            className="border-[#D4AF37]/30 text-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/50 font-bold text-xs tracking-widest uppercase px-6 py-2.5 rounded-full transition-all duration-300"
          >
            <ArrowUp className="w-3.5 h-3.5 mr-2" />
            LANCER MA RECHERCHE
          </Button>

          {/* Proof badge */}
          <div className="pt-2">
            <Badge className="bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/15 px-4 py-1.5 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
              Filtrage IA & Audit Terrain — Certification Artisans Validés
            </Badge>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustPillars;
