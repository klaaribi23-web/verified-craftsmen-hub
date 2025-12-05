import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Marie Dupont",
    location: "Paris 15ème",
    rating: 5,
    text: "J'ai trouvé un excellent plombier en moins de 2 heures. Le devis était clair, les travaux impeccables. Je recommande vivement !",
    artisan: "Plomberie",
    avatar: "MD",
  },
  {
    name: "Thomas Bernard",
    location: "Lyon 6ème",
    rating: 5,
    text: "Rénovation complète de mon appartement réalisée par des artisans trouvés sur la plateforme. Professionnels et ponctuels.",
    artisan: "Multi-travaux",
    avatar: "TB",
  },
  {
    name: "Sophie Martin",
    location: "Marseille",
    rating: 5,
    text: "Le système de vérification m'a vraiment rassurée. J'ai pu confier mes travaux d'électricité en toute sérénité.",
    artisan: "Électricité",
    avatar: "SM",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            Témoignages
          </span>
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
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="bg-muted rounded-2xl p-8 h-full">
                {/* Quote Icon */}
                <Quote className="w-10 h-10 text-gold/30 mb-4" />

                {/* Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                  ))}
                </div>

                {/* Text */}
                <p className="text-navy mb-6 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center text-navy-dark font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-navy">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.location} · {testimonial.artisan}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 bg-gradient-gold rounded-2xl p-8 lg:p-12 shadow-gold"
        >
          {[
            { value: "4.8/5", label: "Note moyenne" },
            { value: "50K+", label: "Avis vérifiés" },
            { value: "98%", label: "Clients satisfaits" },
            { value: "24h", label: "Temps de réponse" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-navy-dark mb-1">
                {stat.value}
              </div>
              <div className="text-navy-dark/70 text-sm font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
