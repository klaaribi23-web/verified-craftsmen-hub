import { useState } from "react";
import { z } from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FrenchPhoneInput, validateFrenchPhone } from "@/components/ui/french-phone-input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  Shield,
  CheckCircle2,
  Phone,
  Upload,
  Loader2,
  Building2,
  MapPin,
  Wrench,
  FileText,
  Users,
  Star,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const candidacySchema = z.object({
  businessName: z.string().trim().min(2, "Nom d'entreprise requis").max(100),
  siret: z.string().trim().min(14, "SIRET invalide (14 chiffres)").max(14, "SIRET invalide (14 chiffres)").regex(/^\d{14}$/, "Le SIRET doit contenir 14 chiffres"),
  metier: z.string().trim().min(2, "Métier requis").max(100),
  city: z.string().trim().min(2, "Ville requise").max(100),
  phone: z.string().trim().refine(val => validateFrenchPhone(val), { message: "Numéro français invalide" }),
});

const steps = [
  { icon: FileText, title: "Candidature", desc: "Remplissez le formulaire ci-dessous" },
  { icon: Phone, title: "Appel de qualification", desc: "Un conseiller vous rappelle sous 24h" },
  { icon: CheckCircle2, title: "Activation", desc: "Votre espace Pro est créé sur-mesure" },
];

