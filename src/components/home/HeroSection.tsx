import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
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
    <section className="relative min-h-[85vh] flex items-center pt-24 md:pt-32 lg:pt-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary tracking-wide">Le réseau d'artisans audités sur le terrain</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 tracking-tight md:tracking-[-0.01em]">
            L'élite des artisans locaux,{" "}
            <span className="text-gradient-gold tracking-normal md:tracking-[0.02em]">validés pour tous vos projets.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Ne confiez plus vos travaux au hasard. Accédez à un réseau d'artisans certifiés, audités sur le terrain et sans harcèlement commercial.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base md:text-lg w-full sm:w-auto px-10 py-7 shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] min-h-[56px]"
              asChild
            >
              <Link to="/demande-devis">
                Trouver un artisan audité
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-2 border-navy text-navy hover:bg-navy/90 hover:text-white font-semibold text-base md:text-lg px-10 py-7 min-h-[56px] transition-all duration-300"
              asChild
            >
              <Link to="/devenir-artisan">
                Rejoindre le réseau
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-gold inline mr-1.5 -mt-0.5" />
            Déjà <span className="text-gold font-bold">{displayCount > 40 ? displayCount : 44} artisans validés</span> dans le Nord et l'Île-de-France.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
