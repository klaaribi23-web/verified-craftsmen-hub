import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Shield, 
  TrendingUp, 
  Star,
  FileText,
  Users,
  Hammer,
  Phone,
  MessageCircle
} from "lucide-react";

const filterBlocks = [
  {
    icon: Shield,
    title: "Assurances Vérifiées",
    description: "On contrôle systématiquement la validité de la décennale et de la RC Pro. Vous êtes protégé.",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: TrendingUp,
    title: "Santé Financière",
    description: "On vérifie le SIRET et la solidité de l'entreprise. Pas d'artisans fantômes.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: Star,
    title: "Savoir-Faire Validé",
    description: "On contrôle les références et les avis réels. Seuls les pros avec un vrai historique restent dans le réseau.",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
];

const steps = [
  {
    icon: FileText,
    step: "01",
    title: "Déposez votre projet",
    description: "Décrivez vos travaux en quelques minutes via notre formulaire. C'est rapide, gratuit et sans engagement.",
  },
  {
    icon: Users,
    step: "02",
    title: "Mise en relation d'élite",
    description: "On vous présente l'artisan exclusif validé sur votre secteur. Pas de mise en concurrence à l'aveugle.",
  },
  {
    icon: Hammer,
    step: "03",
    title: "Travaux sereins",
    description: "Vous gérez votre chantier en direct avec l'artisan. Sans commission, sans frais cachés, sans intermédiaire.",
  },
];

const CommentCaMarche = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Comment ça marche"
        description="Découvrez comment Artisans Validés sélectionne et vérifie chaque artisan pour vous garantir des travaux en toute sérénité. Gratuit, direct, sécurisé."
        canonical="https://artisansvalides.fr/comment-ca-marche"
      />
      <Navbar />
      
      <main className="pt-32 lg:pt-20">
        {/* Hero — L'Engagement */}
        <section className="py-20 lg:py-28 bg-gradient-to-b from-blue-950 to-blue-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.04),transparent_70%)]" />
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Ne prenez plus de risques<br className="hidden md:block" /> pour vos travaux.
              </h1>
              <p className="text-lg md:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto leading-relaxed">
                Nous sélectionnons pour vous des artisans locaux dont nous avons 
                personnellement vérifié le dossier. Gratuit, direct, sécurisé.
              </p>
              <Button variant="gold" size="lg" asChild className="text-base px-8 py-6">
                <Link to="/demande-devis">
                  Décrire mon projet
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Le Filtre Artisans Validés */}
        <section className="py-20 lg:py-28 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-sm font-semibold tracking-widest uppercase text-blue-600 mb-3">
                Notre engagement
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Le Filtre Artisans Validés
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Chaque artisan du réseau passe par un contrôle rigoureux avant de pouvoir être mis en relation avec vous.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {filterBlocks.map((block, index) => (
                <motion.div
                  key={block.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12 }}
                  className={`rounded-2xl border ${block.border} ${block.bg} p-8 text-center`}
                >
                  <div className={`w-14 h-14 rounded-xl ${block.bg} flex items-center justify-center mx-auto mb-5 border ${block.border}`}>
                    <block.icon className={`w-7 h-7 ${block.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">
                    {block.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {block.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Le Processus en 3 Étapes */}
        <section className="py-20 lg:py-28 bg-muted/50">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <p className="text-sm font-semibold tracking-widest uppercase text-emerald-600 mb-3">
                Simple & rapide
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Comment ça se passe ?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Trois étapes pour des travaux en toute sérénité.
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-6">
              {steps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.12 }}
                  className="flex items-start gap-6 bg-white rounded-2xl p-6 md:p-8 border border-border shadow-sm"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <step.icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="gold" size="lg" asChild className="text-base px-8 py-6">
                <Link to="/demande-devis">
                  Décrire mon projet gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Bandeau Accompagnement */}
        <section className="py-14 bg-blue-950">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gold" />
                </div>
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-gold" />
                </div>
              </div>
              <div>
                <p className="text-white font-medium text-base md:text-lg">
                  Un doute ? Une question ?
                </p>
                <p className="text-blue-200/70 text-sm mt-1">
                  Nos experts vous accompagnent gratuitement dans le choix de votre artisan.
                </p>
              </div>
              <Button variant="outline" size="lg" asChild className="border-white/20 text-white hover:bg-white/10 ml-0 md:ml-4">
                <Link to="/contact">Nous contacter</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CommentCaMarche;
