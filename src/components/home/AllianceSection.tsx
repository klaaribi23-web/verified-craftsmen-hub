import { motion } from "framer-motion";
import { Hammer, Target, Quote } from "lucide-react";
import founderTerrain from "@/assets/about/founder-terrain.jpg";
import founderDigital from "@/assets/about/founder-digital.jpg";

const AllianceSection = () => {
  return (
    <section className="py-20 lg:py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            L'Alliance de l'Expérience et de la Technologie
          </span>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Pourquoi nous ?{" "}
            <span className="text-gradient-gold">Le terrain rencontre le digital.</span>
          </h2>
        </motion.div>

        {/* Two Columns */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Bloc Terrain */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl p-8 lg:p-10 border border-border shadow-soft"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                <Hammer className="w-7 h-7 text-navy-dark" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-foreground">
                L'Expérience Terrain
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={founderTerrain}
                alt="Fondateur - Expert terrain"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-gold/30 shrink-0"
              />
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                20 ans dans la rénovation de l'habitat. Je connais vos problématiques,
                vos galères et votre valeur.{" "}
                <span className="font-semibold text-foreground">
                  Mon rôle : auditer et certifier les vrais patrons.
                </span>
              </p>
            </div>
          </motion.div>

          {/* Bloc Digital */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl p-8 lg:p-10 border border-border shadow-soft"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl lg:text-2xl font-bold text-foreground">
                La Stratégie Digitale
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <img
                src={founderDigital}
                alt="Fondatrice - Experte digitale"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500/30 shrink-0"
              />
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                Experte en acquisition et stratégie web.{" "}
                <span className="font-semibold text-foreground">
                  Mon rôle : déployer l'artillerie numérique pour que votre savoir-faire
                  soit numéro 1 sur votre secteur.
                </span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Central Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <Quote className="w-10 h-10 text-gold/40 mx-auto mb-4" />
          <p className="text-lg md:text-xl lg:text-2xl font-medium text-foreground leading-relaxed">
            Nous avons créé <span className="text-gradient-gold font-bold">Artisans Validés</span> pour
            protéger les bons professionnels contre les vendeurs de leads et redonner
            confiance aux particuliers.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AllianceSection;
