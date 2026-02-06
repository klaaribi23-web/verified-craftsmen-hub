import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, CheckCircle2, Star, ArrowRight, Camera, MessageSquare, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import heroBackground from "@/assets/hero-artisan-bg.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  // Fetch real artisan count
  const { data: artisanCount } = useQuery({
    queryKey: ["artisan-count-hero"],
    queryFn: async () => {
      const { count } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      return count || 0;
    },
    staleTime: 60000,
  });

  const displayCount = artisanCount && artisanCount > 0 ? artisanCount : 200;

  return (
    <section className="relative min-h-screen flex items-center pt-32 lg:pt-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroBackground} alt="Artisan professionnel qualifié au travail" width={1920} height={1080} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/70" />
      </div>
      <div className="absolute top-20 right-0 w-1/2 h-full opacity-10">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_hsl(var(--gold))_0%,_transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          {/* Content */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center lg:text-left">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gold/20 border border-gold/30 mb-4 md:mb-6">
              <Shield className="w-3 h-3 md:w-4 md:h-4 text-gold" />
              <span className="text-xs md:text-sm font-medium text-white">
                Votre anonymat garanti jusqu'au dernier moment
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white leading-tight mb-4 md:mb-6">
              Trouvez l'artisan idéal,{" "}
              <span className="text-gradient-gold">votre anonymat en plus.</span>
            </h1>

            <p className="text-base md:text-lg text-white/80 mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0">
              Décrivez votre projet, recevez des devis, et ne partagez vos coordonnées que lorsque vous êtes prêt.
            </p>

            {/* Main CTA */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 md:gap-4 mb-6 md:mb-8">
              <Button
                size="lg"
                className="bg-gradient-gold text-white font-bold text-base md:text-lg px-8 py-6 shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-all"
                asChild
              >
                <Link to="/demande-devis">
                  Lancer mon projet
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20 md:text-base" asChild>
                <Link to="/trouver-artisan">Voir les Artisans</Link>
              </Button>
            </div>

            {/* Trust line */}
            <p className="text-sm md:text-base text-white/70 mb-8 md:mb-10">
              <CheckCircle2 className="w-4 h-4 text-gold inline mr-1.5 -mt-0.5" />
              Déjà <span className="text-gold font-bold">+{displayCount}</span> artisans validés et vérifiés par nos soins.
            </p>

            {/* How it works mini — 3 steps */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/20">
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                {[
                  { icon: Camera, label: "Décrivez votre besoin avec des photos" },
                  { icon: MessageSquare, label: "Discutez anonymement avec les artisans" },
                  { icon: UserCheck, label: "Choisissez votre pro et lancez les travaux" },
                ].map((step, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-2">
                      <step.icon className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                    </div>
                    <p className="text-xs md:text-sm text-white/80 leading-tight">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Visual Card — Desktop only */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative hidden lg:block">
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-floating p-6 border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-gold flex items-center justify-center">
                    <Shield className="w-8 h-8 text-navy-dark" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy">Jean-Pierre Martin</h3>
                    <p className="text-sm text-muted-foreground">Plombier · Paris 15</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                      ))}
                      <span className="text-sm text-muted-foreground ml-1">(127 avis)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  {["Expérience", "Tarif/h", "Délai"].map((label, i) => (
                    <div key={label} className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground">{label}</div>
                      <div className="font-semibold text-navy">
                        {i === 0 ? "15 ans" : i === 1 ? "45€" : "24h"}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-success/10 text-success text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    SIRET vérifié
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-success/10 text-success text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Assurance contrôlée
                  </div>
                </div>

                <Button variant="gold" className="w-full">Demander un devis</Button>
              </div>

              {/* Floating Elements */}
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-4 -right-4 bg-white rounded-xl shadow-elevated p-4 border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-navy">Validé par notre équipe</div>
                    <div className="text-xs text-muted-foreground">Profil contrôlé manuellement</div>
                  </div>
                </div>
              </motion.div>

              <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3.5, repeat: Infinity }} className="absolute -bottom-6 -left-6 bg-gradient-gold rounded-xl shadow-gold p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-navy-dark">98%</div>
                  <div className="text-sm text-navy-dark/80">de clients<br />satisfaits</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
