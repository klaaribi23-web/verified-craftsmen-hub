import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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
  firstName: z.string().trim().min(2, "Prénom requis (min 2 caractères)").max(50, "Prénom trop long"),
  lastName: z.string().trim().min(2, "Nom requis (min 2 caractères)").max(50, "Nom trop long"),
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  phone: z.string().trim().min(10, "Numéro de téléphone invalide").max(20, "Numéro trop long"),
  profession: z.string().trim().min(2, "Métier requis").max(100, "Métier trop long"),
  city: z.string().trim().min(2, "Ville requise").max(100, "Ville trop longue"),
});

const DevenirArtisan = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const claimSlug = searchParams.get('claim');
  const [isLoading, setIsLoading] = useState(false);
  const [claimArtisan, setClaimArtisan] = useState<{ id: string; email: string | null; business_name: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profession: "",
    city: "",
    password: "",
  });

  // Fetch artisan data if claiming
  useEffect(() => {
    const fetchClaimArtisan = async () => {
      if (!claimSlug) return;
      
      const { data, error } = await supabase
        .from('artisans')
        .select('id, email, business_name')
        .eq('slug', claimSlug)
        .eq('status', 'prospect')
        .maybeSingle();
      
      if (!error && data) {
        setClaimArtisan(data);
        if (data.email) {
          setFormData(prev => ({ ...prev, email: data.email || '' }));
        }
      }
    };
    
    fetchClaimArtisan();
  }, [claimSlug]);

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

        // If claiming, store the claim slug for AuthCallback to handle
        if (claimSlug) {
          localStorage.setItem('artisan_claim_slug', claimSlug);
        }

        // Wait for profile to be created by trigger
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", data.user.id)
          .single();

        if (profile) {
          // Only create new artisan profile if NOT claiming an existing one
          if (!claimSlug) {
            // Create minimal artisan profile
            const { error: artisanError } = await supabase
              .from("artisans")
              .insert([{
                user_id: data.user.id,
                profile_id: profile.id,
                business_name: "Non renseigné",
                city: formData.city || "Non renseigné",
                status: "pending",
                description: null,
                photo_url: null,
                portfolio_images: null,
                portfolio_videos: null,
                experience_years: 0,
                rating: 0,
                review_count: 0,
                missions_completed: 0,
                availability: {},
              }]);

            if (artisanError) {
              console.error("Error creating artisan:", artisanError);
            }
          }

          // Update profile with phone and city
          await supabase
            .from("profiles")
            .update({ phone: formData.phone, city: formData.city })
            .eq("id", profile.id);
        }

        // Show confirmation message - email link will be sent by Supabase
        toast({
          title: "Email de confirmation envoyé",
          description: "Veuillez cliquer sur le lien dans l'email pour activer votre compte.",
        });
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
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
                  {claimArtisan && (
                    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-medium text-amber-800 mb-1">
                        Vous revendiquez la fiche :
                      </p>
                      <p className="text-lg font-bold text-amber-900">
                        {claimArtisan.business_name}
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Créez votre compte pour gérer cette fiche.
                      </p>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-navy mb-2">
                      {claimSlug ? "Revendiquer ma fiche" : "Créer mon compte artisan"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {claimSlug ? "Finalisez votre inscription" : "Inscription rapide en 2 minutes"}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
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
                      <Label htmlFor="phone" className="text-navy">Téléphone *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="06 12 34 56 78"
                        value={formData.phone}
                        onChange={(e) => updateForm("phone", e.target.value)}
                        className="mt-1.5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="profession" className="text-navy">Métier principal *</Label>
                      <Input
                        id="profession"
                        placeholder="Plombier, Électricien, Peintre..."
                        value={formData.profession}
                        onChange={(e) => updateForm("profession", e.target.value)}
                        className="mt-1.5"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="city" className="text-navy">Ville d'intervention *</Label>
                      <Input
                        id="city"
                        placeholder="Paris, Lyon, Marseille..."
                        value={formData.city}
                        onChange={(e) => updateForm("city", e.target.value)}
                        className="mt-1.5"
                        required
                      />
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