const DevenirPartenaire = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    businessName: "",
    siret: "",
    metier: "",
    city: "",
    phone: "",
  });

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Fichier trop volumineux", description: "Max 10 Mo", variant: "destructive" });
        return;
      }
      setInsuranceFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = candidacySchema.safeParse(formData);
      if (!result.success) {
        toast({ title: "Erreur", description: result.error.errors[0].message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitted(true);
      toast({ title: "Candidature envoyée !", description: "Un conseiller vous rappelle sous 24h." });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Candidature envoyée" description="Votre candidature au réseau a bien été reçue." />
        <Navbar />
        <main className="pt-32 lg:pt-20 pb-20">
          <div className="container mx-auto px-4 max-w-md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 shadow-floating text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">Candidature reçue !</h1>
              <p className="text-muted-foreground mb-6">
                Un conseiller vous rappelle au <strong className="text-foreground">{formData.phone}</strong> sous 24h pour valider votre dossier et vérifier la disponibilité de votre secteur à <strong className="text-foreground">{formData.city}</strong>.
              </p>
              <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Pas de robot, pas de spam.</strong> C'est un humain qui étudie votre dossier et vérifie vos documents.
                </p>
              </div>
              <Button variant="gold" onClick={() => window.location.href = "/"} className="w-full">
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
        title="Devenir Artisan Partenaire - Rejoignez un réseau sélectif"
        description="Rejoignez un réseau sélectif d'artisans. Nous valorisons la qualité, pas le volume. Un conseiller vous rappelle sous 24h."
        canonical="https://artisansvalides.fr/devenir-partenaire"
      />
      <Navbar />

      <main className="pt-32 lg:pt-20">
        {/* Hero */}
        <section className="bg-navy py-16 lg:py-24 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-2xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
                <Shield className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-gold">Réseau sélectif</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                Rejoignez un réseau où la{" "}
                <span className="text-gradient-gold">qualité prime</span>
              </h1>
              <p className="text-lg text-white/70">
                Ici, nous valorisons la qualité, pas le volume. Un conseiller vous rappelle sous 24h pour étudier votre candidature.
              </p>
            </motion.div>

            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  className="text-center"
                >
                  <div className="w-12 h-12 bg-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <step.icon className="w-6 h-6 text-gold" />
                  </div>
                  <div className="text-xs text-gold font-medium mb-1">Étape {i + 1}</div>
                  <h3 className="text-white font-semibold mb-1">{step.title}</h3>
                  <p className="text-white/50 text-sm">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Form Section */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
              {/* Form */}
              <div className="lg:col-span-3">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <Card className="border-border/60 shadow-lg">
                    <CardContent className="p-6 md:p-8">
                      <h2 className="text-2xl font-bold text-foreground mb-2">Formulaire de candidature</h2>
                      <p className="text-muted-foreground mb-6">Tous les champs marqués * sont obligatoires.</p>

                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                          <Label htmlFor="businessName">Nom de l'entreprise *</Label>
                          <div className="relative mt-1.5">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input id="businessName" placeholder="Ex: Dupont Plomberie" value={formData.businessName} onChange={e => updateForm("businessName", e.target.value)} className="pl-10" required />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="siret">Numéro SIRET *</Label>
                          <div className="relative mt-1.5">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input id="siret" placeholder="14 chiffres" value={formData.siret} onChange={e => updateForm("siret", e.target.value.replace(/\D/g, "").slice(0, 14))} className="pl-10" required maxLength={14} />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="metier">Métier principal *</Label>
                          <div className="relative mt-1.5">
                            <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input id="metier" placeholder="Ex: Plombier, Électricien, Maçon..." value={formData.metier} onChange={e => updateForm("metier", e.target.value)} className="pl-10" required />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="city">Ville d'intervention *</Label>
                          <div className="relative mt-1.5">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input id="city" placeholder="Ex: Lille, Lyon, Paris..." value={formData.city} onChange={e => updateForm("city", e.target.value)} className="pl-10" required />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="phone">Téléphone *</Label>
                          <div className="mt-1.5">
                            <FrenchPhoneInput id="phone" value={formData.phone} onChange={value => updateForm("phone", value)} />
                          </div>
                        </div>

                        {/* Insurance upload */}
                        <div>
                          <Label>Attestation d'assurance (optionnel)</Label>
                          <div className="mt-1.5">
                            <label
                              htmlFor="insurance-upload"
                              className="flex items-center gap-3 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-gold/50 hover:bg-gold/5 transition-colors"
                            >
                              <Upload className="w-5 h-5 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                {insuranceFile ? (
                                  <p className="text-sm font-medium text-foreground truncate">{insuranceFile.name}</p>
                                ) : (
                                  <>
                                    <p className="text-sm font-medium text-muted-foreground">Cliquez pour uploader</p>
                                    <p className="text-xs text-muted-foreground">PDF, JPG ou PNG (max 10 Mo)</p>
                                  </>
                                )}
                              </div>
                              {insuranceFile && <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />}
                            </label>
                            <input id="insurance-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
                          </div>
                        </div>

                        <Button type="submit" variant="gold" size="lg" className="w-full !text-base !font-bold !py-6" disabled={isLoading}>
                          {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                          {isLoading ? "Envoi en cours..." : "Envoyer ma candidature"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-2 space-y-6">
                {/* Engagement */}
                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                  <Card className="bg-navy text-white border-0">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                          <Star className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="font-bold text-lg">Notre engagement</h3>
                      </div>
                      <p className="text-white/80 leading-relaxed">
                        Rejoignez un réseau sélectif. Ici, nous valorisons la <strong className="text-gold">qualité, pas le volume</strong>. Un conseiller vous rappelle sous 24h pour étudier personnellement votre candidature.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Contact direct */}
                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                  <Card className="border-gold/30 bg-gold/5">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-gold" />
                        </div>
                        <h3 className="font-bold text-lg text-foreground">Besoin d'en parler ?</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        Appelez-nous directement, un expert du bâtiment vous répond.
                      </p>
                      <a href="tel:+33612345678" className="inline-flex items-center gap-2 text-lg font-bold text-gold hover:text-gold-dark transition-colors">
                        <Phone className="w-5 h-5" />
                        06 12 34 56 78
                      </a>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-gold" />
                        <h3 className="font-bold text-foreground">Le réseau en chiffres</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { val: "50+", label: "Artisans partenaires" },
                          { val: "0%", label: "Commission" },
                          { val: "2 max", label: "Par ville" },
                          { val: "24h", label: "Délai de rappel" },
                        ].map(s => (
                          <div key={s.label} className="text-center p-3 bg-muted/50 rounded-lg">
                            <div className="text-xl font-bold text-gold">{s.val}</div>
                            <div className="text-xs text-muted-foreground">{s.label}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default DevenirPartenaire;
