import { motion } from "framer-motion";
import { Star, Quote, CheckCircle2 } from "lucide-react";
import client1 from "@/assets/testimonials/client-1.jpg";
import client2 from "@/assets/testimonials/client-2.jpg";
import client3 from "@/assets/testimonials/client-3.jpg";

const testimonials = [
  {
    name: "Marie Dupont",
    location: "Paris 15ème",
    rating: 5,
    text: "J'ai trouvé un excellent plombier en moins de 2 heures. Le devis était clair, les travaux impeccables. Je recommande vivement !",
    artisan: "Plomberie",
    image: client1,
    verified: true,
  },
  {
    name: "Thomas Bernard",
    location: "Lyon 6ème",
    rating: 5,
    text: "Rénovation complète de mon appartement réalisée par des artisans trouvés sur la plateforme. Professionnels et ponctuels.",
    artisan: "Multi-travaux",
    image: client2,
    verified: true,
  },
  {
    name: "Sophie Martin",
    location: "Marseille",
    rating: 5,
    text: "Le système de vérification m'a vraiment rassurée. J'ai pu confier mes travaux d'électricité en toute sérénité.",
    artisan: "Électricité",
    image: client3,
    verified: true,
  },
];

const AnimatedStar = ({ index, filled }: { index: number; filled: boolean }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0, rotate: -180 }}
    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
    viewport={{ once: true }}
    transition={{
      delay: index * 0.1,
      type: "spring",
      stiffness: 260,
      damping: 20,
    }}
  >
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        delay: index * 0.2,
        repeatDelay: 3,
      }}
    >
      <Star
        className={`w-5 h-5 ${
          filled ? "fill-gold text-gold" : "text-muted-foreground"
        }`}
      />
    </motion.div>
  </motion.div>
);

const TestimonialsSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Star className="w-4 h-4 fill-gold" />
            </motion.div>
            Témoignages
          </motion.span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-navy mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Des milliers de particuliers ont déjà trouvé leur artisan idéal
            grâce à Artisans Validés.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="relative group"
            >
              <div className="bg-muted rounded-2xl p-8 h-full border border-border/50 hover:border-gold/30 hover:shadow-lg transition-all duration-300">
                {/* Quote Icon */}
                <motion.div
                  initial={{ opacity: 0, rotate: -20 }}
                  whileInView={{ opacity: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 + 0.2 }}
                >
                  <Quote className="w-10 h-10 text-gold/30 mb-4" />
                </motion.div>

                {/* Animated Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <AnimatedStar
                      key={i}
                      index={i + index * 5}
                      filled={i < testimonial.rating}
                    />
                  ))}
                </div>

                {/* Text */}
                <motion.p 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 + 0.3 }}
                  className="text-navy mb-6 leading-relaxed text-base"
                >
                  "{testimonial.text}"
                </motion.p>

                {/* Author with real photo */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15 + 0.4 }}
                  className="flex items-center gap-4"
                >
                  <div className="relative">
                    <img
                      src={testimonial.image}
                      alt={`Photo de ${testimonial.name}`}
                      width={56}
                      height={56}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gold shadow-md"
                    />
                    {testimonial.verified && (
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.15 + 0.5, type: "spring" }}
                        className="absolute -bottom-1 -right-1 bg-success rounded-full p-0.5"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </motion.div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">
                      {testimonial.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.location} · {testimonial.artisan}
                    </p>
                  </div>
                </motion.div>
              </div>
              
              {/* Hover glow effect */}
              <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-gold/20 to-primary/20 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" aria-hidden="true" />
            </motion.article>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 bg-gradient-gold rounded-2xl p-8 lg:p-12 shadow-gold relative overflow-hidden"
        >
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-20">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-24 h-24 border border-navy/30 rounded-full"
                style={{
                  left: `${(i % 3) * 40}%`,
                  top: `${Math.floor(i / 3) * 60}%`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              />
            ))}
          </div>
          
          {[
            { value: "4.8/5", label: "Note moyenne", icon: Star },
            { value: "50K+", label: "Avis vérifiés", icon: CheckCircle2 },
            { value: "98%", label: "Clients satisfaits", icon: Star },
            { value: "24h", label: "Temps de réponse", icon: CheckCircle2 },
          ].map((stat, index) => (
            <motion.div 
              key={stat.label} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-center relative z-10"
            >
              <motion.div 
                className="text-3xl md:text-4xl font-bold text-navy-dark mb-1"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-navy-dark/70 text-sm font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
