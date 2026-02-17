import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Users } from "lucide-react";

const CTASection = () => {
  return <section className="py-20 lg:py-32 bg-muted" aria-labelledby="cta-heading">
      <div className="container mx-auto px-4 lg:px-8">
        <h2 id="cta-heading" className="sr-only">Passez à l'action</h2>
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Client CTA */}
          <motion.article initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-card rounded-3xl p-8 lg:p-12 shadow-soft border border-border">
            <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 shadow-gold">
              <Users className="w-8 h-8 text-primary-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-xl lg:text-3xl font-bold text-foreground mb-4">
              Vous avez un projet de travaux ?
            </h3>
            <p className="text-muted-foreground mb-8 text-lg">
              Décrivez votre besoin et nous sélectionnons pour vous les artisans 
              les plus adaptés, vérifiés et validés par notre équipe.
            </p>
            <ul className="space-y-3 mb-8">
              {["Artisans triés sur le volet par nos soins", "Profils vérifiés manuellement", "Suivi qualité garanti"].map(item => <li key={item} className="flex items-center gap-3 text-foreground">
                  <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-success" />
                  </div>
                  {item}
                </li>)}
            </ul>
            <Button variant="hero" asChild>
              <Link to="/demande-devis">
                Trouver mon artisan
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Link>
            </Button>
          </motion.article>

          {/* Artisan CTA */}
          <motion.article initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="bg-navy rounded-3xl p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl" aria-hidden="true" />
            
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-gold" aria-hidden="true" />
              </div>
              <h3 className="text-xl lg:text-3xl font-bold text-white mb-4">
                Vous êtes artisan ?
              </h3>
              <p className="text-white/70 mb-8 text-lg">
                Candidatez pour rejoindre notre réseau exclusif. 
                Nous vérifions chaque profil et ne retenons que les meilleurs.
              </p>
              <ul className="space-y-3 mb-8">
                {["Sélection sur dossier uniquement", "Exclusivité par zone géographique", "Chantiers qualifiés garantis"].map(item => <li key={item} className="flex items-center gap-3 text-white">
                    <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gold" />
                    </div>
                    {item}
                  </li>)}
              </ul>
              <Button variant="gold" size="lg" asChild>
                <Link to="/devenir-artisan">
                  Candidater au réseau
                  <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </motion.article>
        </div>
      </div>
    </section>;
};

export default CTASection;
