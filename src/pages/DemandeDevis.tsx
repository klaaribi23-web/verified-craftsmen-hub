import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrenchPhoneInput, validateFrenchPhone } from "@/components/ui/french-phone-input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import MissionPhotoUpload from "@/components/missions/MissionPhotoUpload";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Shield,
  Lock,
  Loader2,
  Camera,
  Euro,
  Sparkles,
} from "lucide-react";

const RENOVATION_GLOBALE_ID = "b1000000-0000-0000-0000-000000000001";

const budgetOptions = [
  { id: "lt5k", label: "Moins de 5 000€", description: "Petits travaux, dépannage" },
  { id: "5k-15k", label: "5 000€ – 15 000€", description: "Rénovation partielle, cuisine, salle de bain" },
  { id: "15k-50k", label: "15 000€ – 50 000€", description: "Rénovation complète, extension" },
  { id: "gt50k", label: "Plus de 50 000€", description: "Gros œuvre, construction, rénovation totale" },
];

const timelineOptions = [
  { id: "immediate", label: "Immédiatement", icon: "⚡" },
  { id: "1-3months", label: "1 à 3 mois", icon: "📅" },
  { id: "3months+", label: "Plus de 3 mois", icon: "🗓️" },
];

const renovationSubOptions = [
  { id: "full_apartment", label: "Rénovation complète d'appartement" },
  { id: "single_room", label: "Une seule pièce" },
];

const contactSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis").max(50, "Prénom trop long"),
  lastName: z.string().trim().min(2, "Nom requis").max(50, "Nom trop long"),
  email: z.string().trim().email("Email invalide").max(255, "Email trop long"),
  phone: z.string().trim().refine(
    (val) => validateFrenchPhone(val),
    { message: "Numéro français invalide (10 chiffres commençant par 0)" }
  ),
});

