import { motion } from "framer-motion";
import { ShieldCheck, FileCheck, Zap, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: ShieldCheck,
    step: "01",
    title: "Audit Express",
    description: "Notre équipe vérifie votre entreprise en 24h : SIRET, historique, réputation terrain. Pas de place au hasard.",
    glow: "from-[#D4AF37]/20 to-transparent",
  },
  {
    icon: FileCheck,
    step: "02",
    title: "Validation des Assurances",
    description: "RC Pro, Décennale, Kbis — chaque document est contrôlé manuellement par Jane avant toute activation.",
    glow: "from-[#D4AF37]/15 to-transparent",
  },
  {
    icon: Zap,
    step: "03",
    title: "Activation de l'Exclusivité Secteur",
    description: "Votre zone est verrouillée : maximum 2 artisans par ville et par métier. Vos concurrents sont bloqués.",
    glow: "from-[#D4AF37]/20 to-transparent",
  },
];

const EliteSelectionProcess = () => {
  return (
    <section className="py-20 lg:py-28 bg-[#060C18] relative overflow-hidden">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-[#D4AF37]/5 blur-[100px]"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-extrabold mb-4 border border-[#D4AF37]/20 tracking-wider uppercase">
            Processus de sélection
          </span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Seuls les meilleurs <span className="text-[#D4AF37] font-extrabold">passent l'audit</span>
          </h2>
          <p className="text-base md:text-lg text-white/50 max-w-2xl mx-auto">
            Un processus en 3 étapes pour garantir l'excellence. 87% des artisans sont refusés.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative group"
            >
              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-12 left-[70%] w-full items-center z-10">
                  <div className="flex-1 h-px bg-gradient-to-r from-[#D4AF37]/30 to-transparent" />
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-4 h-4 text-[#D4AF37]/50" />
                  </motion.div>
                </div>
              )}

              {/* Step badge */}
              <motion.div
                className="absolute -top-3 left-6 z-20 w-8 h-8 rounded-full border border-[#D4AF37]/40 bg-navy-dark flex items-center justify-center text-[#D4AF37] text-xs font-bold"
                whileHover={{ scale: 1.1 }}
              >
                {step.step}
              </motion.div>

              {/* Card with glassmorphism */}
              <motion.div
                className="bg-white/[0.04] backdrop-blur-md rounded-2xl p-7 pt-10 border border-white/[0.08] relative h-full transition-all duration-500 group-hover:border-[#D4AF37]/20 group-hover:bg-white/[0.06]"
                whileHover={{
                  y: -6,
                  boxShadow: "0 0 40px -10px rgba(212, 175, 55, 0.15)",
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Subtle glow on hover */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${step.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="mb-5 relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/15 flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-[#D4AF37]" strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="text-lg font-extrabold uppercase text-white mb-3 relative z-10" style={{ letterSpacing: '-0.01em', lineHeight: '1.2' }}>
                  {step.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed relative z-10">
                  {step.description}
                </p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EliteSelectionProcess;
