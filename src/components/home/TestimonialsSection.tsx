import { motion } from "framer-motion";
import { Star, Quote, CheckCircle2, ShieldCheck } from "lucide-react";

const testimonials = [{
  name: "Stéphanie L.",
  location: "Lille",
  rating: 5,
  text: "Honnêtement, j'appréhendais de faire appel à un électricien après ma dernière mauvaise expérience. Passer par Artisans Validés a tout changé : on sent que le pro n'est pas là pour gonfler la facture mais parce qu'il a été audité. Travail propre, carré, et surtout : sans mauvaise surprise au moment de payer.",
  artisan: "Particulier",
  verified: true,
  type: "Particulier"
}, {
  name: "Marc D.",
  location: "Lille",
  rating: 5,
  text: "J'ai arrêté de jeter mon argent dans les plateformes de leads qui vous vendent des numéros de téléphone qui ne répondent jamais. Ici, je ne traite qu'avec des clients qui ont déjà validé leur projet avec Andrea. C'est un gain de temps énorme, je me concentre enfin sur mon vrai métier : le chantier.",
  artisan: "Électricien",
  verified: true,
  type: "Artisan"
}, {
  name: "Jean-Marc T.",
  location: "Bordeaux",
  rating: 5,
  text: "Le système de diagnostic avec Andrea est bluffant. On décrit son projet en 2 minutes et on reçoit une proposition d'un pro réellement expert dans le domaine (panneaux solaires pour moi). On ne perd plus son temps à chercher, on valide juste l'excellence.",
  artisan: "Particulier",
  verified: true,
  type: "Particulier"
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
  return <section className="py-20 lg:py-32 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <motion.span initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            <Star className="w-4 h-4 fill-gold" />
            L'humain au centre
          </motion.span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
            Ils nous font confiance
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
                        <span className="block text-navy-dark/70 text-[7px] font-semibold tracking-wider uppercase leading-tight mt-0.5">Certifié</span>
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

                  <p className="text-foreground mb-6 leading-relaxed text-lg font-medium">
                    "{testimonial.text}"
                  </p>

                  <div className="pt-5 border-t border-border/50 space-y-3">
                    <div>
                      <h3 className="font-bold text-foreground text-base">
                        {testimonial.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.artisan} à {testimonial.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                      <span className="text-xs font-semibold">Identité et chantier vérifiés</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-gold/15 to-primary/10 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" aria-hidden="true" />
            </motion.article>)}
        </div>

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
          value: "100K+",
          label: "Travaux réalisés",
          icon: CheckCircle2
        }, {
          value: "98%",
          label: "Clients satisfaits",
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
