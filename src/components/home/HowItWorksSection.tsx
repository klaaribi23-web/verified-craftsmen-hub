import { motion } from "framer-motion";
import { FileText, Users, MessageSquare, ThumbsUp } from "lucide-react";

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Décrivez votre projet",
    description: "Remplissez notre formulaire simple en quelques minutes. Décrivez vos travaux, ajoutez des photos et précisez vos attentes.",
  },
  {
    icon: Users,
    step: "02",
    title: "Recevez des devis",
    description: "Notre algorithme sélectionne les artisans les plus adaptés à votre projet. Ils vous contactent avec leur meilleur devis.",
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Échangez et choisissez",
    description: "Comparez les profils, les avis et les tarifs. Échangez directement avec les artisans via notre messagerie sécurisée.",
  },
  {
    icon: ThumbsUp,
    step: "04",
    title: "Travaux réalisés",
    description: "Une fois les travaux terminés, laissez votre avis pour aider la communauté et récompenser le travail bien fait.",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-muted">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            Simple et efficace
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trouvez votre artisan idéal en 4 étapes simples.
            Nous nous occupons de tout le reste.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-border">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold" />
                </div>
              )}

              <div className="bg-white rounded-2xl p-8 shadow-soft border border-border relative h-full">
                {/* Step Number */}
                <div className="absolute -top-4 left-8 px-3 py-1 bg-gradient-gold rounded-full text-navy-dark text-sm font-bold shadow-gold">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center mb-6 mt-2">
                  <step.icon className="w-8 h-8 text-navy" />
                </div>

                <h3 className="text-xl font-semibold text-navy mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
