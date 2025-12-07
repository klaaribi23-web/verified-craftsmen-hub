import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
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
  Shield
} from "lucide-react";

const categories = [
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

const DemandeDevis = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    urgency: "",
    postalCode: "",
    city: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    // Submit logic here
    setStep(5); // Success step
  };

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

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
                  {[1, 2, 3, 4].map((s) => (
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
                          onClick={() => updateForm("category", cat.id)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.category === cat.id
                              ? "border-gold bg-gold/10"
                              : "border-border hover:border-gold/50"
                          }`}
                        >
                          <cat.icon className={`w-8 h-8 mx-auto mb-2 ${
                            formData.category === cat.id ? "text-gold" : "text-muted-foreground"
                          }`} />
                          <span className={`text-sm font-medium ${
                            formData.category === cat.id ? "text-navy" : "text-muted-foreground"
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
                        onClick={handleSubmit}
                        disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone}
                        className="flex-1"
                      >
                        Déposer ma mission
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Success Step */}
                {step === 5 && (
                  <motion.div
                    key="step5"
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
                      <Button variant="gold" asChild>
                        <a href="/">Retour à l'accueil</a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="/trouver-artisan">Parcourir les artisans</a>
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
