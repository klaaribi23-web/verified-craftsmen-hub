import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrenchPhoneInput, validateFrenchPhone } from "@/components/ui/french-phone-input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { 
  ArrowRight, 
  Shield, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  BadgeCheck,
  Star,
  Zap,
  Clock,
  Loader2,
  UserCheck,
  Lock,
  Crown,
  Check,
  Phone
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";


const benefits = [
  {
    icon: Lock,
    title: "2 places max par ville",
    description: "On verrouille votre secteur. Pas 10 artisans, pas 5. Deux. Point.",
  },
  {
    icon: BadgeCheck,
    title: "Profil géré par nos soins",
    description: "On s'occupe de tout : photos, textes, mise en avant. Vous, vous bossez.",
  },
  {
    icon: TrendingUp,
    title: "Appels directs",
    description: "Les clients vous appellent directement. Pas de plateforme entre vous et le chantier.",
  },
  {
    icon: Shield,
    title: "0% commission",
    description: "Pas de commission sur vos devis, pas de frais cachés. Un abonnement fixe, c'est tout.",
  },
  {
    icon: Zap,
    title: "Zéro prospection",
    description: "On fait le travail commercial pour vous. Concentrez-vous sur votre métier.",
  },
  {
    icon: Clock,
    title: "On vous rappelle sous 2h",
    description: "Pas de robot, pas de spam. Un humain qui vérifie votre dossier.",
  },
];

const stats = [
  { value: "2 max", label: "Artisans par ville" },
  { value: "0%", label: "Commission" },
  { value: "3 à 5", label: "RDV/mois en moyenne" },
  { value: "2h", label: "Délai de rappel" },
];

// Validation schema
const candidacySchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis (min 2 caractères)").max(100, "Nom trop long"),
  phone: z.string().trim().refine(
    (val) => validateFrenchPhone(val),
    { message: "Numéro français invalide (10 chiffres commençant par 0)" }
  ),
  city: z.string().trim().min(2, "Ville requise").max(100, "Ville trop longue"),
  metier: z.string().trim().min(2, "Métier requis").max(100, "Métier trop long"),
});

