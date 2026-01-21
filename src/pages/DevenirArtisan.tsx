import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrenchPhoneInput, validateFrenchPhone } from "@/components/ui/french-phone-input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
  Loader2
} from "lucide-react";

const benefits = [
  {
    icon: Users,
    title: "Chantiers qualifiés",
    description: "Recevez des demandes de clients vérifiés, correspondant à vos compétences et votre zone.",
  },
  {
    icon: BadgeCheck,
    title: "Badge Artisan Validé",
    description: "Démarquez-vous avec notre badge de confiance qui rassure les clients.",
  },
  {
    icon: TrendingUp,
    title: "Développez votre activité",
    description: "Augmentez votre visibilité et votre chiffre d'affaires grâce à notre plateforme.",
  },
  {
    icon: Star,
    title: "Avis certifiés",
    description: "Collectez des avis authentiques qui valorisent la qualité de votre travail.",
  },
  {
    icon: Zap,
    title: "Interface simple",
    description: "Gérez vos demandes, devis et planning depuis un tableau de bord intuitif.",
  },
  {
    icon: Clock,
    title: "Gain de temps",
    description: "Fini le démarchage ! Les clients viennent directement à vous.",
  },
];

const stats = [
  { value: "5000+", label: "Artisans inscrits" },
  { value: "50K+", label: "Chantiers réalisés" },
  { value: "4.8/5", label: "Satisfaction client" },
  { value: "24h", label: "Délai de réponse" },
];

// Validation schema
const artisanSignupSchema = z.object({
  businessName: z.string().trim().min(2, "Nom d'entreprise requis (min 2 caractères)").max(100, "Nom d'entreprise trop long"),
  firstName: z.string().trim().min(2, "Prénom requis (min 2 caractères)").max(50, "Prénom trop long"),
  lastName: z.string().trim().min(2, "Nom requis (min 2 caractères)").max(50, "Nom trop long"),
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  phone: z.string().trim().refine(
    (val) => validateFrenchPhone(val),
    { message: "Numéro français invalide (10 chiffres commençant par 0)" }
  ),
  city: z.string().trim().min(2, "Ville requise").max(100, "Ville trop longue"),
});

