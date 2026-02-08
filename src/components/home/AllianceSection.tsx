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
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-2 tracking-tight">
            Pourquoi nous ?
          </h2>
          <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gradient-gold">
            Le terrain rencontre le digital.
          </p>
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
              <h3 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                L'Expérience Terrain
              </h3>
            </div>

            <div className="flex flex-col items-center sm:flex-row gap-6">
              <img
                src={founderTerrain}
                alt="Fondateur - Expert terrain avec 20 ans d'expérience en rénovation"
                className="w-28 h-28 rounded-full object-cover border-4 border-gold/40 shadow-lg shrink-0"
              />
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                20 ans dans la rénovation de l'habitat. Je connais vos problématiques,
                vos galères et votre valeur.{" "}
                <span className="font-bold text-foreground text-lg lg:text-xl block mt-2">
                  Mon rôle : auditer et certifier les vrais patrons.
                </span>
              </p>
              <p className="text-muted-foreground leading-relaxed text-base mt-4">
                Quand je valide une entreprise, je mets mon expérience de 20 ans en jeu. C'est pour ça que nos clients ont confiance : ils savent qu'un artisan Validé, c'est un artisan qui bosse vraiment.
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
              <div className="w-14 h-14 rounded-xl bg-navy flex items-center justify-center shadow-lg">
                <Target className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                La Stratégie Digitale
              </h3>
            </div>

            <div className="flex flex-col items-center sm:flex-row gap-6">
              <img
                src={founderDigital}
                alt="Fondatrice - Experte en stratégie digitale et acquisition web"
                className="w-28 h-28 rounded-full object-cover border-4 border-navy/40 shadow-lg shrink-0"
              />
              <p className="text-muted-foreground leading-relaxed text-base lg:text-lg">
                Experte en acquisition et stratégie web.{" "}
                <span className="font-bold text-foreground text-lg lg:text-xl block mt-2">
                  Mon rôle : déployer l'artillerie numérique pour que votre savoir-faire
                  soit numéro 1 sur votre secteur.
                </span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Citation choc + valeur ajoutée */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-navy rounded-2xl p-8 md:p-10 border-l-4 border-gold mb-6">
            <Quote className="w-8 h-8 text-gold/60 mb-4" />
            <p className="text-white text-lg md:text-xl lg:text-2xl font-bold leading-relaxed italic">
              « On a créé ce qu'on aurait aimé avoir quand on était sur le terrain : de la vraie transparence, pas des promesses en l'air. »
            </p>
            <p className="text-gold font-extrabold text-base md:text-lg mt-4">
              On en a eu marre des vendeurs de leads qui ne connaissent rien au bâtiment et qui vendent du vent aux artisans.
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-6 md:p-8 border border-border mb-6">
            <p className="text-foreground leading-relaxed text-base md:text-lg">
              Ici, on ne vous vend pas des numéros de téléphone. On vous offre une vitrine auditée par un pro du métier. Quand je valide une entreprise, je mets mon expérience de 20 ans en jeu.{" "}
              <span className="font-bold text-gold">
                C'est pour ça que nos clients ont confiance : ils savent qu'un artisan Validé, c'est un artisan qui bosse vraiment.
              </span>
            </p>
          </div>

          <p className="text-center text-foreground font-bold text-lg md:text-xl">
            Andrea & Associée — <span className="text-gold">L'expertise du chantier au service du digital.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AllianceSection;
