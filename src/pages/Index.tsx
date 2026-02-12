import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
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
import FeaturedArtisansCarousel from "@/components/artisan-search/FeaturedArtisansCarousel";
import CategoryArtisansCarousel from "@/components/home/CategoryArtisansCarousel";
import { motion } from "framer-motion";
import { Star, ArrowRight, ShieldCheck, Award, HeartHandshake, UserCheck } from "lucide-react";
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
        <HeroSection />

        {/* Bandeau Anonymat — forte lisibilité */}
        <section className="bg-muted py-4 border-y border-primary/15">
          <div className="container mx-auto px-4 text-center">
            <p className="text-base md:text-lg font-semibold tracking-wide text-foreground" style={{ fontFamily: "'Georgia', serif", letterSpacing: "0.04em" }}>
              <ShieldCheck className="inline w-5 h-5 text-primary mr-2 -mt-0.5" />
              Votre anonymat garanti jusqu'au dernier moment
            </p>
          </div>
        </section>

        <SocialProofBanner />

        {/* Scarcity Counter */}
        <section className="py-6 bg-background border-b border-border">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex items-center justify-center gap-3"
            >
              <div className="flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-primary/20 shadow-gold">
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-3 h-3 rounded-full bg-destructive"
                />
                <span className="text-sm md:text-base text-foreground font-medium">
                  Places restantes pour les artisans dans le <span className="text-primary font-bold">59</span> :
                </span>
                <motion.span
                  className="text-2xl font-bold text-primary"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  3
                </motion.span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bandeau ADN Particuliers */}
        <section className="bg-muted py-6 border-t border-border">
          <div className="container mx-auto px-4 text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
              <p className="text-foreground text-base md:text-lg font-medium">
                Ici, on ne vend pas vos coordonnées au plus offrant.{" "}
                <span className="text-primary font-bold">On déploie un réseau d'élite, département par département.</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 pt-2">
              {[
                { icon: Award, label: "Assurance Décennale Vérifiée" },
                { icon: HeartHandshake, label: "Charte Qualité Stricte" },
                { icon: UserCheck, label: "Accompagnement Personnalisé" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-muted-foreground text-xs md:text-sm">
                  <Icon className="h-4 w-4 text-primary/70" />
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

        {/* Featured Artisans Section - 4x4 */}
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

        <HowItWorksSection />

        {/* Category Carousel - Maçons */}
        <CategoryArtisansCarousel 
          categoryName="Maçon"
          title="Un maçon près de chez vous"
          subtitle="Des professionnels qualifiés pour vos travaux de construction et rénovation"
        />

        <TrustSection />

        <AllianceSection />

        <ExpertCaseStudy />

        {/* Category Carousel - Plombiers */}
        <CategoryArtisansCarousel 
          categoryName="Dépannage plomberie"
          title="Nos plombiers validés"
          subtitle="Intervention rapide et travail de qualité garantie"
        />

        <TestimonialsSection />

        {/* Category Carousel - Électriciens */}
        <CategoryArtisansCarousel 
          categoryName="Dépannage électricité"
          title="Électriciens certifiés"
          subtitle="Des experts pour tous vos besoins électriques"
        />

        <CTASection />
      </main>
      <Footer />
      <SocialProofToast />
    </div>
  );
};
export default Index;
