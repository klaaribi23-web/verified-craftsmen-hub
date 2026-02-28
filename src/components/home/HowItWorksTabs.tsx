import { useState } from "react";
import { FileText, Search, Phone, CheckCircle2, Target, ClipboardList, Briefcase, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const particulierSteps = [
  { icon: FileText, title: "Décrivez votre projet ou trouvez un artisan", num: "01" },
  { icon: Phone, title: "Échangez en sécurité via notre messagerie", num: "02" },
  { icon: Search, title: "Partagez vos coordonnées quand VOUS êtes prêt", num: "03" },
  { icon: CheckCircle2, title: "Chantier réalisé, avis déposé", num: "04" },
];

const artisanSteps = [
  { icon: Target, title: "Votre secteur exclusif est réservé", num: "01" },
  { icon: ClipboardList, title: "Andrea valide votre dossier", num: "02" },
  { icon: Briefcase, title: "Vous recevez des clients qualifiés", num: "03" },
  { icon: Coins, title: "Zéro commission sur vos chantiers", num: "04" },
];

const HowItWorksTabs = () => {
  const [tab, setTab] = useState<"particulier" | "artisan">("particulier");
  const steps = tab === "particulier" ? particulierSteps : artisanSteps;

  return (
    <section className="py-14 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
            Un parcours simple, transparent et sans surprise.
          </p>

          {/* Tab buttons */}
          <div className="inline-flex rounded-full bg-secondary p-1 gap-1">
            <button
              onClick={() => setTab("particulier")}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                tab === "particulier"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Je suis particulier
            </button>
            <button
              onClick={() => setTab("artisan")}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                tab === "artisan"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Je suis artisan
            </button>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid md:grid-cols-4 gap-6 md:gap-4 relative">
              {/* Connection line — desktop only */}
              <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {steps.map(({ icon: Icon, title, num }, i) => (
                <motion.div
                  key={num + tab}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center relative"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-white/20 bg-white/5 flex items-center justify-center mx-auto mb-4 relative z-10">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-xs font-bold text-white/50 tracking-widest uppercase mb-2 block">
                    Étape {num}
                  </span>
                  <h3 className="text-sm font-bold text-foreground leading-snug">{title}</h3>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
};

export default HowItWorksTabs;
