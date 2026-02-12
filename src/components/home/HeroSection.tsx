import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, CheckCircle2, ArrowRight, Camera, MessageSquare, UserCheck, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import heroBackground from "@/assets/hero-artisan-bg.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
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
    <section className="relative min-h-screen flex items-center pt-24 md:pt-32 lg:pt-20 overflow-hidden overflow-x-hidden">
      <div className="absolute inset-0">
        <img src={heroBackground} alt="Artisan professionnel qualifié au travail" width={1920} height={1080} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/70" />
      </div>
      <div className="absolute top-20 right-0 w-1/2 h-full opacity-10">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_hsl(var(--gold))_0%,_transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gold/20 border border-gold/30 mb-4 md:mb-6">
              <Shield className="w-3 h-3 md:w-4 md:h-4 text-gold" />
              <span className="text-xs md:text-sm font-medium text-white">Votre anonymat garanti jusqu'au dernier moment</span>
            </div>

            <h1 className="text-[1.55rem] leading-[1.25] md:text-4xl lg:text-5xl font-bold text-white md:leading-tight mb-4 md:mb-6">
              Ne confiez plus vos travaux au hasard.{" "}
              <span className="text-gradient-gold">Accédez à l'élite des artisans audités.</span>
            </h1>

            {/* Double-cible messaging */}
            <div className="space-y-3 mb-6 md:mb-8 max-w-xl mx-auto lg:mx-0">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <p className="text-sm md:text-base text-white/90 leading-snug">
                  <span className="text-white font-semibold">Particuliers :</span> Trouvez l'artisan audité sur le terrain qui réalisera vos travaux en toute sérénité.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                <p className="text-sm md:text-base text-white/90 leading-snug">
                  <span className="text-white font-semibold">Artisans :</span> Reprenez le contrôle de votre activité. Intégrez un réseau d'élite sans intermédiaire ni commission sur vos devis.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 md:gap-4 mb-4 md:mb-6">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base md:text-lg w-full sm:w-auto px-8 py-7 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-[1.03] active:scale-[0.98] min-h-[56px] relative overflow-hidden group" asChild>
                <Link to="/trouver-artisan">
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  Trouver un artisan audité
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <div className="text-center sm:text-left">
                <Button variant="outline-gold" size="lg" className="w-full sm:w-auto md:text-base" asChild>
                  <Link to="/devenir-artisan">
                    Rejoindre le réseau
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <p className="text-[10px] text-white/40 mt-1.5 italic">⚠️ Places limitées par département pour garantir la qualité.</p>
              </div>
            </div>

            <p className="text-sm text-white/70 mb-3 md:mb-4 leading-snug">
              <Shield className="w-4 h-4 text-gold inline mr-1.5 -mt-0.5 shrink-0" />
              Déjà <span className="text-gold font-bold">{displayCount > 40 ? displayCount : 44} artisans validés et audités</span> dans le Nord et l'Île-de-France.
            </p>
            <p className="text-xs text-white/50 mb-8 md:mb-10 leading-snug italic">
              Le seul réseau national qui protège vos données : zéro harcèlement, juste l'excellence.
            </p>

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

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative hidden lg:block">
            <div className="relative">
              <div className="bg-navy rounded-2xl shadow-floating p-8 border border-gold/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-navy-dark" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Andrea : Ton Assistante de Choc</h3>
                </div>
                <p className="text-white/80 text-base leading-relaxed mb-6">
                  Mon expertise est née sur les chantiers des Hauts-de-France. Aujourd'hui, je l'utilise pour valider les meilleurs pros de chaque département français.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Audits rigoureux", value: "+500/mois" },
                    { label: "Sélection d'élite", value: "10% validés" },
                    { label: "Mise en relation", value: "< 24h" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-xs text-white/50">{label}</div>
                      <div className="font-semibold text-gold text-sm">{value}</div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/60 text-center">
                  💬 Cliquez sur l'icône Andrea en bas à droite pour démarrer
                </p>
              </div>
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-4 -right-4 bg-white rounded-xl shadow-elevated p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-navy">IA de confiance</div>
                    <div className="text-xs text-muted-foreground">20 ans d'expertise terrain</div>
                  </div>
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
