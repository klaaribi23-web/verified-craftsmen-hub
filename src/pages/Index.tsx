import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import CategoriesSection from "@/components/home/CategoriesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import TrustSection from "@/components/home/TrustSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import AllianceSection from "@/components/home/AllianceSection";
import SocialProofBanner from "@/components/home/SocialProofBanner";
import AskExpertSection from "@/components/home/AskExpertSection";
import ExpertCaseStudy from "@/components/home/ExpertCaseStudy";
import LaboAndreaSection from "@/components/home/LaboAndreaSection";
import SocialProofToast from "@/components/home/SocialProofToast";
import EliteSelectionProcess from "@/components/home/EliteSelectionProcess";
import FeaturedArtisansCarousel from "@/components/artisan-search/FeaturedArtisansCarousel";
import PowerBlock from "@/components/home/PowerBlock";

import CategoryArtisansCarousel from "@/components/home/CategoryArtisansCarousel";
import { motion } from "framer-motion";
import { Star, ArrowRight, ShieldCheck, Award, HeartHandshake, UserCheck, CheckCircle2, Camera, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import OrganizationSchema from "@/components/seo/OrganizationSchema";

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <SEOHead
        title="Artisans Validés | L'élite des artisans audités sur le terrain"
        description="Ne confiez plus vos travaux au hasard. Accédez à un réseau d'artisans certifiés, audités et sans harcèlement commercial. Votre anonymat est garanti."
        canonical="https://artisansvalides.fr"
      />
      <OrganizationSchema />
      <Navbar />
      <main>
        {/* BLOC DE PUISSANCE — Headline + Recherche + Trust */}
        <PowerBlock />

        {/* Social proof banner */}
        <SocialProofBanner />

        {/* TEMPS 2 — Bandeau de réassurance */}
        <section className="bg-navy-dark py-3 border-y border-white/5">
          <div className="container mx-auto px-4 flex items-center justify-center gap-4 md:gap-8 flex-wrap text-xs md:text-sm text-white/70 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Entreprise Française</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Support 7j/7</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" /> Paiement Sécurisé Stripe</span>
          </div>
        </section>

        {/* TEMPS 3 — Processus de sélection Élite */}
        <EliteSelectionProcess />

        {/* TEMPS 3 — Les 3 étapes simples */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                Comment ça marche ?
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Trois étapes pour des travaux en toute sérénité.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-[3.5rem] max-w-4xl mx-auto">
              {[
                { step: "01", icon: Camera, title: "Décrivez votre besoin", desc: "Publiez votre projet avec des photos. Vos coordonnées restent anonymes." },
                { step: "02", icon: MessageSquare, title: "Discutez anonymement", desc: "Échangez directement avec les artisans validés de votre secteur." },
                { step: "03", icon: UserCheck, title: "Choisissez votre pro", desc: "Sélectionnez l'artisan qui vous convient et lancez vos travaux." },
              ].map(({ step, icon: Icon, title, desc }, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-gold/30 bg-gold/5 flex items-center justify-center mx-auto mb-5">
                    <Icon className="w-7 h-7 text-gold" />
                  </div>
                  <span className="text-xs font-bold text-gold/60 tracking-widest uppercase mb-2 block text-center">Étape {step}</span>
                  <h3 className="text-lg font-bold text-foreground mb-2 text-center">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-center">{desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Bandeau ADN */}
        <section className="bg-muted py-6 border-t border-border">
          <div className="container mx-auto px-4 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 text-gold flex-shrink-0" />
              <p className="text-foreground text-base md:text-lg font-medium">
                Ici, on ne vend pas vos coordonnées au plus offrant.{" "}
                <span className="text-gold font-bold">On déploie un réseau d'élite, département par département.</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 pt-2">
              {[
                { icon: Award, label: "Assurance Décennale Vérifiée" },
                { icon: HeartHandshake, label: "Charte Qualité Stricte" },
                { icon: UserCheck, label: "Accompagnement Personnalisé" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
                  <Icon className="h-4 w-4 text-gold/70" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CategoriesSection />

        <div id="expert-andrea">
          <AskExpertSection />
        </div>

        <LaboAndreaSection />

        {/* Featured Artisans */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 rounded-full mb-4">
                <Star className="h-4 w-4 text-gold fill-gold" />
                <span className="text-sm font-medium text-gold">Top artisans</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">L'exclusivité de votre ville : nos artisans sélectionnés</h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Chaque profil est vérifié et validé par notre équipe avant d'intégrer le réseau
              </p>
            </motion.div>
            <FeaturedArtisansCarousel />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center mt-10"
            >
              <Button asChild size="lg" variant="gold" className="group">
                <Link to="/trouver-artisan">
                  Voir tous les artisans
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <TrustSection />

        <AllianceSection />

        <ExpertCaseStudy />

        <CategoryArtisansCarousel 
          categoryName="Maçon"
          title="Un maçon près de chez vous"
          subtitle="Des professionnels qualifiés pour vos travaux de construction et rénovation"
        />

        <CategoryArtisansCarousel 
          categoryName="Dépannage plomberie"
          title="Nos plombiers validés"
          subtitle="Intervention rapide et travail de qualité garantie"
        />

        <TestimonialsSection />

        <CategoryArtisansCarousel 
          categoryName="Dépannage électricité"
          title="Électriciens certifiés"
          subtitle="Des experts pour tous vos besoins électriques"
        />

        <CTASection />
      </main>

      {/* Social proof fixe au-dessus du footer */}
      <SocialProofToast />

      <Footer />
    </div>
  );
};
export default Index;
