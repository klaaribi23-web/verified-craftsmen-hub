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
    <section className="relative min-h-screen flex items-center pt-32 lg:pt-20 overflow-hidden">
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

            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white leading-tight mb-4 md:mb-6">
              Né dans le Nord pour devenir la norme.{" "}
              <span className="text-gradient-gold">Récupérez 100% de votre marge.</span>
            </h1>

            <p className="text-sm md:text-base text-gold/80 font-medium mb-3 max-w-xl mx-auto lg:mx-0">
              L'alliance de l'expertise métier et de la technologie exclusive pour protéger vos marges.
            </p>

            {/* Maillage Territorial */}
            <div className="flex flex-wrap gap-2 mb-4 justify-center lg:justify-start max-w-xl mx-auto lg:mx-0">
              {[
                { region: "Hauts-de-France", status: "Actif", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
                { region: "Île-de-France", status: "Ouverture", color: "bg-gold/20 text-gold border-gold/30" },
                { region: "Rhône-Alpes", status: "Sélection en cours", color: "bg-white/10 text-white/70 border-white/20" },
              ].map(({ region, status, color }) => (
                <span key={region} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${color}`}>
                  <span className={status === "Actif" ? "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" : "w-1.5 h-1.5 rounded-full bg-current opacity-50"} />
                  {region} — {status}
                </span>
              ))}
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 md:mb-8 border border-gold/20 max-w-xl mx-auto lg:mx-0 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <p className="text-sm text-gold font-semibold">Posez votre question à l'Expert</p>
              </div>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">
                Une question sur une norme, un matériau ou un devis ? Andrea vous répond instantanément.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const q = formData.get("question") as string;
                  if (q?.trim()) {
                    window.location.href = `/#expert-andrea?q=${encodeURIComponent(q.trim())}`;
                    const section = document.getElementById("expert-andrea");
                    if (section) section.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="flex gap-2"
              >
                <input name="question" type="text" placeholder="Ex : Comment vérifier une décennale ?"
                  className="flex-1 rounded-lg bg-white/10 border border-gold/20 text-white placeholder:text-white/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
              </form>
            </div>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 md:gap-4 mb-4 md:mb-8">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base md:text-lg w-full sm:w-auto px-8 py-7 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-[1.03] active:scale-[0.98] animate-pulse hover:animate-none" asChild>
                <Link to="/devenir-artisan">
                  VÉRIFIER MA DISPONIBILITÉ
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20 md:text-base" asChild>
                <Link to="/trouver-artisan">Voir les Artisans</Link>
              </Button>
            </div>

            <p className="text-sm md:text-base text-white/70 mb-8 md:mb-10 leading-snug">
              <CheckCircle2 className="w-4 h-4 text-gold inline mr-1.5 -mt-0.5 shrink-0" />
              L'élite de la région : <span className="text-gold font-bold">+{displayCount > 200 ? displayCount : 1000} Artisans Validés</span>
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
                    { label: "Audits", value: "500+/mois" },
                    { label: "Artisans", value: "Triés" },
                    { label: "Réponse", value: "< 30s" },
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