const DevenirArtisan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [candidacySent, setCandidacySent] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "",
    metier: "",
  });

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validationResult = candidacySchema.safeParse(formData);
      
      if (!validationResult.success) {
        const firstError = validationResult.error.errors[0];
        toast({
          title: "Erreur de validation",
          description: firstError.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Save to partner_candidacies table (admin-exclusive dashboard)
      const { error: dbError } = await supabase
        .from("partner_candidacies")
        .insert({
          business_name: formData.fullName,
          siret: "00000000000000", // Will be verified during callback
          metier: formData.metier,
          city: formData.city,
          phone: formData.phone,
        });

      if (dbError) throw dbError;

      setCandidacySent(true);
      toast({
        title: "Demande reçue !",
        description: "Nous vérifions la disponibilité dans votre secteur. Un expert vous rappelle sous 2h.",
      });
    } catch (error: any) {
      console.error("Candidacy error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation screen
  if (candidacySent) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Demande reçue — Artisans Validés"
          description="Votre demande d'accès au réseau Artisans Validés a bien été reçue."
        />
        <Navbar />
        <main className="pt-32 lg:pt-20 pb-20">
          <div className="container mx-auto px-4 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-8 shadow-floating text-center"
            >
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 text-left">
                 <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                   <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                   <p className="font-medium">Demande d'accès reçue !</p>
                 </div>
              </div>
              
              <h1 className="text-2xl font-bold text-foreground mb-4">
                On vous rappelle sous 2h
              </h1>
              <p className="text-muted-foreground mb-6">
                Un membre de notre équipe va vous appeler au <strong className="text-foreground">{formData.phone}</strong> pour vérifier la disponibilité de votre secteur à <strong className="text-foreground">{formData.city}</strong>.
              </p>
              <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Pas de robot, pas de spam.</strong> C'est un humain qui étudie votre dossier et vérifie vos documents (SIRET, assurances, références).
                </p>
              </div>
              <Button
                variant="gold"
                onClick={() => window.location.href = "/"}
                className="w-full"
              >
                Retour à l'accueil
              </Button>
            </motion.div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Rejoindre l'Alliance — Artisans Validés"
        description="Arrêtez de payer pour des leads partagés. On verrouille votre ville, on vérifie vos assurances, vous signez les chantiers."
        canonical="https://artisansvalides.fr/devenir-artisan"
      />
      <Navbar />
      
      <main className="pt-20 lg:pt-20">
        {/* Hero + Form */}
        <section className="bg-navy py-8 md:py-16 lg:py-28 relative overflow-hidden">
          {/* Decorations hidden on mobile */}
          <div className="hidden md:block absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-5 lg:gap-12 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center lg:text-left"
              >
                <div className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-4 lg:mb-6">
                  <Lock className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-gold">
                    2 places max par ville — Vérifiez la disponibilité
                  </span>
                </div>

                <h1 className="text-xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 md:mb-6">
                  Arrêtez de payer pour des leads{" "}
                  <span className="text-gradient-gold">partagés avec 10 concurrents.</span>
                </h1>

                <p className="text-sm md:text-lg text-white/70 mb-4 md:mb-8 hidden md:block">
                  On verrouille votre ville. On vérifie vos assurances. On lance votre pub. 
                  Vous signez les chantiers. <strong className="text-white">Direct, sans intermédiaire.</strong>
                </p>

                {/* Stats — hidden on mobile */}
                <div className="hidden md:grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-xl md:text-2xl font-bold text-gold">{stat.value}</div>
                      <div className="text-xs md:text-sm text-white/60">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Form — Zero friction */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full"
              >
                <div className="bg-white rounded-2xl p-4 md:p-8 shadow-floating">
                  <div className="text-center mb-4 md:mb-6">
                    <h2 className="text-lg md:text-xl font-bold text-navy mb-1 md:mb-2">
                      Votre secteur est-il encore disponible ?
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">
                      Remplissez ce formulaire, on vous rappelle sous 2h
                    </p>
                    <p className="text-xs text-gold font-medium italic">
                      On ne cherche pas des dossiers parfaits, on cherche des artisans qui ont le goût du travail bien fait et qui respectent leurs clients.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 pb-16 md:pb-0">
                    <div>
                      <Label htmlFor="fullName" className="text-navy text-sm">Prénom / Nom *</Label>
                      <Input
                        id="fullName"
                        placeholder="Jean Dupont"
                        value={formData.fullName}
                        onChange={(e) => updateForm("fullName", e.target.value)}
                        className="mt-1 h-9 md:h-10"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-navy text-sm">Téléphone *</Label>
                      <div className="mt-1">
                        <FrenchPhoneInput
                          id="phone"
                          value={formData.phone}
                          onChange={(value) => updateForm("phone", value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="city" className="text-navy text-sm">Ville *</Label>
                      <Input
                        id="city"
                        placeholder="Ex: Lyon, Marseille, Bordeaux..."
                        value={formData.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        className="mt-1 h-9 md:h-10"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="metier" className="text-navy text-sm">Métier *</Label>
                      <Input
                        id="metier"
                        placeholder="Ex: Plombier, Électricien, Maçon..."
                        value={formData.metier}
                        onChange={(e) => updateForm("metier", e.target.value)}
                        className="mt-1 h-9 md:h-10"
                        required
                      />
                    </div>

                    {/* Desktop submit */}
                    <div className="hidden md:block">
                      <Button 
                        type="submit" 
                        variant="gold" 
                        size="lg" 
                        className="w-full !text-base md:!text-lg !py-6 !font-bold"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
                        {isLoading ? "Vérification..." : "JE VEUX ÊTRE VALIDÉ →"}
                      </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground pt-1 hidden md:block">
                      On vous rappelle sous 2h pour valider votre dossier. <br />
                      <strong>Pas de robot, pas de spam.</strong>
                    </p>
                  </form>

                  {/* Mobile sticky submit */}
                  <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border p-3 shadow-lg">
                    <Button 
                      type="button"
                      variant="gold" 
                      size="lg" 
                      className="w-full !text-sm !py-4 !font-bold"
                      disabled={isLoading}
                      onClick={(e) => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      {isLoading ? "Vérification..." : "JE VEUX ÊTRE VALIDÉ →"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bandeau Réassurance Humaine */}
        <section className="py-10 bg-muted/70 border-y border-border/50">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-gold" />
                </div>
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-gold" />
                </div>
              </div>
              <p className="text-base md:text-lg font-medium text-foreground mb-2">
                Ici, pas de plateforme robotisée. Un expert du bâtiment étudie votre demande et vous rappelle sous 2h pour valider votre exclusivité.
              </p>
              <p className="text-sm text-muted-foreground">
                Déjà plus de 50 artisans partenaires accompagnés cette année.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing — Le Deal */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
                Le deal
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Le seul réseau qui ne prend aucune commission sur votre travail.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Un prix fixe, pas de surprise. Vous gardez 100% de vos devis.
              </p>
            </motion.div>

            <div className="max-w-lg mx-auto">
              {/* Carte Exclusivité */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex justify-center mb-4">
                  <div className="bg-gradient-gold text-navy-dark px-6 py-2.5 rounded-full text-sm font-bold shadow-gold tracking-wide">
                    👑 ACCÈS RÉSEAU & EXCLUSIVITÉ
                  </div>
                </div>
                <Card className="flex flex-col h-full border-2 border-gold/70 hover:border-gold shadow-lg shadow-gold/10">
                  <CardHeader className="text-center pb-2 pt-8">
                    <p className="text-xs text-gold font-medium mb-4">
                      Vérifiez si votre secteur est encore libre.
                    </p>
                    <div className="flex justify-center mb-3">
                      <div className="p-3 rounded-full bg-gold/20">
                        <Crown className="w-10 h-10 text-gold" />
                      </div>
                    </div>
                    <div className="mb-1">
                      <span className="text-5xl font-bold text-navy">99€</span>
                      <span className="text-muted-foreground text-lg"> HT/mois</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Possibilité d'activer des campagnes de RDV garantis après validation de votre secteur.
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      ✅ Rentabilisé dès le premier petit chantier.
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-4">
                      {[
                        "2 places max par ville",
                        "Profil géré par nos soins",
                        "Appels directs des clients",
                        "0% commission sur vos devis",
                        "Priorité de référencement sur votre ville",
                      ].map((feature) => (
                        <li key={feature} className="flex items-center gap-3 text-base">
                          <Check className="w-5 h-5 flex-shrink-0 text-gold" />
                          <span className="font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="pt-4 mt-auto">
                    <Button
                      variant="gold"
                      size="lg"
                      className="w-full !text-base !font-bold !py-5"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      JE VEUX ÊTRE VALIDÉ
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16 lg:py-24 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
                Pourquoi nous ?
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                On fait le boulot commercial.<br />Vous faites le boulot terrain.
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl p-8"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-gold flex items-center justify-center mb-6 shadow-gold">
                    <benefit.icon className="w-7 h-7 text-navy-dark" />
                  </div>
                  <h3 className="text-xl font-semibold text-navy mb-3">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Comment ça marche ?
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Demander mon accès", desc: "Remplissez le formulaire en 30 secondes" },
                { step: "02", title: "Rappel sous 2h", desc: "On vous appelle pour vérifier votre secteur" },
                { step: "03", title: "Vérification", desc: "Audit humain (pas de validation automatique). On contrôle assurances décennales, références chantiers et avis clients." },
                { step: "04", title: "C'est parti", desc: "Votre profil est live, les clients vous appellent" },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-4 text-navy-dark font-bold text-xl shadow-gold">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-navy mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-20 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-navy rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Votre ville est peut-être encore disponible.
                </h2>
                <p className="text-white/70 mb-8 max-w-xl mx-auto">
                  2 places max par secteur. Quand c'est pris, c'est pris.
                </p>
                <Button variant="gold" size="xl" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  JE RÉSERVE MON SECTEUR
                  <ArrowRight className="w-5 h-5 ml-2" />
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

export default DevenirArtisan;
