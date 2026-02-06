import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import TrustSection from "@/components/home/TrustSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTASection from "@/components/home/CTASection";
import FeaturedArtisansCarousel from "@/components/artisan-search/FeaturedArtisansCarousel";
import CategoryArtisansCarousel from "@/components/home/CategoryArtisansCarousel";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import OrganizationSchema from "@/components/seo/OrganizationSchema";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Trouvez des artisans de confiance"
        description="Mise en relation rapide avec des artisans qualifiés et vérifiés en France. Devis gratuit, qualité et expertise garantie pour tous vos projets de travaux."
        canonical="https://artisansvalides.fr"
      />
      <OrganizationSchema />
      <Navbar />
      <main>
        <HeroSection />

        {/* Bandeau ADN Particuliers */}
        <section className="bg-navy py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-white text-base md:text-lg font-medium">
              Ici, on ne vous vend pas au plus offrant.{" "}
              <span className="text-gold font-bold">On vous présente l'artisan local qu'on a personnellement validé.</span>
            </p>
          </div>
        </section>

        <CategoriesSection />

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
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">Nos artisans sélectionnés</h2>
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
    </div>
  );
};
export default Index;
