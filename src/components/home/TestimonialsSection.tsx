import { motion } from "framer-motion";
import { Star, Quote, CheckCircle2, ShieldCheck } from "lucide-react";

const testimonials = [{
  name: "Sophie M.",
  role: "Particulière à Lille",
  subRole: "Rénovation salle de bain — 2024",
  rating: 5,
  text: "J'avais demandé des devis sur un site connu. Dans l'heure qui a suivi j'ai reçu 11 appels. 11. Des artisans que je ne connaissais pas, qui me pressaient de décider, certains agressifs quand je disais que je réfléchissais. J'ai raccroché et j'ai laissé tomber le projet pendant 6 mois.\n\nUne amie m'a parlé d'Artisans Validés. J'ai déposé mon projet. Personne ne m'a appelée sans mon accord. J'ai échangé tranquillement via la messagerie, j'ai choisi quand j'étais prête. L'artisan est venu, le travail était exactement ce qui avait été convenu.\n\nJe ne savais pas qu'on pouvait faire des travaux sans stress.",
  verified: true,
  verifiedLabel: "Identité vérifiée ✓",
  type: "Particulier",
  sealLabel: "Certifié"
}, {
  name: "Anthony B.",
  role: "Panneaux solaires & Batteries",
  subRole: "Saint-Venant (62) — Membre depuis 2024",
  rating: 5,
  text: "Pendant longtemps je ne savais pas comment trouver mes clients. Je payais des leads qui ne répondaient pas, je courais après des projets fantômes.\n\nArtisans Validés m'a pris en main différemment. D'abord de la sous-traitance pour me lancer, puis des clients particuliers en direct. Et ce qui m'a vraiment surpris — l'accès aux fournisseurs négociés. J'achète mes panneaux mieux qu'avant, je marge mieux sur chaque chantier.\n\nAujourd'hui je tourne principalement au bouche à oreille. C'est ça la vraie différence.",
  verified: true,
  verifiedLabel: "Membre vérifié ✓",
  type: "Artisan",
  sealLabel: "Certifié"
}, {
  name: "L'équipe Artisans Validés",
  role: "Notre engagement qualité",
  subRole: "",
  rating: 5,
  text: "Vos coordonnées ne sont jamais partagées sans votre accord. Vous échangez d'abord via notre messagerie sécurisée. Vous décidez ensuite. C'est notre engagement envers chaque particulier.",
  verified: true,
  verifiedLabel: "Engagement vérifié ✓",
  type: "Notre promesse",
  sealLabel: "Garantie"
}];

const AnimatedStar = ({
  index,
  filled
}: {
  index: number;
  filled: boolean;
}) => <motion.div initial={{
  opacity: 0,
  scale: 0,
  rotate: -180
}} whileInView={{
  opacity: 1,
  scale: 1,
  rotate: 0
}} viewport={{
  once: true
}} transition={{
  delay: index * 0.1,
  type: "spring",
  stiffness: 260,
  damping: 20
}}>
    <motion.div animate={{
    scale: [1, 1.2, 1]
  }} transition={{
    duration: 2,
    repeat: Infinity,
    delay: index * 0.2,
    repeatDelay: 3
  }}>
      <Star className={`w-5 h-5 ${filled ? "fill-gold text-gold" : "text-muted-foreground"}`} />
    </motion.div>
  </motion.div>;

const TestimonialsSection = () => {
  return <section className="py-20 lg:py-32 bg-white relative overflow-hidden border-y-2 border-navy/20">
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <motion.span initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            <Star className="w-4 h-4 fill-gold" />
            L'humain au centre
          </motion.span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
            Le Livre d'Or de l'Alliance
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Particuliers et artisans témoignent de leur expérience avec Artisans Validés.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => <motion.article key={testimonial.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15, duration: 0.5 }} whileHover={{ y: -4, transition: { duration: 0.3 } }} className="relative group">
              <div className="bg-background rounded-2xl overflow-hidden h-full border border-gold/20 hover:border-gold/50 hover:shadow-xl transition-all duration-300">
                <div className="p-8">
                  {/* Badge Sceau AV */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center shadow-lg border-2 border-gold/30">
                      <div className="text-center">
                        <span className="block text-navy-dark font-black text-sm leading-none">AV</span>
                        <span className="block text-navy-dark/70 text-[7px] font-semibold tracking-wider uppercase leading-tight mt-0.5">{testimonial.sealLabel}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      {testimonial.type}
                    </span>
                  </div>

                  <Quote className="w-7 h-7 text-gold/25 mb-4" />

                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <AnimatedStar key={i} index={i + index * 5} filled={i < testimonial.rating} />)}
                  </div>

                  <p className="text-foreground mb-6 leading-relaxed text-lg font-medium whitespace-pre-line">
                    "{testimonial.text}"
                  </p>

                  <div className="pt-5 border-t border-border/50 space-y-3">
                    <div>
                      <h3 className="font-bold text-foreground text-base">
                        {testimonial.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                      {testimonial.subRole && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {testimonial.subRole}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-semibold">{testimonial.verifiedLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-gold/15 to-primary/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" aria-hidden="true" />
            </motion.article>)}
        </div>

        {/* Mention légale */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Témoignages inspirés d'expériences réelles de nos utilisateurs.
        </p>

        {/* Stats — fond sombre institutionnel */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 bg-navy rounded-2xl p-8 lg:p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => <motion.div key={i} className="absolute w-24 h-24 border border-gold/30 rounded-full" style={{
            left: `${i % 3 * 40}%`,
            top: `${Math.floor(i / 3) * 60}%`
          }} animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }} transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5
          }} />)}
          </div>
          
          {[{
          value: "4.9/5",
          label: "Note moyenne",
          icon: Star
        }, {
          value: "1 200+",
          label: "Chantiers accompagnés",
          icon: CheckCircle2
        }, {
          value: "4.9/5",
          label: "Sur 847 avis vérifiés",
          icon: Star
        }, {
          value: "24h",
          label: "Temps de réponse",
          icon: CheckCircle2
        }].map((stat, index) => <motion.div key={stat.label} initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: 0.4 + index * 0.1
        }} className="text-center relative z-10">
              <motion.div className="text-3xl md:text-4xl font-bold text-gold mb-1" animate={{
            scale: [1, 1.05, 1]
          }} transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.3
          }}>
                {stat.value}
              </motion.div>
              <div className="text-white/70 text-sm font-medium">
                {stat.label}
              </div>
            </motion.div>)}
        </motion.div>
      </div>
    </section>;
};
export default TestimonialsSection;
