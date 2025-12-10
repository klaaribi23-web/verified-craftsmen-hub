import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useCategories } from "@/hooks/useCategories";
import { 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2,
  Droplets,
  Zap,
  Flame,
  Paintbrush,
  Key,
  Construction,
  Hammer,
  Wrench,
  Upload,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  Lock,
  Loader2
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  "plomberie": Droplets,
  "electricite": Zap,
  "chauffage": Flame,
  "peinture": Paintbrush,
  "serrurerie": Key,
  "maconnerie": Construction,
  "menuiserie": Hammer,
  "autre": Wrench,
};

const defaultCategories = [
  { icon: Droplets, title: "Plomberie", id: "plomberie" },
  { icon: Zap, title: "Électricité", id: "electricite" },
  { icon: Flame, title: "Chauffage", id: "chauffage" },
  { icon: Paintbrush, title: "Peinture", id: "peinture" },
  { icon: Key, title: "Serrurerie", id: "serrurerie" },
  { icon: Construction, title: "Maçonnerie", id: "maconnerie" },
  { icon: Hammer, title: "Menuiserie", id: "menuiserie" },
  { icon: Wrench, title: "Autre", id: "autre" },
];

const urgencyOptions = [
  { id: "urgent", label: "Urgent (24-48h)", description: "Intervention rapide nécessaire" },
  { id: "week", label: "Cette semaine", description: "Dans les 7 prochains jours" },
  { id: "month", label: "Ce mois-ci", description: "Flexible sur le planning" },
  { id: "later", label: "Plus tard", description: "Je planifie à l'avance" },
];

// Validation schemas
const contactSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis").max(50, "Prénom trop long"),
  lastName: z.string().trim().min(2, "Nom requis").max(50, "Nom trop long"),
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  phone: z.string().trim().min(10, "Téléphone invalide").max(20, "Téléphone trop long"),
});

