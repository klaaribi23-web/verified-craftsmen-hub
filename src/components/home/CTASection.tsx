import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Users } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 lg:py-32 bg-muted">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Client CTA */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-8 lg:p-12 shadow-soft border border-border"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 shadow-gold">
              <Users className="w-8 h-8 text-navy-dark" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-navy mb-4">
              Vous avez un projet de travaux ?
            </h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Décrivez votre besoin et recevez gratuitement jusqu'à 5 devis 
              d'artisans qualifiés et vérifiés près de chez vous.
            </p>
            <ul className="space-y-3 mb-8">
              {["Devis gratuit et sans engagement", "Artisans vérifiés et assurés", "Réponse sous 24h garantie"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-navy">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-success" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Button variant="hero" asChild>
              <Link to="/demande-devis">
                Demander un devis gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>

          {/* Artisan CTA */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-navy rounded-3xl p-8 lg:p-12 relative overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
                Vous êtes artisan ?
              </h3>
              <p className="text-white/70 mb-8 text-lg">
                Rejoignez notre réseau d'artisans de confiance et recevez 
                des demandes de chantiers qualifiés dans votre zone.
              </p>
              <ul className="space-y-3 mb-8">
                {["Chantiers qualifiés garantis", "Profil professionnel valorisé", "Badge Artisan Validé"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gold" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button variant="gold" size="lg" asChild>
                <Link to="/devenir-artisan">
                  Rejoindre le réseau
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
