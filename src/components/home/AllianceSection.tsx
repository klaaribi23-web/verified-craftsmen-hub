import { motion } from "framer-motion";
import { Hammer, Quote, Cpu, ShieldCheck } from "lucide-react";

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
            Notre Méthode
          </span>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-2 tracking-tight">
            Deux piliers. Une certification.
          </h2>
          <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gradient-gold">
            L'Expertise Métier rencontre la Technologie.
          </p>
        </motion.div>

        {/* Two Columns — Pillars */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 mb-16">
          {/* Pilier 1 : Expertise Métier */}
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
                Pilier 1 : L'Expertise Métier
              </h3>
            </div>

            <p className="text-muted-foreground leading-relaxed text-base lg:text-lg mb-6">
              Un protocole de validation strict, élaboré par des professionnels cumulant{" "}
              <span className="font-bold text-foreground">20 ans de chantier</span>.
            </p>

            <ul className="space-y-3 text-muted-foreground">
              {[
                "Validité des assurances décennales & RC Pro",
                "Solidité de l'entreprise — professionnalisme vérifié",
                "Références de chantiers réels et savoir-faire concret",
                "Satisfaction des clients précédents",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Pilier 2 : Technologie Exclusive */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card rounded-3xl p-8 lg:p-10 border border-border shadow-soft"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-navy flex items-center justify-center shadow-lg">
                <Cpu className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
                Pilier 2 : La Technologie Exclusive
              </h3>
            </div>

            <p className="text-muted-foreground leading-relaxed text-base lg:text-lg mb-6">
              Une plateforme de mise en relation intelligente qui{" "}
              <span className="font-bold text-foreground">protège les données des clients</span>{" "}
              et sélectionne les meilleurs profils par algorithme de confiance.
            </p>

            <ul className="space-y-3 text-muted-foreground">
              {[
                "Algorithme de matching par expertise & localisation",
                "Protection totale des coordonnées clients",
                "Maillage technologique sur toute la France",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-navy shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Citation choc + ton direct */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="bg-navy rounded-2xl p-8 md:p-10 border-l-4 border-gold mb-6">
            <Quote className="w-8 h-8 text-gold/60 mb-4" />
            <p className="text-white text-lg md:text-xl lg:text-2xl font-bold leading-relaxed italic">
              « Nous utilisons la technologie pour éliminer les mauvais payeurs et les mauvais poseurs. Pas de blabla, juste des chantiers vérifiés et des pros certifiés. »
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-6 md:p-8 border border-border mb-6">
            <p className="text-foreground leading-relaxed text-base md:text-lg">
              De Lille à Marseille, nos Experts Terrain et notre algorithme de confiance valident les meilleurs artisans de France.{" "}
              <span className="font-bold text-gold">
                Chaque dossier est audité. Chaque certification est méritée.
              </span>
            </p>
          </div>

          <p className="text-center text-foreground font-bold text-lg md:text-xl mt-6">
            La Certification Artisans Validés — <span className="text-gold">L'expertise du chantier au service du digital.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AllianceSection;
