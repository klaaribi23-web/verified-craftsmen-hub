import { motion } from "framer-motion";
import { ShieldCheck, Cpu, Banknote } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

        {/* 3 Pillars */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto mb-12">
          {pillars.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="text-center"
            >
              <div className="w-14 h-14 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 flex items-center justify-center mx-auto mb-5">
                <Icon className="w-6 h-6 text-[#D4AF37]" strokeWidth={1.5} />
              </div>
              <h3
                className="text-base md:text-lg font-black text-white tracking-wide mb-3"
                style={{ letterSpacing: '0.04em' }}
              >
                {title}
              </h3>
              <p className="text-sm text-[#E2E8F0]/70 leading-relaxed max-w-xs mx-auto">
                {desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Proof badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex justify-center"
        >
          <Badge className="bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/15 px-4 py-1.5 text-xs font-semibold tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
            Filtrage IA & Audit Terrain — Certification Artisans Validés
          </Badge>
        </motion.div>
      </div>
    </section>
  );
};

export default TrustPillars;
