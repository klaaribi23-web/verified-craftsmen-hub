import { motion } from 'framer-motion';
import { Shield, Zap, Users, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/seo/SEOHead';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const APropos = () => {
  return (
    <>
      <SEOHead
        title="À Propos — L'Alliance Expertise & Technologie"
        description="Artisans Validés : l'alliance de 20 ans d'expertise chantier et d'une technologie exclusive pour protéger particuliers et artisans sérieux."
        canonical="https://artisansvalides.fr/a-propos"
      />
      <Navbar />

      <main className="min-h-screen pt-12 lg:pt-0">
        {/* Hero — Typographic */}
        <section className="relative bg-navy text-white py-28 md:py-36 overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          <motion.div
            className="relative z-10 container mx-auto px-4 max-w-4xl text-center"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.span variants={fadeInUp} className="inline-block px-4 py-2 bg-gold/20 text-gold rounded-full text-sm font-medium mb-8 tracking-wide">
              Notre ADN
            </motion.span>
            <motion.h1 variants={fadeInUp} className="text-4xl md:text-6xl font-bold leading-tight mb-8">
              L'Alliance de l'Expertise Métier
              <br />
              <span className="text-gold">et de la Technologie.</span>
            </motion.h1>
            <motion.div variants={fadeInUp} className="w-16 h-1 bg-gold mx-auto" />
          </motion.div>
        </section>

        {/* Introduction — Cash */}
        <section className="py-20 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.p variants={fadeInUp} className="text-2xl md:text-3xl font-bold text-foreground leading-snug mb-8">
                On a créé ce qu'on aurait aimé avoir quand on était sur le terrain.
              </motion.p>
              <motion.p variants={fadeInUp} className="text-lg text-muted-foreground leading-relaxed mb-8">
                De la vraie transparence, pas des promesses en l'air. On en a eu marre des vendeurs de leads qui vendent du vent aux artisans et qui harcèlent les particuliers.
              </motion.p>
              <motion.div variants={fadeInUp} className="border-l-4 border-gold pl-6 py-2">
                <p className="text-foreground font-semibold text-lg italic">
                  « Nous utilisons la technologie pour éliminer les mauvais payeurs et les mauvais poseurs. Pas de blabla, juste des chantiers vérifiés et des pros certifiés. »
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Notre Mission */}
        <section className="py-20 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Notre Mission
              </motion.h2>
              <motion.div variants={fadeInUp} className="w-12 h-1 bg-gold mb-8" />
              <motion.p variants={fadeInUp} className="text-lg text-muted-foreground leading-relaxed mb-6">
                Artisans Validés n'est pas un simple annuaire. C'est une <span className="text-foreground font-semibold">plateforme nationale</span> qui utilise la technologie pour protéger deux mondes :
              </motion.p>
              <motion.div variants={fadeInUp} className="grid sm:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Les particuliers</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Qui veulent des travaux sans stress, sans harcèlement téléphonique, et avec la garantie d'un artisan vérifié.
                  </p>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-gold" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">Les artisans sérieux</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Qui veulent bosser sans être harcelés par des démarcheurs et sans que leurs coordonnées soient vendues à la chaîne.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Le Concept — Les 2 Piliers */}
        <section className="py-20 md:py-24 bg-navy text-white">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold mb-6">
                Le Concept
              </motion.h2>
              <motion.div variants={fadeInUp} className="w-12 h-1 bg-gold mb-8" />
              <motion.p variants={fadeInUp} className="text-lg text-white/80 leading-relaxed mb-10">
                D'un côté, <span className="text-gold font-semibold">20 ans d'expertise chantier</span> pour valider le savoir-faire. De l'autre, un <span className="text-gold font-semibold">algorithme de confiance</span> qui sécurise les mises en relation.
              </motion.p>

              <motion.div variants={fadeInUp} className="space-y-6 mb-10">
                {[
                  { icon: CheckCircle2, label: "Expertise Métier", desc: "Vérification des assurances décennales, références chantiers réelles, satisfaction des clients précédents." },
                  { icon: Zap, label: "Technologie Exclusive", desc: "Algorithme de confiance, protection des données, mise en relation intelligente et contrôlée." },
                ].map(({ icon: Icon, label, desc }, i) => (
                  <div key={i} className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
                    <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white mb-1">{label}</h3>
                      <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>

              <motion.div variants={fadeInUp} className="bg-white/5 border border-gold/20 rounded-xl p-6">
                <p className="text-white/90 leading-relaxed">
                  Ici, le client garde le <span className="text-gold font-semibold">contrôle total</span> : ses coordonnées ne sont transmises qu'à l'artisan qu'il a lui-même validé. Pas de vente de leads, pas de démarchage sauvage.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Engagements */}
        <section className="py-20 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ce qu'on ne fait pas
              </motion.h2>
              <motion.div variants={fadeInUp} className="w-12 h-1 bg-gold mx-auto mb-10" />

              <motion.div variants={fadeInUp} className="grid sm:grid-cols-3 gap-6 mb-12 text-left">
                {[
                  { title: "Pas de commissions", desc: "On ne prend pas de pourcentage sur vos travaux. Votre argent doit rester dans votre projet, pas dans notre poche." },
                  { title: "Pas de vente de leads", desc: "Vos données sont précieuses. On ne les revend jamais à 10 entreprises différentes pour vous faire harceler." },
                  { title: "Pas de fausses urgences", desc: "On ne vous met pas la pression. Un bon chantier, c'est un chantier réfléchi avec le bon pro." },
                ].map((item, i) => (
                  <div key={i} className="bg-muted/50 border border-border rounded-xl p-6">
                    <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </motion.div>

              <motion.p variants={fadeInUp} className="text-muted-foreground italic text-lg mb-2">
                On ne cherche pas des dossiers parfaits.
              </motion.p>
              <motion.p variants={fadeInUp} className="text-foreground font-bold text-xl">
                On cherche des artisans qui ont le goût du travail bien fait
                <br />et qui respectent leurs clients.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 md:py-28 bg-gradient-to-r from-navy to-primary text-white">
          <div className="container mx-auto px-4">
            <motion.div
              className="max-w-2xl mx-auto text-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.p variants={fadeInUp} className="text-white/70 text-sm leading-relaxed max-w-xl mx-auto mb-8">
                Artisans Validés est né de la rencontre entre des experts du bâtiment fatigués des dérives du web et des ingénieurs convaincus que la technologie doit servir à protéger les gens, pas à les exploiter.
              </motion.p>
              <motion.div variants={fadeInUp} className="bg-white/10 border border-gold/30 rounded-xl px-6 py-4 inline-block mb-8">
                <p className="text-gold font-bold text-lg">Notre engagement : Moins de blabla, plus de résultats.</p>
              </motion.div>
              <motion.p variants={fadeInUp} className="text-white/50 text-xs mb-10">
                Andrea & Associée — L'expertise du chantier au service du digital.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg" variant="gold" className="text-lg px-10">
                  <Link to="/devenir-artisan">
                    Rejoindre l'Alliance
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-lg border-white/30 text-white hover:bg-white/10">
                  <Link to="/trouver-artisan">
                    Trouver un artisan
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default APropos;
