import { motion } from "framer-motion";
import { Star, Quote, CheckCircle2 } from "lucide-react";
import solarInstall from "@/assets/testimonials/solar-install.jpg";
import electricalPanel from "@/assets/testimonials/electrical-panel.jpg";
import bathroomReno from "@/assets/testimonials/bathroom-reno.jpg";

const testimonials = [{
  name: "Stéphanie L.",
  location: "Lille",
  rating: 5,
  text: "Enfin un plombier qui arrive à l'heure et qui ne change pas le devis à la fin. La certification Artisans Validés m'a rassurée.",
  artisan: "Plomberie",
  image: bathroomReno,
  verified: true,
  type: "Particulier"
}, {
  name: "Marc D.",
  location: "Électricien",
  rating: 5,
  text: "J'en avais marre de payer des leads qui n'aboutissent pas. Ici, je ne parle qu'à des clients sérieux qui connaissent la valeur de mon travail.",
  artisan: "Électricité",
  image: electricalPanel,
  verified: true,
  type: "Artisan"
}, {
  name: "Jean-Marc T.",
  location: "Bordeaux",
  rating: 5,
  text: "Installation solaire impeccable. On sent que l'artisan a été audité avant d'être référencé.",
  artisan: "Panneaux solaires",
  image: solarInstall,
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
          {testimonials.map((testimonial, index) => <motion.article key={testimonial.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15, duration: 0.5 }} whileHover={{ y: -8, transition: { duration: 0.3 } }} className="relative group">
              <div className="bg-muted rounded-2xl overflow-hidden h-full border border-border/50 hover:border-gold/30 hover:shadow-lg transition-all duration-300">
                {/* Photo de réalisation */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={testimonial.image} 
                    alt={`Réalisation ${testimonial.artisan}`} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-navy/80 backdrop-blur-sm text-white text-xs font-medium">
                    {testimonial.type}
                  </div>
                </div>

                <div className="p-6">
                  <Quote className="w-8 h-8 text-gold/30 mb-3" />

                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => <AnimatedStar key={i} index={i + index * 5} filled={i < testimonial.rating} />)}
                  </div>

                  <p className="text-navy mb-5 leading-relaxed text-base">
                    "{testimonial.text}"
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-navy-dark font-bold text-sm">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy flex items-center gap-1.5">
                        {testimonial.name}
                        {testimonial.verified && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.location} · {testimonial.artisan}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-gold/20 to-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" aria-hidden="true" />
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
