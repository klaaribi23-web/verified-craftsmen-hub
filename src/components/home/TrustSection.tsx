import { motion } from "framer-motion";
import { Shield, FileCheck, BadgeCheck, Star, Clock, Lock } from "lucide-react";
const trustFeatures = [{
  icon: FileCheck,
  title: "SIRET vérifié",
  description: "Chaque artisan est enregistré et son numéro SIRET est vérifié auprès des autorités compétentes."
}, {
  icon: Shield,
  title: "Assurances validées",
  description: "Responsabilité civile et décennale contrôlées pour garantir votre protection."
}, {
  icon: BadgeCheck,
  title: "Identité confirmée",
  description: "Vérification d'identité stricte pour chaque professionnel inscrit sur la plateforme."
}, {
  icon: Star,
  title: "Avis authentiques",
  description: "Seuls les clients ayant réellement fait appel à l'artisan peuvent laisser un avis."
}, {
  icon: Clock,
  title: "Réactivité garantie",
  description: "Nos artisans s'engagent à répondre sous 24h à vos demandes de devis."
}, {
  icon: Lock,
  title: "Données sécurisées",
  description: "Vos informations personnelles sont protégées et jamais revendues à des tiers."
}];
const TrustSection = () => {
  return <section className="py-20 lg:py-32 bg-navy relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} whileInView={{
        opacity: 1,
        y: 0
      }} viewport={{
        once: true
      }} className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-medium mb-4">
            Garantie qualité
          </span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Pourquoi nous faire <span className="text-gradient-gold">confiance</span> ?
          </h2>
          <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto text-center\n">
            Artisans Validés applique un processus de vérification rigoureux 
            pour garantir la qualité et la fiabilité de chaque professionnel.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {trustFeatures.map((feature, index) => <motion.div key={feature.title} initial={{
          opacity: 0,
          y: 20
        }} whileInView={{
          opacity: 1,
          y: 0
        }} viewport={{
          once: true
        }} transition={{
          delay: index * 0.1
        }} className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center mb-6 shadow-gold">
                <feature.icon className="w-7 h-7 text-navy-dark" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-white/70 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>)}
        </div>
      </div>
    </section>;
};
export default TrustSection;