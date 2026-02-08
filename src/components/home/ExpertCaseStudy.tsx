import { motion } from "framer-motion";
import { Shield, CheckCircle2, Eye, Wrench, FileCheck } from "lucide-react";

const steps = [
  {
    icon: FileCheck,
    title: "Vérification décennale",
    desc: "Contrôle de l'assurance responsabilité civile et décennale auprès de l'assureur.",
  },
  {
    icon: Eye,
    title: "Visite chantier",
    desc: "Inspection sur site d'un chantier en cours : propreté, sécurité, qualité des finitions.",
  },
  {
    icon: Wrench,
    title: "Validation outillage",
    desc: "Vérification de l'équipement professionnel et des certifications techniques.",
  },
  {
    icon: Shield,
    title: "Certification Validé",
    desc: "Attribution du badge « Artisan Validé » après validation complète par Andrea.",
  },
];

const ExpertCaseStudy = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full mb-4">
            <Eye className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium text-gold">Transparence totale</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            L'œil de l'expert en action
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Voici comment Andrea audite chaque artisan avant de lui attribuer le badge « Validé ».
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical line connector */}
            <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold via-gold/50 to-transparent hidden md:block" />

            <div className="space-y-6">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.4 }}
                  className="flex gap-4 md:gap-6 items-start"
                >
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-xl bg-navy flex items-center justify-center shadow-lg">
                    <step.icon className="w-6 h-6 md:w-7 md:h-7 text-gold" />
                  </div>
                  <div className="bg-background rounded-xl border border-border p-5 md:p-6 flex-1 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-gold uppercase tracking-wider">
                        Étape {i + 1}
                      </span>
                      {i === steps.length - 1 && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-1">{step.title}</h3>
                    <p className="text-muted-foreground text-sm">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-8 bg-navy rounded-xl p-5 md:p-6 text-center"
          >
            <p className="text-white/80 italic text-sm md:text-base">
              « Je ne certifie que les artisans chez qui j'enverrais ma propre famille. C'est mon seul critère. »
            </p>
            <p className="text-gold font-semibold text-sm mt-2">— Andrea, Fondateur & Expert Terrain</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ExpertCaseStudy;
