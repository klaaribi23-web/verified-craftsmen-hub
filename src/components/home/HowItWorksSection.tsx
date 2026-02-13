import { motion } from "framer-motion";
import { FileText, MessageSquare, ThumbsUp, ArrowRight } from "lucide-react";

const steps = [{
  icon: FileText,
  step: "01",
  title: "Décrivez votre besoin avec des photos",
  description: "Remplissez notre formulaire en quelques minutes et ajoutez des photos de votre chantier pour que les artisans comprennent votre projet.",
}, {
  icon: MessageSquare,
  step: "02",
  title: "Discutez anonymement avec les artisans",
  description: "Échangez en toute confidentialité. Vos coordonnées restent masquées tant que vous ne décidez pas de les partager.",
}, {
  icon: ThumbsUp,
  step: "03",
  title: "Choisissez votre pro et lancez les travaux",
  description: "Comparez les devis, sélectionnez l'artisan qui vous convient et démarrez vos travaux en toute sérénité.",
}];

const HowItWorksSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-navy relative overflow-hidden">
      {/* Subtle glow effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gold/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/5 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full bg-gold/15 text-gold text-sm font-medium mb-4 border border-gold/20"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Un service de conciergerie
          </motion.span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-base md:text-lg text-white/60 max-w-2xl mx-auto text-center">
            Nous faisons le travail de sélection pour vous.
            Chaque artisan est vérifié et validé par notre équipe.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
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
                <div className="hidden lg:flex absolute top-10 left-[65%] w-full items-center">
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-white/20 to-white/10" />
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5 text-gold" />
                  </motion.div>
                </div>
              )}

              {/* Step number badge — Gold */}
              <motion.div
                className="absolute -top-3 left-8 z-20 w-10 h-10 rounded-full border-2 border-gold bg-navy flex items-center justify-center text-white text-sm font-bold shadow-lg"
                whileHover={{ scale: 1.1 }}
              >
                {step.step}
              </motion.div>

              {/* Card */}
              <motion.div
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 pt-10 border border-white/10 relative h-full hover:bg-white/15 transition-colors duration-300"
                whileHover={{
                  y: -8,
                  boxShadow: "0 20px 40px -15px rgba(0,0,0,0.3)"
                }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gold/15 border border-gold/20 flex items-center justify-center">
                    <step.icon className="w-8 h-8 text-gold" strokeWidth={1.5} />
                  </div>
                </div>

                <h3 className="text-xl font-semibold text-white mb-3 relative z-10">
                  {step.title}
                </h3>
                <p className="text-white/60 leading-relaxed relative z-10">
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

export default HowItWorksSection;
