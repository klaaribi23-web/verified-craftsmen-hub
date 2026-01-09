import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  FileText, 
  Users, 
  MessageSquare, 
  ThumbsUp,
  Shield,
  CheckCircle2,
  HelpCircle
} from "lucide-react";

const clientSteps = [
  {
    icon: FileText,
    title: "Décrivez votre projet",
    description: "Remplissez notre formulaire simple et détaillé. Ajoutez des photos pour aider les artisans à mieux comprendre vos besoins.",
  },
  {
    icon: Users,
    title: "Recevez des devis",
    description: "Notre algorithme sélectionne les artisans les plus adaptés. Vous recevez jusqu'à 5 devis sous 24h.",
  },
  {
    icon: MessageSquare,
    title: "Comparez et échangez",
    description: "Consultez les profils, les avis et les tarifs. Posez vos questions via notre messagerie sécurisée.",
  },
  {
    icon: ThumbsUp,
    title: "Choisissez et évaluez",
    description: "Sélectionnez l'artisan de votre choix. Après les travaux, laissez votre avis pour aider la communauté.",
  },
];

const artisanSteps = [
  {
    icon: FileText,
    title: "Créez votre profil",
    description: "Inscrivez-vous gratuitement et complétez votre profil professionnel avec vos compétences et réalisations.",
  },
  {
    icon: Shield,
    title: "Validation du profil",
    description: "Notre équipe vérifie vos documents (SIRET, assurances) pour vous attribuer le badge Artisan Validé.",
  },
  {
    icon: MessageSquare,
    title: "Recevez des demandes",
    description: "Vous êtes notifié dès qu'un client de votre zone recherche vos services. Répondez avec votre meilleur devis.",
  },
  {
    icon: ThumbsUp,
    title: "Développez votre activité",
    description: "Réalisez les travaux, collectez des avis positifs et augmentez votre visibilité sur la plateforme.",
  },
];

const faqs = [
  {
    question: "Le service est-il gratuit pour les particuliers ?",
    answer: "Oui, la demande de devis est 100% gratuite et sans engagement pour les particuliers. Vous ne payez que si vous décidez de faire appel à un artisan.",
  },
  {
    question: "Comment les artisans sont-ils vérifiés ?",
    answer: "Chaque artisan passe par un processus de vérification : contrôle du SIRET, des assurances (RC Pro, décennale), et de l'identité. Seuls les professionnels validés obtiennent notre badge de confiance.",
  },
  {
    question: "Combien de temps pour recevoir des devis ?",
    answer: "Nos artisans s'engagent à répondre sous 24h maximum. La plupart du temps, vous recevez vos premiers devis en quelques heures.",
  },
  {
    question: "Puis-je contacter directement les artisans ?",
    answer: "Oui, notre messagerie intégrée vous permet d'échanger directement avec les artisans pour poser vos questions et négocier les détails.",
  },
  {
    question: "Que se passe-t-il en cas de litige ?",
    answer: "Notre équipe support est là pour vous accompagner. En cas de problème, nous intervenons pour trouver une solution amiable entre le client et l'artisan.",
  },
];

const CommentCaMarche = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Comment ça marche"
        description="Découvrez le fonctionnement d'Artisans Validés : trouvez un artisan de confiance ou développez votre activité en quelques étapes simples."
        canonical="https://artisansvalides.fr/comment-ca-marche"
      />
      <Navbar />
      
      <main className="pt-32 lg:pt-20">
        {/* Hero */}
        <section className="py-16 lg:py-24 bg-gradient-hero">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
                Guide complet
              </span>
              <h1 className="text-4xl md:text-5xl font-bold text-navy mb-6">
                Comment fonctionne <span className="text-gradient-gold">Artisans Validés</span> ?
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Découvrez notre processus simple et sécurisé pour trouver 
                le meilleur artisan ou développer votre activité.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="gold" size="lg" asChild>
                  <Link to="/demande-devis">
                    Je cherche un artisan
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/devenir-artisan">Je suis artisan</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Client Steps */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
                Pour les particuliers
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Trouvez votre artisan en 4 étapes
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {clientSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {index < clientSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-border" />
                  )}
                  <div className="bg-muted rounded-2xl p-8 relative">
                    <div className="absolute -top-4 left-8 w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-navy-dark font-bold text-sm shadow-gold">
                      {index + 1}
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center mb-6 mt-2 shadow-soft">
                      <step.icon className="w-7 h-7 text-navy" />
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-3">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="gold" size="lg" asChild>
                <Link to="/demande-devis">
                  Commencer maintenant
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Artisan Steps */}
        <section className="py-20 bg-navy">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-medium mb-4">
                Pour les artisans
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Développez votre activité en 4 étapes
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {artisanSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center text-navy-dark font-bold text-sm shadow-gold mb-6">
                    {index + 1}
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                    <step.icon className="w-7 h-7 text-gold" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button variant="gold" size="lg" asChild>
                <Link to="/devenir-artisan">
                  Rejoindre le réseau
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Questions fréquentes
              </h2>
            </motion.div>

            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={faq.question}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-muted rounded-xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-navy mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground text-sm">{faq.answer}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-gradient-gold rounded-3xl p-8 lg:p-16 text-center">
              <h2 className="text-3xl lg:text-4xl font-bold text-navy-dark mb-4">
                Prêt à commencer ?
              </h2>
              <p className="text-navy-dark/70 mb-8 max-w-xl mx-auto">
                Trouvez le meilleur artisan pour vos travaux ou développez votre activité 
                avec Artisans Validés.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="default" size="lg" asChild>
                  <Link to="/demande-devis">
                    Demander un devis
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline-gold" size="lg" asChild>
                  <Link to="/devenir-artisan">Je suis artisan</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CommentCaMarche;