const DevenirArtisan = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [formData, setFormData] = useState({
    businessName: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    password: "",
  });

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      const validationResult = artisanSignupSchema.safeParse(formData);
      
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

      // Check password
      if (formData.password.length < 8) {
        toast({
          title: "Mot de passe trop court",
          description: "Le mot de passe doit contenir au moins 8 caractères",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check categories
      if (!selectedCategoryId) {
        toast({
          title: "Métier requis",
          description: "Veuillez sélectionner votre métier principal",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            user_type: "artisan",
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        // Check if user already exists
        if (data.user.identities && data.user.identities.length === 0) {
          toast({
            title: "Email déjà utilisé",
            description: "Cet email est déjà enregistré. Veuillez vous connecter.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }

        // Wait for profile to be created by trigger
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .single();

        if (profile) {
          // Generate confirmation token
          const confirmationToken = crypto.randomUUID();

          // Create minimal artisan profile with primary category
          const { data: artisanData, error: artisanError } = await supabase
            .from("artisans")
            .insert([{
              user_id: data.user.id,
              profile_id: profile.id,
              business_name: formData.businessName,
              email: formData.email,
              city: formData.city || "Non renseigné",
              status: "pending",
              category_id: selectedCategoryId || null,
              description: null,
              photo_url: null,
              portfolio_images: null,
              portfolio_videos: null,
              experience_years: 0,
              rating: 0,
              review_count: 0,
              missions_completed: 0,
              source: "self_signup", // Artisan inscrit lui-même (pas import massif)
            }])
            .select("id")
            .single();

          if (artisanError) {
            console.error("Error creating artisan:", artisanError);
          } else if (artisanData && selectedCategoryId) {
            // Insert primary category into artisan_categories
            const { error: catError } = await supabase
              .from("artisan_categories")
              .insert([{
                artisan_id: artisanData.id,
                category_id: selectedCategoryId,
              }]);
            
            if (catError) {
              console.error("Error inserting category:", catError);
            }
          }

          // Update profile with phone, city, and confirmation token
          await supabase
            .from("profiles")
            .update({ 
              phone: formData.phone, 
              city: formData.city,
              email_confirmed: false,
              confirmation_token: confirmationToken,
              confirmation_sent_at: new Date().toISOString(),
            })
            .eq("id", profile.id);

          // Send custom branded confirmation email with correct URL
          try {
            await supabase.functions.invoke("send-confirmation-email", {
              body: {
                email: formData.email,
                firstName: formData.firstName,
                lastName: formData.lastName,
                userType: "artisan",
                confirmationUrl: `${window.location.origin}/confirmer-email?token=${confirmationToken}`,
              },
            });
          } catch (emailError) {
            console.error("Error sending custom email:", emailError);
          }

          // Sign out user to force email confirmation before login
          await supabase.auth.signOut();

          // Show confirmation screen
          setEmailSent(true);
          toast({
            title: "Email de confirmation envoyé",
            description: "Veuillez cliquer sur le lien dans l'email pour activer votre compte.",
          });
        }
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Erreur d'inscription",
        description: error.message === "User already registered" 
          ? "Cet email est déjà utilisé. Veuillez vous connecter."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Email confirmation sent screen
  if (emailSent) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Email de confirmation envoyé"
          description="Vérifiez votre boîte mail pour confirmer votre inscription."
        />
        <Navbar />
        <main className="pt-32 lg:pt-20 pb-20">
          <div className="container mx-auto px-4 max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 shadow-floating text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-navy mb-4">
                Email de confirmation envoyé !
              </h1>
              <p className="text-muted-foreground mb-6">
                Un email a été envoyé à <strong className="text-navy">{formData.email}</strong>. 
                Cliquez sur le lien dans l'email pour activer votre compte.
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>Pensez à vérifier vos spams</strong> si vous ne trouvez pas l'email dans votre boîte de réception.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/auth")}
                className="w-full"
              >
                Retour à la connexion
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
        title="Devenir artisan partenaire"
        description="Rejoignez le réseau Artisans Validés : recevez des chantiers qualifiés, développez votre activité et obtenez le badge de confiance."
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
                    Rejoignez le réseau de confiance
                  </span>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
                  Développez votre activité avec{" "}
                  <span className="text-gradient-gold">Artisans Validés</span>
                </h1>

                <p className="text-lg text-white/70 mb-8">
                  Recevez des demandes de chantiers qualifiés directement dans votre boîte mail. 
                  Inscription gratuite, sans engagement.
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  {["Inscription gratuite", "Sans commission", "Chantiers vérifiés"].map((item) => (
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
                      Créer mon compte artisan
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Inscription rapide en 2 minutes
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="businessName" className="text-navy">Nom de l'entreprise *</Label>
                      <Input
                        id="businessName"
                        placeholder="Dupont Plomberie"
                        value={formData.businessName}
                        onChange={(e) => updateForm("businessName", e.target.value)}
                        className="mt-1.5"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName" className="text-navy">Prénom *</Label>
                        <Input
                          id="firstName"
                          placeholder="Jean"
                          value={formData.firstName}
                          onChange={(e) => updateForm("firstName", e.target.value)}
                          className="mt-1.5"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-navy">Nom *</Label>
                        <Input
                          id="lastName"
                          placeholder="Dupont"
                          value={formData.lastName}
                          onChange={(e) => updateForm("lastName", e.target.value)}
                          className="mt-1.5"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-navy">Email professionnel *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@monentreprise.fr"
                        value={formData.email}
                        onChange={(e) => updateForm("email", e.target.value)}
                        className="mt-1.5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-navy">Mot de passe *</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => updateForm("password", e.target.value)}
                        className="mt-1.5"
                        required
                        minLength={8}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Minimum 8 caractères</p>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-navy">Téléphone * (format français)</Label>
                      <div className="mt-1.5">
                        <FrenchPhoneInput
                          id="phone"
                          value={formData.phone}
                          onChange={(value) => updateForm("phone", value)}
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
                      <p className="text-xs text-muted-foreground mt-1">
                        Vous pourrez ajouter des compétences secondaires dans votre tableau de bord
                      </p>
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
                      Créer mon compte gratuit
                      {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      En vous inscrivant, vous acceptez nos{" "}
                      <Link to="/cgu" className="text-gold hover:underline">CGU</Link>
                      {" "}et notre{" "}
                      <Link to="/confidentialite" className="text-gold hover:underline">
                        politique de confidentialité
                      </Link>
                    </p>

                    <div className="text-center pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground">
                        Déjà un compte ?{" "}
                        <Link to="/auth" className="text-gold hover:underline font-medium">
                          Se connecter
                        </Link>
                      </p>
                    </div>
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
                Vos avantages
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Pourquoi rejoindre Artisans Validés ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Des outils pensés pour vous aider à développer votre activité
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
                Processus simple
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Comment ça fonctionne ?
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Inscription", desc: "Créez votre compte en 2 minutes" },
                { step: "02", title: "Profil complet", desc: "Ajoutez vos infos et documents" },
                { step: "03", title: "Validation", desc: "Notre équipe vérifie votre profil" },
                { step: "04", title: "Chantiers", desc: "Recevez des demandes qualifiées" },
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
                  Prêt à développer votre activité ?
                </h2>
                <p className="text-white/70 mb-8 max-w-xl mx-auto">
                  Rejoignez plus de 5000 artisans qui font confiance à Artisans Validés 
                  pour développer leur clientèle.
                </p>
                <Button variant="gold" size="xl" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Commencer gratuitement
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
