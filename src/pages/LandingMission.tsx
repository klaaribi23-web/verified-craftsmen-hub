import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Shield, Lock, LogIn, UserPlus, MapPin, Euro, Clock } from "lucide-react";

const LandingMission = () => {
  const [searchParams] = useSearchParams();
  const title = searchParams.get("titre") || "Mission qualifiée";
  const city = searchParams.get("ville") || "";
  const budget = searchParams.get("budget") || "";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${title} — Accès réservé`}
        description="Cette opportunité est réservée aux artisans certifiés du réseau Artisans Validés."
      />
      <Navbar />

      <main className="pb-20">
        <div className="container mx-auto px-4 max-w-xl">
          {/* Mission title visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 mb-4">
              <Clock className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold">Publiée récemment</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{title}</h1>
            <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
              {city && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> {city}
                </span>
              )}
              {budget && (
                <span className="flex items-center gap-1">
                  <Euro className="w-4 h-4" /> {budget}
                </span>
              )}
            </div>
          </motion.div>

          {/* Blurred details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-xl border border-border bg-card p-6 mb-8 overflow-hidden"
          >
            <div className="blur-[6px] select-none pointer-events-none space-y-3">
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
              <div className="h-4 bg-muted-foreground/20 rounded w-full" />
              <div className="h-4 bg-muted-foreground/20 rounded w-5/6" />
              <div className="h-4 bg-muted-foreground/20 rounded w-2/3" />
              <div className="mt-4 h-4 bg-muted-foreground/20 rounded w-1/2" />
              <div className="h-4 bg-muted-foreground/20 rounded w-4/5" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-card" />
          </motion.div>

          {/* AV Badge block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-primary rounded-2xl p-8 text-center mb-8"
          >
            <div className="w-16 h-16 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-5">
              <Shield className="w-8 h-8 text-gold" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-xs font-bold text-gold mb-4">
              AV CERTIFIÉ
            </div>
            <p className="text-primary-foreground text-base leading-relaxed max-w-sm mx-auto">
              Cette opportunité est <strong className="text-gold">réservée aux artisans certifiés</strong>. Pour garantir la qualité, nous limitons les accès par secteur.
            </p>
          </motion.div>

          {/* Two CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <Link
              to={`/devenir-partenaire?mission=${encodeURIComponent(title)}&ville=${encodeURIComponent(city)}`}
              className="block"
            >
              <Button variant="gold" size="lg" className="w-full gap-2 !py-6 !text-base !font-bold">
                <Lock className="w-5 h-5" />
                Débloquer maintenant
              </Button>
            </Link>
            <Link to="/auth" className="block">
              <Button variant="outline" size="lg" className="w-full gap-2 !py-5">
                <LogIn className="w-5 h-5" />
                Déjà membre ? Se connecter
              </Button>
            </Link>

            <p className="text-center text-xs text-muted-foreground mt-4">
              <Lock className="w-3 h-3 inline mr-1" />
              Accès limité à 2 artisans par métier et par ville
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LandingMission;
