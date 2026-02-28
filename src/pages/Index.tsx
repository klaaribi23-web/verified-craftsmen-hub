import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroDualEntry from "@/components/home/HeroDualEntry";
import ReassuranceBar from "@/components/home/ReassuranceBar";
import AndreaShowcase from "@/components/home/AndreaShowcase";
import ImpactStats from "@/components/home/ImpactStats";
import HowItWorksTabs from "@/components/home/HowItWorksTabs";
import EnhancedCategories from "@/components/home/EnhancedCategories";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FeaturedArtisansCarousel from "@/components/artisan-search/FeaturedArtisansCarousel";
import DoubleCTAFinal from "@/components/home/DoubleCTAFinal";
import SocialProofToast from "@/components/home/SocialProofToast";
import SEOHead from "@/components/seo/SEOHead";
import OrganizationSchema from "@/components/seo/OrganizationSchema";
import { motion } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <SEOHead
        title="Artisans Validés — L'élite vérifiée des artisans en France"
        description="Trouvez un artisan vérifié et audité près de chez vous. 87% des candidatures refusées. Décennale contrôlée. Zéro commission."
        canonical="https://artisansvalides.fr"
        ogImage="https://artisansvalides.fr/og-image.png"
      />
      <OrganizationSchema />
      <Navbar />
      <main>
        {/* SECTION 1 — Hero double entrée */}
        <HeroDualEntry />

        {/* SECTION 2 — Barre de réassurance */}
        <ReassuranceBar />

        {/* SECTION 3 — Andrea en scène */}
        <AndreaShowcase />

        {/* SECTION 4 — Stats impactantes */}
        <ImpactStats />

        {/* SECTION 5 — Comment ça marche (onglets) */}
        <HowItWorksTabs />

        {/* SECTION 6 — Catégories métiers */}
        <EnhancedCategories />

        {/* SECTION 7 — Sélection artisans */}
        <section className="py-11 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
                <Star className="h-4 w-4 text-white fill-white" />
                <span className="text-sm font-medium text-white">Top artisans</span>
              </div>
              <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
                La sélection Artisans Validés —
                <br className="hidden sm:block" />
                dossiers 100% vérifiés
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Chaque artisan a passé l'audit Andrea. Assurances, SIRET et avis clients contrôlés par notre équipe.
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

        {/* SECTION 8 — Témoignages */}
        <TestimonialsSection />

        {/* SECTION 9 — Double CTA final */}
        <DoubleCTAFinal />
      </main>

      <SocialProofToast />
      {/* Spacer for fixed bottom toast */}
      <div className="h-10" />
      <Footer />
    </div>
  );
};

export default Index;
