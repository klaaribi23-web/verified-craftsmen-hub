import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrenchPhoneInput, validateFrenchPhone } from "@/components/ui/french-phone-input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
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
  UserCheck
} from "lucide-react";

const benefits = [
  {
    icon: UserCheck,
    title: "Sélection sur dossier",
    description: "Nous étudions chaque candidature individuellement. Seuls les meilleurs profils sont retenus.",
  },
  {
    icon: BadgeCheck,
    title: "Badge Artisan Validé",
    description: "Notre équipe vérifie vos documents, votre SIRET et vos assurances avant validation.",
  },
  {
    icon: TrendingUp,
    title: "Chantiers qualifiés garantis",
    description: "Nous vous transmettons uniquement des demandes sérieuses et pré-qualifiées par nos soins.",
  },
  {
    icon: Star,
    title: "Exclusivité géographique",
    description: "Nombre limité d'artisans par zone pour vous garantir un volume de chantiers suffisant.",
  },
  {
    icon: Zap,
    title: "Accompagnement dédié",
    description: "Un interlocuteur unique vous guide dans l'optimisation de votre profil et vos performances.",
  },
  {
    icon: Clock,
    title: "Zéro prospection",
    description: "Nous faisons le travail commercial pour vous. Concentrez-vous sur votre métier.",
  },
];

const stats = [
  { value: "200+", label: "Artisans sélectionnés" },
  { value: "98%", label: "Taux de satisfaction" },
  { value: "3 à 5", label: "RDV/mois en moyenne" },
  { value: "48h", label: "Délai de réponse" },
];

// Validation schema - simplified for candidacy
const candidacySchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis (min 2 caractères)").max(100, "Nom trop long"),
  phone: z.string().trim().refine(
    (val) => validateFrenchPhone(val),
    { message: "Numéro français invalide (10 chiffres commençant par 0)" }
  ),
  city: z.string().trim().min(2, "Ville requise").max(100, "Ville trop longue"),
});

const DevenirArtisan = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [candidacySent, setCandidacySent] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    city: "",
  });

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
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

      if (!selectedCategoryId) {
        toast({
          title: "Métier requis",
          description: "Veuillez sélectionner votre métier principal",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Simulate sending candidacy (fake data mode - no Supabase)
      await new Promise(resolve => setTimeout(resolve, 1500));

      setCandidacySent(true);
      toast({
        title: "Candidature envoyée !",
        description: "Notre équipe va étudier votre dossier et vous recontacter sous 48h.",
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

  // Candidacy sent confirmation screen
  if (candidacySent) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Candidature envoyée"
          description="Votre candidature au réseau Artisans Validés a bien été reçue."
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
                <UserCheck className="w-8 h-8 text-primary" />
              </div>
              
              {/* Green success banner */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <p className="font-medium">
                    Candidature bien reçue !
                  </p>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300 mt-2 ml-7">
                  Notre équipe de sélection va étudier votre profil avec attention.
                </p>
              </div>
              
              <h1 className="text-2xl font-bold text-foreground mb-4">
                Nous vous recontactons sous 48h
              </h1>
              <p className="text-muted-foreground mb-6">
                Un membre de notre équipe vous appellera au <strong className="text-foreground">{formData.phone}</strong> pour finaliser votre dossier.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Processus de sélection :</strong> Nous vérifions manuellement chaque candidature (SIRET, assurances, références) avant d'intégrer un artisan à notre réseau.
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
        title="Candidater au réseau Artisans Validés"
        description="Rejoignez un réseau exclusif d'artisans triés sur le volet. Nous vérifions et validons chaque profil pour garantir l'excellence."
        canonical="https://artisansvalides.fr/devenir-artisan"
      />
      <Navbar />
      
      <main className="pt-32 lg:pt-20">
        {/* Hero */}
        <section className="bg-navy py-20 lg:py-32 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
                  <Shield className="w-4 h-4 text-gold" />
                  <span className="text-sm font-medium text-gold">
                    Réseau sélectif — Places limitées
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                  Candidatez au réseau{" "}
                  <span className="text-gradient-gold">Artisans Validés</span>
                </h1>

                <p className="text-lg text-white/70 mb-8">
                  Nous sélectionnons, vérifions et validons chaque artisan de notre réseau. 
                  Pas d'inscription libre : seuls les profils approuvés par notre équipe sont intégrés.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  {["Sélection sur dossier", "Vérification manuelle", "Exclusivité par zone"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-white">
                      <CheckCircle2 className="w-5 h-5 text-gold" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {stats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-bold text-gold">{stat.value}</div>
                      <div className="text-sm text-white/60">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="bg-white rounded-2xl p-8 shadow-floating">
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-navy mb-2">
                      Candidater au réseau
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Remplissez ce formulaire, nous vous recontactons sous 48h
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="text-navy">Nom complet *</Label>
                      <Input
                        id="fullName"
                        placeholder="Jean Dupont"
                        value={formData.fullName}
                        onChange={(e) => updateForm("fullName", e.target.value)}
                        className="mt-1.5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-navy">Téléphone *</Label>
                      <div className="mt-1.5">
                        <FrenchPhoneInput
                          id="phone"
                          value={formData.phone}
                          onChange={(value) => updateForm("phone", value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="city" className="text-navy">Ville d'intervention *</Label>
                      <div className="mt-1.5">
                        <CityAutocompleteAPI
                          value={formData.city}
                          onChange={(value) => updateForm("city", value)}
                          placeholder="Tapez votre ville..."
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-navy">Métier principal *</Label>
                      <div className="mt-1.5">
                        <CategorySelect
                          value={selectedCategoryId}
                          onValueChange={(id) => setSelectedCategoryId(id)}
                          placeholder="Sélectionnez votre métier..."
                          allowParentSelection={false}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      variant="gold" 
                      size="lg" 
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : null}
                      Envoyer ma candidature
                      {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      En candidatant, vous acceptez nos{" "}
                      <Link to="/cgu" className="text-gold hover:underline">CGU</Link>
                      {" "}et notre{" "}
                      <Link to="/confidentialite" className="text-gold hover:underline">
                        politique de confidentialité
                      </Link>
                    </p>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
                Un réseau exclusif
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Pourquoi candidater chez Artisans Validés ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Nous ne sommes pas un annuaire. Nous sélectionnons et accompagnons chaque artisan.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-muted rounded-2xl p-8"
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
        <section className="py-20 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
                Processus de sélection
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Comment rejoindre le réseau ?
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Candidature", desc: "Remplissez le formulaire en 1 minute" },
                { step: "02", title: "Entretien", desc: "Notre équipe vous appelle sous 48h" },
                { step: "03", title: "Vérification", desc: "Nous contrôlons SIRET, assurances et références" },
                { step: "04", title: "Intégration", desc: "Profil validé, vous recevez vos premiers chantiers" },
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
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-navy rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                  Rejoignez un réseau d'excellence
                </h2>
                <p className="text-white/70 mb-8 max-w-xl mx-auto">
                  Nous sélectionnons les meilleurs artisans de chaque zone. 
                  Les places sont limitées, candidatez dès maintenant.
                </p>
                <Button variant="gold" size="xl" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Candidater maintenant
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