const DemandeDevis = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { data: categoriesHierarchy, isLoading: categoriesLoading } = useCategoriesHierarchy();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    categoryId: "",
    parentCategoryId: "",
    renovationSubType: "",
    description: "",
    budget: "",
    timeline: "",
    postalCode: "",
    city: "",
    cityCoordinates: null as { lat: number; lng: number } | null,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    photos: [] as string[],
  });

  // No more password step — auto-create account with magic link
  const totalSteps = 4;

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

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (categoryId: string, parentId: string | null) => {
    let categoryName = "";
    if (categoriesHierarchy) {
      for (const parent of categoriesHierarchy) {
        if (parent.id === categoryId) { categoryName = parent.name; break; }
        const child = parent.children.find(c => c.id === categoryId);
        if (child) { categoryName = child.name; break; }
      }
    }
    setFormData(prev => ({
      ...prev,
      category: categoryName,
      categoryId,
      parentCategoryId: parentId || categoryId,
      renovationSubType: "",
    }));
  };

  const isRenovationGlobale = formData.parentCategoryId === RENOVATION_GLOBALE_ID;
  const isPrioritySector = formData.postalCode.startsWith("92");

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const validationResult = contactSchema.safeParse(formData);
      if (!validationResult.success) {
        toast({ title: "Erreur de validation", description: validationResult.error.errors[0].message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      if (!formData.budget) {
        toast({ title: "Budget requis", description: "Veuillez sélectionner une tranche de budget.", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      let profileId: string | null = null;

      if (!isAuthenticated) {
        // Auto-create account with a generated password (user gets magic link to set their own)
        const autoPassword = crypto.randomUUID().slice(0, 16) + "Aa1!";
        const redirectUrl = `${window.location.origin}/auth/callback`;
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: autoPassword,
          options: {
            emailRedirectTo: redirectUrl,
            data: { first_name: formData.firstName, last_name: formData.lastName, user_type: "client" },
          },
        });
        if (authError) throw authError;
        if (authData.user) {
          if (authData.user.identities && authData.user.identities.length === 0) {
            toast({ title: "Email déjà utilisé", description: "Cet email est déjà enregistré. Veuillez vous connecter.", variant: "destructive" });
            navigate("/auth");
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 1500));
          const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", authData.user.id).single();
          if (profile) {
            profileId = profile.id;
            await supabase.from("profiles").update({ phone: formData.phone, city: formData.city }).eq("id", profile.id);
          }
        }
      } else {
        const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user?.id).single();
        if (profile) profileId = profile.id;
      }

      if (!profileId) throw new Error("Impossible de créer le profil utilisateur");

      const budgetLabel = budgetOptions.find(b => b.id === formData.budget)?.label || formData.budget;
      const timelineLabel = timelineOptions.find(t => t.id === formData.timeline)?.label || formData.timeline;
      const renovSubLabel = renovationSubOptions.find(r => r.id === formData.renovationSubType)?.label || "";

      const fullDescription = [
        formData.description,
        `\n\n--- Infos structurées ---`,
        `Budget : ${budgetLabel}`,
        `Délai souhaité : ${timelineLabel}`,
        isRenovationGlobale && renovSubLabel ? `Type rénovation : ${renovSubLabel}` : null,
        `Code postal : ${formData.postalCode}`,
      ].filter(Boolean).join("\n");

      const missionInsert: any = {
          client_id: profileId,
          title: `Demande ${formData.category || "de travaux"}`,
          description: fullDescription,
          city: formData.city,
          category_id: formData.categoryId || null,
          status: "pending_approval",
          budget: formData.budget === "lt5k" ? 5000 : formData.budget === "5k-15k" ? 15000 : formData.budget === "15k-50k" ? 50000 : 100000,
          photos: formData.photos.length > 0 ? formData.photos : null,
        };
      if (formData.cityCoordinates) {
        missionInsert.latitude = formData.cityCoordinates.lat;
        missionInsert.longitude = formData.cityCoordinates.lng;
      }

      const { data: missionData, error: missionError } = await supabase
        .from("missions")
        .insert(missionInsert)
        .select("id")
        .single();

      if (missionError) throw missionError;

      const { data: adminUsers } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      if (adminUsers && missionData) {
        for (const admin of adminUsers) {
          await supabase.rpc("create_notification", {
            p_user_id: admin.user_id,
            p_type: "new_mission",
            p_title: "NOUVELLE MISSION proposée",
            p_message: `Nouvelle mission "${formData.category}" soumise par un client à ${formData.city}. Budget: ${budgetLabel}. En attente d'approbation.`,
            p_related_id: missionData.id,
          });
        }
      }

      setStep(totalSteps + 1);
      toast({ title: "Mission déposée !", description: "Votre demande a été envoyée aux artisans." });
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = ["Travaux", "Localisation", "Budget & Détails", "Contact"];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Décrivez votre projet en toute sérénité"
        description="Zéro harcèlement. Nous analysons votre besoin et vous mettons en relation avec l'artisan expert le plus adapté. Données protégées."
        canonical="https://artisansvalides.fr/demande-devis"
      />
      <Navbar />

      <main className="pb-16">
        <div className="container mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Décrivez votre projet en toute sérénité</h1>
              <p className="text-muted-foreground max-w-xl mx-auto">Zéro harcèlement. Nous analysons votre besoin et vous mettons en relation avec l'artisan expert le plus adapté à votre projet. C'est vous qui décidez quand partager vos coordonnées.</p>
            </motion.div>

            {/* Progress Bar */}
            {step <= totalSteps && (
              <div className="mb-10">
                <div className="flex justify-between mb-2">
                  {Array.from({ length: Math.min(totalSteps, 4) }, (_, i) => i + 1).map((s) => (
                    <div key={s} className="flex flex-col items-center gap-1">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-all ${
                          s < step ? "bg-success text-white" : s === step ? "bg-gold text-primary-foreground shadow-gold" : "bg-secondary text-muted-foreground border border-border"
                        }`}
                      >
                        {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                      </div>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">{stepLabels[s - 1]}</span>
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }} className="h-full bg-gradient-gold" />
                </div>
                {/* Social proof line */}
                <p className="text-center text-xs text-muted-foreground mt-3">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
                  847 projets déposés ce mois-ci · Réponse artisan en moins de 2h en moyenne
                </p>
              </div>
            )}

            {/* Form Steps */}
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl shadow-soft border border-gold/20 p-6 md:p-8">
              <AnimatePresence mode="wait">
                {/* ============ STEP 1: Type de travaux ============ */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-semibold text-foreground mb-6">Quel type de travaux souhaitez-vous réaliser ?</h2>

                    {categoriesLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gold" />
                        <span className="ml-2 text-muted-foreground">Chargement des catégories...</span>
                      </div>
                    ) : (
                      <div className="space-y-6 mb-8">
                        {categoriesHierarchy?.map((parent) => (
                          <div key={parent.id}>
                            <p className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                              <CategoryIcon iconName={parent.icon} size={18} className="text-gold" />
                              {parent.name}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {parent.children.map((child) => {
                                const isSelected = formData.categoryId === child.id;
                                return (
                                  <button
                                    key={child.id}
                                    type="button"
                                    onClick={() => handleCategorySelect(child.id, parent.id)}
                                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left text-sm transition-all ${
                                      isSelected ? "border-gold bg-gold/10 font-medium text-foreground" : "border-border hover:border-gold/50 text-muted-foreground"
                                    }`}
                                  >
                                    <CategoryIcon iconName={child.icon} size={16} className={isSelected ? "text-gold" : "text-muted-foreground"} />
                                    {child.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}

                        {/* Sub-question for Rénovation Globale */}
                        {isRenovationGlobale && formData.categoryId && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="border-t pt-4">
                            <p className="text-sm font-medium text-foreground mb-3">Précisez votre rénovation :</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {renovationSubOptions.map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => updateForm("renovationSubType", opt.id)}
                                  className={`p-3 rounded-xl border-2 text-sm text-left transition-all ${
                                    formData.renovationSubType === opt.id ? "border-gold bg-gold/10 font-medium text-foreground" : "border-border hover:border-gold/50 text-muted-foreground"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    <Button
                      variant="gold"
                      size="lg"
                      onClick={handleNext}
                      disabled={!formData.categoryId || (isRenovationGlobale && !formData.renovationSubType)}
                      className="w-full"
                    >
                      Continuer <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
                      <Shield className="w-3.5 h-3.5 text-success" />
                      Données protégées : Votre numéro ne sera transmis qu'à l'artisan que vous aurez validé.
                    </p>
                  </motion.div>
                )}

                {/* ============ STEP 2: Localisation & Urgence ============ */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-semibold text-foreground mb-6">
                      <MapPin className="w-5 h-5 inline-block mr-2" />
                      Localisation & planning
                    </h2>
                    <div className="space-y-6 mb-8">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="postalCode" className="text-foreground mb-2 block">Code postal *</Label>
                          <Input
                            id="postalCode"
                            placeholder="92100"
                            value={formData.postalCode}
                            onChange={(e) => updateForm("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))}
                            className="h-12"
                            maxLength={5}
                          />
                          {formData.postalCode.length === 5 && isPrioritySector && (
                            <Badge variant="outline" className="mt-2 border-success text-success bg-success/10">
                              <Sparkles className="w-3 h-3 mr-1" /> Secteur Prioritaire Artisans Validés
                            </Badge>
                          )}
                          {formData.postalCode.length === 5 && !isPrioritySector && (
                            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                              Nous n'avons pas encore d'artisan dans votre zone — votre projet sera mis en attente prioritaire dès qu'un artisan est validé près de chez vous.
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="city" className="text-foreground mb-2 block">Ville *</Label>
                          <CityAutocompleteAPI
                            value={formData.city}
                            onChange={(value, coords) => {
                              setFormData(prev => ({ ...prev, city: value, cityCoordinates: coords ?? null }));
                            }}
                            placeholder="Rechercher votre ville..."
                            className="h-12"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-foreground mb-3 block">
                          <Calendar className="w-4 h-4 inline-block mr-2" />
                          Quand souhaitez-vous que les travaux débutent ? *
                        </Label>
                        <div className="grid grid-cols-3 gap-3">
                          {timelineOptions.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => updateForm("timeline", opt.id)}
                              className={`p-4 rounded-xl border-2 text-center transition-all ${
                                formData.timeline === opt.id ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"
                              }`}
                            >
                              <span className="text-xl block mb-1">{opt.icon}</span>
                              <span className={`text-sm font-medium ${formData.timeline === opt.id ? "text-foreground" : "text-muted-foreground"}`}>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" size="lg" onClick={handleBack} className="flex-1">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Retour
                      </Button>
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={handleNext}
                        disabled={!formData.postalCode || formData.postalCode.length !== 5 || !formData.city || !formData.timeline}
                        className="flex-1"
                      >
                        Continuer <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ============ STEP 3: Budget + Photos & Description (merged) ============ */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      <Euro className="w-5 h-5 inline-block mr-2" />
                      Quel est votre budget estimé ?
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Un budget précis permet aux artisans de vous envoyer un devis adapté.
                    </p>
                    <div className="space-y-3 mb-6">
                      {budgetOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => updateForm("budget", opt.id)}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                            formData.budget === opt.id ? "border-gold bg-gold/10" : "border-border hover:border-gold/50"
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            formData.budget === opt.id ? "border-gold" : "border-muted-foreground/40"
                          }`}>
                            {formData.budget === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-gold" />}
                          </div>
                          <div>
                            <div className={`font-medium ${formData.budget === opt.id ? "text-foreground" : "text-foreground"}`}>{opt.label}</div>
                            <div className="text-xs text-muted-foreground">{opt.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gold/10 border border-gold/30 mb-6">
                      <Shield className="w-4 h-4 text-gold mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground/80">
                        <strong>Un lead sans budget n'est pas envoyé aux artisans.</strong> Indiquez une fourchette pour recevoir des devis pertinents.
                      </p>
                    </div>

                    {/* Aides d'État simulator */}
                    {(() => {
                      const catName = formData.category.toLowerCase();
                      const aidesMap: Record<string, { aides: string[]; note?: string }> = {
                        "photovoltaïque": { aides: ["MaPrimeRénov' Sérénité", "Prime CEE", "TVA réduite 10%"] },
                        "pac": { aides: ["MaPrimeRénov' (jusqu'à 10 000€)", "Prime CEE", "Éco-PTZ", "TVA réduite 5.5%"] },
                        "chauffage": { aides: ["MaPrimeRénov'", "Prime CEE", "Éco-PTZ", "TVA réduite 5.5%"] },
                        "isolation": { aides: ["MaPrimeRénov' (jusqu'à 75% du coût)", "Prime CEE", "Éco-PTZ", "TVA réduite 5.5%"] },
                        "borne de recharge irve": { aides: ["Crédit d'impôt CITE 300€", "TVA réduite 5.5%"] },
                        "menuiserie extérieure": { aides: ["MaPrimeRénov'", "Prime CEE", "TVA réduite 5.5%"] },
                        "domotique": { aides: ["Prime CEE", "TVA réduite 5.5%"] },
                      };
                      const matchedKey = Object.keys(aidesMap).find(k => catName.includes(k));
                      if (!matchedKey) return null;
                      const { aides } = aidesMap[matchedKey];
                      return (
                        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                          <p className="text-sm font-bold text-emerald-400 mb-2">
                            💰 Ce projet est éligible aux aides d'État
                          </p>
                          <ul className="space-y-1 mb-3">
                            {aides.map((aide, i) => (
                              <li key={i} className="text-xs text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                {aide}
                              </li>
                            ))}
                          </ul>
                          <p className="text-[11px] text-emerald-400/70">
                            Un artisan RGE certifié est obligatoire pour bénéficier de ces aides. Tous nos artisans éligibles sont certifiés RGE.
                          </p>
                        </div>
                      );
                    })()}

                    {/* Description & Photos merged here */}
                    <div className="space-y-6 mb-8 border-t border-border pt-6">
                      <div>
                        <Label htmlFor="description" className="text-foreground mb-2 block">
                          Description des travaux *
                        </Label>
                        <Textarea
                          id="description"
                          placeholder="Décrivez en détail les travaux que vous souhaitez réaliser..."
                          value={formData.description}
                          onChange={(e) => updateForm("description", e.target.value)}
                          rows={4}
                          maxLength={2000}
                          className="resize-none"
                        />
                        <div className="flex items-center justify-between mt-1">
                          <div>
                            {formData.description.length >= 10 && (
                              <p className="text-xs text-success font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Bonne description, vous pouvez continuer !
                              </p>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{formData.description.length}/2000</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-foreground mb-2 block">
                          <Camera className="w-4 h-4 inline-block mr-2" />
                          📸 Photos de la zone des travaux (optionnel mais recommandé)
                        </Label>
                        <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/20 mb-3">
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 shrink-0" />
                          <p className="text-xs text-success font-medium">
                            Les demandes avec photos augmentent le taux de réponse de 40%.
                          </p>
                        </div>
                        <MissionPhotoUpload
                          photos={formData.photos}
                          onPhotosChange={(photos) => setFormData(prev => ({ ...prev, photos }))}
                          maxPhotos={5}
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" size="lg" onClick={handleBack} className="flex-1">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Retour
                      </Button>
                      <Button variant="gold" size="lg" onClick={handleNext} disabled={!formData.budget || !formData.description} className="flex-1">
                        Continuer <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ============ STEP 4: Contact ============ */}
                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    <h2 className="text-xl font-semibold text-foreground mb-2">
                      <Lock className="w-5 h-5 inline-block mr-2" />
                      Créer votre espace sécurisé
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      C'est ici que vous recevrez la proposition de l'artisan sélectionné, sans que votre téléphone ne soit diffusé partout.
                    </p>
                    <div className="space-y-6 mb-8">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName" className="text-foreground mb-2 block">
                            <User className="w-4 h-4 inline-block mr-2" /> Prénom *
                          </Label>
                          <Input id="firstName" placeholder="Jean" value={formData.firstName} onChange={(e) => updateForm("firstName", e.target.value)} className="h-12" disabled={isAuthenticated} />
                        </div>
                        <div>
                          <Label htmlFor="lastName" className="text-foreground mb-2 block">Nom *</Label>
                          <Input id="lastName" placeholder="Dupont" value={formData.lastName} onChange={(e) => updateForm("lastName", e.target.value)} className="h-12" disabled={isAuthenticated} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-foreground mb-2 block">
                          <Mail className="w-4 h-4 inline-block mr-2" /> Email *
                        </Label>
                        <Input id="email" type="email" placeholder="jean.dupont@email.com" value={formData.email} onChange={(e) => updateForm("email", e.target.value)} className="h-12" disabled={isAuthenticated} />
                      </div>

                      {/* Confidentiality notice above phone */}
                      <div className="flex items-start gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
                        <Shield className="w-5 h-5 text-success mt-0.5" />
                        <p className="text-sm text-foreground/80">
                          🔒 <strong>Vos données restent confidentielles.</strong> Aucune information personnelle ne sera partagée sans votre accord.
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="phone" className="text-foreground mb-2 block">
                          <Phone className="w-4 h-4 inline-block mr-2" /> Téléphone * (format français)
                        </Label>
                        <p className="text-xs text-muted-foreground mb-1">Laissez votre numéro, l'artisan vous rappelle directement.</p>
                        <FrenchPhoneInput id="phone" value={formData.phone} onChange={(value) => updateForm("phone", value)} />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button variant="outline" size="lg" onClick={handleBack} className="flex-1">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Retour
                      </Button>
                      <Button
                        variant="gold"
                        size="lg"
                        onClick={handleSubmit}
                        disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone || isLoading}
                        className="flex-1"
                      >
                        {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                        {isLoading ? "Envoi en cours..." : "Trouver mon artisan →"}
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ============ SUCCESS ============ */}
                {step === totalSteps + 1 && (
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-4">🎉 Félicitations ! Votre projet est en ligne.</h2>
                    <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                      Vous recevrez des notifications dès qu'un artisan y répondra.
                    </p>
                    {!isAuthenticated && (
                      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-6 max-w-sm mx-auto">
                        <p className="text-sm text-foreground font-medium">
                          📧 Un email de confirmation vous a été envoyé à <strong>{formData.email}</strong>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cliquez sur le lien pour activer votre espace et suivre vos devis.
                        </p>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="gold" onClick={() => navigate("/client/dashboard")}>
                        Accéder à mon espace
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
