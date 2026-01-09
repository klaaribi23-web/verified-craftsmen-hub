import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, CheckCircle2, Star, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import heroBackground from "@/assets/hero-artisan-bg.jpg";
const HeroSection = () => {
  const stats = [{
    value: "5000+",
    label: "Artisans vérifiés"
  }, {
    value: "50K+",
    label: "Projets réalisés"
  }, {
    value: "4.8/5",
    label: "Note moyenne"
  }];
  const badges = ["Vérification SIRET", "Assurances validées", "Avis certifiés"];
  return <section className="relative min-h-screen flex items-center pt-32 lg:pt-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroBackground} alt="Artisan professionnel qualifié au travail sur un chantier" width={1920} height={1080} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/70" />
      </div>
      <div className="absolute top-20 right-0 w-1/2 h-full opacity-10">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_hsl(var(--gold))_0%,_transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.6
        }}>
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
              <Shield className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-white">
                La référence qualité en France
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Trouvez l'artisan{" "}
              <span className="text-gradient-gold">parfait</span> pour vos
              travaux
            </h1>

            <p className="text-lg text-white/80 mb-8 max-w-xl">
              Connectez-vous avec des artisans vérifiés, qualifiés et proches de
              chez vous. Devis gratuit, avis certifiés, tranquillité d'esprit
              garantie.
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-3 mb-8">
              {badges.map(badge => <div key={badge} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-white">{badge}</span>
                </div>)}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Button variant="hero" size="xl" asChild>
                <Link to="/demande-devis">
                  Déposer une annonce     
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="bg-white text-primary border-white hover:bg-white/90" asChild>
                <Link to="/devenir-artisan">Je suis artisan</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 flex items-center justify-center gap-[50px]">
              {stats.map((stat, index) => <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-white/70">{stat.label}</div>
                </div>)}
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div initial={{
          opacity: 0,
          x: 20
        }} animate={{
          opacity: 1,
          x: 0
        }} transition={{
          duration: 0.6,
          delay: 0.2
        }} className="relative hidden lg:block">
            {/* Main Card */}
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
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
                      <span className="text-sm text-muted-foreground ml-1">(127 avis)</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {["Expérience", "Tarif/h", "Délai"].map((label, i) => <div key={label} className="text-center p-3 rounded-lg bg-muted">
                      <div className="text-sm text-muted-foreground">{label}</div>
                      <div className="font-semibold text-navy">
                        {i === 0 ? "15 ans" : i === 1 ? "45€" : "24h"}
                      </div>
                    </div>)}
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-success/10 text-success text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    SIRET vérifié
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-success/10 text-success text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Assuré RC Pro
                  </div>
                </div>

                <Button variant="gold" className="w-full">
                  Demander un devis
                </Button>
              </div>

              {/* Floating Elements */}
              <motion.div animate={{
              y: [0, -10, 0]
            }} transition={{
              duration: 3,
              repeat: Infinity
            }} className="absolute -top-4 -right-4 bg-white rounded-xl shadow-elevated p-4 border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-navy">Artisan validé</div>
                    <div className="text-xs text-muted-foreground">Profil vérifié</div>
                  </div>
                </div>
              </motion.div>

              <motion.div animate={{
              y: [0, 10, 0]
            }} transition={{
              duration: 3.5,
              repeat: Infinity
            }} className="absolute -bottom-6 -left-6 bg-gradient-gold rounded-xl shadow-gold p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-navy-dark">98%</div>
                  <div className="text-sm text-navy-dark/80">
                    de clients<br />satisfaits
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>;
};
export default HeroSection;