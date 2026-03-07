import { motion } from "framer-motion";
import { Star, Quote, CheckCircle2, ShieldCheck } from "lucide-react";

const testimonials = [{
  name: "Sophie M.",
  role: "Particulière à Lille",
  subRole: "Rénovation salle de bain — 2024",
  rating: 5,
  text: "J'ai reçu 11 appels dans l'heure après avoir demandé des devis ailleurs. Avec Artisans Validés, personne ne m'a contactée sans mon accord. Je ne savais pas qu'on pouvait faire des travaux sans stress.",
  verified: true,
  verifiedLabel: "Identité vérifiée ✓",
  type: "Particulier",
  sealLabel: "Certifié"
}, {
  name: "Anthony B.",
  role: "Panneaux solaires & Batteries",
  subRole: "Saint-Venant (62) — Membre depuis 2024",
  rating: 5,
  text: "Je courais après des prospects qui ne répondaient pas. Artisans Validés m'a mis en contact avec de vrais clients. Aujourd'hui je tourne au bouche à oreille.",
  verified: true,
  verifiedLabel: "Membre vérifié ✓",
  type: "Artisan",
  sealLabel: "Certifié"
}, {
  name: "Stéphane D.",
  role: "Rénovation d'ampleur — Armentières (59)",
  subRole: "Membre depuis 2024",
  rating: 5,
  text: "Les travaux de rénovation que je réalise sont complexes. Artisans Validés m'envoie des clients qui ont un vrai projet, un vrai budget. Je ne perds plus mon temps sur des chantiers qui n'aboutissent pas.",
  verified: true,
  verifiedLabel: "Membre vérifié ✓",
  type: "Artisan",
  sealLabel: "Certifié"
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
  return <section className="py-14 lg:py-22 relative overflow-hidden bg-primary">
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <motion.span initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-[#f0f2f5] text-sm font-medium mb-4">
            <Star className="w-4 h-4 fill-[#f0f2f5] text-[#f0f2f5]" />
            L'humain au centre
          </motion.span>
          <h2 className="text-xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Le Livre d'Or de l'Alliance
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Particuliers et artisans témoignent de leur expérience avec Artisans Validés.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
          {testimonials.map((testimonial, index) => <motion.article key={testimonial.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15, duration: 0.5 }} whileHover={{ y: -4, transition: { duration: 0.3 } }} className="relative group h-full">
              <div className="bg-primary/80 rounded-2xl overflow-hidden h-full border border-primary-foreground/15 hover:border-accent/40 hover:shadow-xl transition-all duration-300 flex flex-col">
                <div className="p-6 flex flex-col flex-1">
                  {/* Badge Sceau AV */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center shadow-lg border-2 border-gold/30">
                      <div className="text-center">
                        <span className="block text-primary font-black text-sm leading-none">AV</span>
                        <span className="block text-primary/70 text-[7px] font-semibold tracking-wider uppercase leading-tight mt-0.5">{testimonial.sealLabel}</span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/10 text-white/60 text-xs font-medium">
                      {testimonial.type}
                    </span>
                  </div>

                  <Quote className="w-7 h-7 text-white/30 mb-4" />

                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => <AnimatedStar key={i} index={i + index * 5} filled={i < testimonial.rating} />)}
                  </div>

                  <p className="text-white mb-6 leading-relaxed text-[13px] md:text-base whitespace-pre-line flex-1 break-words">
                    "{testimonial.text}"
                  </p>

                  <div className="pt-5 border-t border-white/10 space-y-3 mt-auto">
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {testimonial.name}
                      </h3>
                      <p className="text-sm text-white/60">
                        {testimonial.role}
                      </p>
                      {testimonial.subRole && (
                        <p className="text-xs text-white/40 mt-0.5">
                          {testimonial.subRole}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-400">
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

      </div>
    </section>;
};
export default TestimonialsSection;
