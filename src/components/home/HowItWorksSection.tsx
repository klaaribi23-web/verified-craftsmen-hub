import { motion } from "framer-motion";
import { FileText, UserCheck, MessageSquare, ThumbsUp, ArrowRight } from "lucide-react";

const steps = [{
  icon: FileText,
  step: "01",
  title: "Décrivez votre besoin avec des photos",
  description: "Remplissez notre formulaire en quelques minutes et ajoutez des photos de votre chantier pour que les artisans comprennent votre projet.",
  color: "from-blue-500 to-blue-600",
  bgColor: "bg-blue-500/10"
}, {
  icon: MessageSquare,
  step: "02",
  title: "Discutez anonymement avec les artisans",
  description: "Échangez en toute confidentialité. Vos coordonnées restent masquées tant que vous ne décidez pas de les partager.",
  color: "from-emerald-500 to-emerald-600",
  bgColor: "bg-emerald-500/10"
}, {
  icon: ThumbsUp,
  step: "03",
  title: "Choisissez votre pro et lancez les travaux",
  description: "Comparez les devis, sélectionnez l'artisan qui vous convient et démarrez vos travaux en toute sérénité.",
  color: "from-amber-500 to-amber-600",
  bgColor: "bg-amber-500/10"
}];

const AnimatedIcon = ({
  icon: Icon,
  color,
  index
}: {
  icon: any;
  color: string;
  index: number;
}) => {
  return <motion.div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`} initial={{
    scale: 0,
    rotate: -180
  }} whileInView={{
    scale: 1,
    rotate: 0
  }} viewport={{
    once: true
  }} transition={{
    type: "spring",
    stiffness: 200,
    damping: 15,
    delay: index * 0.15
  }} whileHover={{
    scale: 1.1,
    rotate: 5,
    transition: {
      duration: 0.2
    }
  }}>
      <motion.div className="absolute inset-0 rounded-2xl border-2 border-white/30" animate={{
      scale: [1, 1.2, 1],
      opacity: [0.5, 0, 0.5]
    }} transition={{
      duration: 2,
      repeat: Infinity,
      delay: index * 0.3
    }} />
      
      {[...Array(3)].map((_, i) => <motion.div key={i} className="absolute w-2 h-2 rounded-full bg-white/40" style={{
      top: `${20 + i * 25}%`,
      left: `${10 + i * 30}%`
    }} animate={{
      y: [-5, 5, -5],
      opacity: [0.3, 0.7, 0.3]
    }} transition={{
      duration: 2 + i * 0.5,
      repeat: Infinity,
      delay: i * 0.3
    }} />)}
      
      <Icon className="w-10 h-10 text-white relative z-10" strokeWidth={1.5} />
    </motion.div>;
};

const HowItWorksSection = () => {
  return <section className="py-20 lg:py-32 bg-muted relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gold/5 blur-3xl" animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3]
      }} transition={{
        duration: 8,
        repeat: Infinity
      }} />
        <motion.div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-navy/5 blur-3xl" animate={{
        scale: [1.2, 1, 1.2],
        opacity: [0.3, 0.5, 0.3]
      }} transition={{
        duration: 8,
        repeat: Infinity,
        delay: 2
      }} />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <motion.span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4" initial={{
          scale: 0.8,
          opacity: 0
        }} whileInView={{
          scale: 1,
          opacity: 1
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.2
        }}>
            Un service de conciergerie
          </motion.span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            Nous faisons le travail de sélection pour vous.
            Chaque artisan est vérifié et validé par notre équipe.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => <motion.div key={step.step} initial={{
          opacity: 0,
          y: 30
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: index * 0.15
        }} className="relative group">
              {index < steps.length - 1 && <div className="hidden lg:flex absolute top-10 left-[65%] w-full items-center">
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-border to-border/50" />
                  <motion.div animate={{
              x: [0, 5, 0]
            }} transition={{
              duration: 1.5,
              repeat: Infinity
            }}>
                    <ArrowRight className="w-5 h-5 text-gold" />
                  </motion.div>
                </div>}

              <motion.div className="absolute -top-3 left-8 z-20 px-4 py-1.5 bg-gradient-gold rounded-full text-navy-dark text-sm font-bold shadow-gold" whileHover={{
            scale: 1.1
          }}>
                {step.step}
              </motion.div>

              <motion.div className="bg-white rounded-2xl p-8 pt-10 shadow-soft border border-border relative h-full" whileHover={{
            y: -8,
            boxShadow: "0 20px 40px -15px rgba(0,0,0,0.1)"
          }} transition={{
            duration: 0.3
          }}>
                <div className={`absolute inset-0 rounded-2xl ${step.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                <div className="mb-6 relative z-10">
                  <AnimatedIcon icon={step.icon} color={step.color} index={index} />
                </div>

                <h3 className="text-xl font-semibold text-navy mb-3 relative z-10">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed relative z-10">
                  {step.description}
                </p>
              </motion.div>
            </motion.div>)}
        </div>
      </div>
    </section>;
};

export default HowItWorksSection;
