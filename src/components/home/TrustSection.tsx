import { motion } from "framer-motion";
import { Shield, FileCheck, BadgeCheck, Star, Clock, Lock } from "lucide-react";

const trustFeatures = [{
  icon: FileCheck,
  title: "SIRET vérifié manuellement",
  description: "Notre équipe contrôle chaque numéro SIRET et vérifie l'existence réelle de l'entreprise auprès des autorités."
}, {
  icon: Shield,
  title: "Assurances contrôlées par nos soins",
  description: "Nous exigeons et vérifions personnellement la RC Pro et la décennale de chaque artisan."
}, {
  icon: BadgeCheck,
  title: "Entretien de validation",
  description: "Chaque artisan passe un entretien avec notre équipe avant d'être intégré au réseau."
}, {
  icon: Star,
  title: "Avis certifiés et modérés",
  description: "Nous modérons chaque avis pour garantir leur authenticité. Seuls les vrais clients peuvent témoigner."
}, {
  icon: Clock,
  title: "Suivi qualité permanent",
  description: "Nous suivons les performances de chaque artisan et retirons du réseau ceux qui ne respectent pas nos standards."
}, {
  icon: Lock,
  title: "Données sécurisées",
  description: "Vos informations personnelles sont protégées et jamais revendues à des tiers."
}];

const TrustSection = () => {
  return <section className="py-20 lg:py-32 bg-primary relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-medium mb-4">
            Notre processus de sélection
          </span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            C'est <span className="text-gradient-gold">nous</span> qui vérifions tout
          </h2>
          <p className="text-base md:text-lg text-primary-foreground/70 max-w-2xl mx-auto text-center">
            Contrairement aux annuaires classiques, chaque artisan est personnellement 
            contrôlé et validé par notre équipe avant d'intégrer le réseau.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {trustFeatures.map((feature, index) => <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center mb-6 shadow-gold">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-primary-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-primary-foreground/70 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>)}
        </div>
      </div>
    </section>;
};

export default TrustSection;