const DemandeDevis = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: dbCategories } = useCategories();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    categoryId: "",
    description: "",
    urgency: "",
    postalCode: "",
    city: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });

  const totalSteps = isAuthenticated ? 4 : 5; // 5 steps if not authenticated (includes password)

  // Pre-fill user data if authenticated
  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated && user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name, last_name, email, phone, city")
          .eq("user_id", user.id)
          .single();
        
        if (profile) {
          setFormData(prev => ({
            ...prev,
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            email: profile.email || user.email || "",
            phone: profile.phone || "",
            city: profile.city || "",
          }));
        }
      }
    };
    fetchUserData();
  }, [isAuthenticated, user]);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Validate contact info
      const validationResult = contactSchema.safeParse(formData);
      if (!validationResult.success) {
        toast({
          title: "Erreur de validation",
          description: validationResult.error.errors[0].message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      let profileId: string | null = null;

      // If not authenticated, create account first
      if (!isAuthenticated) {
        if (formData.password.length < 8) {
          toast({
            title: "Mot de passe trop court",
            description: "Le mot de passe doit contenir au moins 8 caractères",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/auth/callback`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              first_name: formData.firstName,
              last_name: formData.lastName,
              user_type: "client",
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // Check if user already exists
          if (authData.user.identities && authData.user.identities.length === 0) {
            toast({
              title: "Email déjà utilisé",
              description: "Cet email est déjà enregistré. Veuillez vous connecter.",
              variant: "destructive",
            });
            navigate("/auth");
            return;
          }

          // Wait for profile to be created by trigger
          await new Promise(resolve => setTimeout(resolve, 1500));

          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("user_id", authData.user.id)
            .single();

          if (profile) {
            profileId = profile.id;
            // Update profile with phone
            await supabase
              .from("profiles")
              .update({ phone: formData.phone, city: formData.city })
              .eq("id", profile.id);
          }
        }
      } else {
        // Get existing profile ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user?.id)
          .single();
        
        if (profile) {
          profileId = profile.id;
        }
      }

      if (!profileId) {
        throw new Error("Impossible de créer le profil utilisateur");
      }

      // Find category ID from database
      let categoryId = formData.categoryId;
      if (!categoryId && dbCategories) {
        const matchedCategory = dbCategories.find(c => 
          c.name.toLowerCase().includes(formData.category.toLowerCase())
        );
        if (matchedCategory) {
          categoryId = matchedCategory.id;
        }
      }

      // Create mission
      const { error: missionError } = await supabase
        .from("missions")
        .insert({
          client_id: profileId,
          title: `Demande ${formData.category || "de travaux"}`,
          description: formData.description,
          city: formData.city,
          category_id: categoryId || null,
          status: "pending"
        });

      if (missionError) throw missionError;

      // Success
      setStep(totalSteps + 1);
      toast({
        title: "Mission déposée !",
        description: "Votre demande a été envoyée aux artisans.",
      });

    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  // Map categories from DB or use defaults
  const categories = dbCategories?.filter(c => !c.parent_id).slice(0, 8).map(c => ({
    id: c.id,
    title: c.name,
    icon: categoryIcons[c.name.toLowerCase()] || Wrench,
  })) || defaultCategories;

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-10"
            >
              <h1 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                Demander un devis gratuit
              </h1>
              <p className="text-muted-foreground">
                Décrivez votre projet et recevez jusqu'à 5 devis d'artisans qualifiés
              </p>
            </motion.div>

            {/* Progress Bar */}
            {step <= totalSteps && (
              <div className="mb-10">
                <div className="flex justify-between mb-2">
                  {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                    <div
                      key={s}
                      className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                        s < step
                          ? "bg-success text-white"
                          : s === step
                          ? "bg-gold text-navy-dark shadow-gold"
                          : "bg-white text-muted-foreground border border-border"
                      }`}
                    >
                      {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-white rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}
                    className="h-full bg-gradient-gold"
                  />
                </div>
              </div>
            )}

            {/* Form Steps */}
            <div className="bg-white rounded-2xl shadow-soft border border-border p-8">
              <AnimatePresence mode="wait">
                {/* Step 1: Category Selection */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-xl font-semibold text-navy mb-6">
                      Quel type de travaux souhaitez-vous réaliser ?
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            updateForm("category", cat.title);
                            updateForm("categoryId", cat.id);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.category === cat.title
                              ? "border-gold bg-gold/10"
                              : "border-border hover:border-gold/50"
                          }`}
                        >
                          <cat.icon className={`w-8 h-8 mx-auto mb-2 ${
                            formData.category === cat.title ? "text-gold" : "text-muted-foreground"
                          }`} />
                          <span className={`text-sm font-medium ${
                            formData.category === cat.title ? "text-navy" : "text-muted-foreground"
                          }`}>
                            {cat.title}
                          </span>
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="gold"
                      size="lg"
                      onClick={handleNext}
                      disabled={!formData.category}
                      className="w-full"
                    >
                      Continuer
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Project Description */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-xl font-semibold text-navy mb-6">
                      Décrivez votre projet
                    </h2>
                    <div className="space-y-6 mb-8">
                      <div>
                        <Label htmlFor="description" className="text-navy mb-2 block">
                          Description des travaux *
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Décrivez en détail les travaux que vous souhaitez réaliser..."
                          value={formData.description}
                          onChange={(e) => updateForm("description", e.target.value)}
                          rows={5}
                          className="resize-none"
                        />
                      </div>

                      <div>
                        <Label className="text-navy mb-3 block">
                          Ajouter des photos (optionnel)
                        </Label>
                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-gold/50 transition-colors cursor-pointer">
                          <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">
                            Glissez vos photos ici ou cliquez pour sélectionner
                          </p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-navy mb-3 block">
                          <Calendar className="w-4 h-4 inline-block mr-2" />
                          Quand souhaitez-vous réaliser ces travaux ?
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                          {urgencyOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => updateForm("urgency", option.id)}
                              className={`p-4 rounded-xl border-2 text-left transition-all ${
                                formData.urgency === option.id
                                  ? "border-gold bg-gold/10"
                                  : "border-border hover:border-gold/50"
                              }`}
                            >
                              <div className={`font-medium ${
                                formData.urgency === option.id ? "text-navy" : "text-muted-foreground"
                              }`}>
                                {option.label}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {option.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" size="lg" onClick={handleBack} className="flex-1">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour
                      </Button>
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={handleNext}
                        disabled={!formData.description || !formData.urgency}
                        className="flex-1"
                      >
                        Continuer
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Location */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-xl font-semibold text-navy mb-6">
                      Où se situe le chantier ?
                    </h2>
                    <div className="space-y-6 mb-8">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="postalCode" className="text-navy mb-2 block">
                            <MapPin className="w-4 h-4 inline-block mr-2" />
                            Code postal *
                          </Label>
                          <Input
                            id="postalCode"
                            placeholder="75015"
                            value={formData.postalCode}
                            onChange={(e) => updateForm("postalCode", e.target.value)}
                            className="h-12"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city" className="text-navy mb-2 block">
                            Ville *
                          </Label>
                          <Input
                            id="city"
                            placeholder="Paris"
                            value={formData.city}
                            onChange={(e) => updateForm("city", e.target.value)}
                            className="h-12"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" size="lg" onClick={handleBack} className="flex-1">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour
                      </Button>
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={handleNext}
                        disabled={!formData.postalCode || !formData.city}
                        className="flex-1"
                      >
                        Continuer
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Contact Info */}
                {step === 4 && (
                  <motion.div
                    key="step4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-xl font-semibold text-navy mb-6">
                      Vos coordonnées
                    </h2>
                    <div className="space-y-6 mb-8">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-navy mb-2 block">
                            <User className="w-4 h-4 inline-block mr-2" />
                            Prénom *
                          </Label>
                          <Input
                            id="firstName"
                            placeholder="Jean"
                            value={formData.firstName}
                            onChange={(e) => updateForm("firstName", e.target.value)}
                            className="h-12"
                            disabled={isAuthenticated}
                          />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-navy mb-2 block">
                            Nom *
                          </Label>
                          <Input
                            id="lastName"
                            placeholder="Dupont"
                            value={formData.lastName}
                            onChange={(e) => updateForm("lastName", e.target.value)}
                            className="h-12"
                            disabled={isAuthenticated}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-navy mb-2 block">
                          <Mail className="w-4 h-4 inline-block mr-2" />
                          Email *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="jean.dupont@email.com"
                          value={formData.email}
                          onChange={(e) => updateForm("email", e.target.value)}
                          className="h-12"
                          disabled={isAuthenticated}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-navy mb-2 block">
                          <Phone className="w-4 h-4 inline-block mr-2" />
                          Téléphone *
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="06 12 34 56 78"
                          value={formData.phone}
                          onChange={(e) => updateForm("phone", e.target.value)}
                          className="h-12"
                        />
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted">
                        <Shield className="w-5 h-5 text-gold mt-0.5" />
                        <p className="text-sm text-muted-foreground">
                          Vos données sont protégées et ne seront transmises qu'aux artisans sélectionnés pour votre projet.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" size="lg" onClick={handleBack} className="flex-1">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour
                      </Button>
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={isAuthenticated ? handleSubmit : handleNext}
                        disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone || isLoading}
                        className="flex-1"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : null}
                        {isAuthenticated ? "Déposer ma mission" : "Continuer"}
                        {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Password (only for non-authenticated users) */}
                {step === 5 && !isAuthenticated && (
                  <motion.div
                    key="step5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h2 className="text-xl font-semibold text-navy mb-6">
                      Créez votre compte
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      Pour suivre votre demande et recevoir les devis des artisans, créez votre compte.
                    </p>
                    <div className="space-y-6 mb-8">
                      <div>
                        <Label htmlFor="password" className="text-navy mb-2 block">
                          <Lock className="w-4 h-4 inline-block mr-2" />
                          Mot de passe *
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={(e) => updateForm("password", e.target.value)}
                          className="h-12"
                          minLength={8}
                        />
                        <p className="text-xs text-muted-foreground mt-1">Minimum 8 caractères</p>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-xl bg-gold/10">
                        <CheckCircle2 className="w-5 h-5 text-gold mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-navy">Votre compte vous permettra de :</p>
                          <ul className="text-muted-foreground mt-1 space-y-1">
                            <li>• Suivre l'état de vos demandes</li>
                            <li>• Recevoir et comparer les devis</li>
                            <li>• Communiquer avec les artisans</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" size="lg" onClick={handleBack} className="flex-1">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Retour
                      </Button>
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!formData.password || formData.password.length < 8 || isLoading}
                        className="flex-1"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : null}
                        Créer mon compte et déposer
                        {!isLoading && <ArrowRight className="w-5 h-5 ml-2" />}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Success Step */}
                {step === totalSteps + 1 && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-navy mb-4">
                      Demande envoyée avec succès !
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Votre demande a été transmise aux artisans de votre secteur. 
                      Vous recevrez leurs devis sous 24h maximum.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="gold" onClick={() => navigate("/client/dashboard")}>
                        Accéder à mon tableau de bord
                      </Button>
                      <Button variant="outline" onClick={() => navigate("/trouver-artisan")}>
                        Parcourir les artisans
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DemandeDevis;