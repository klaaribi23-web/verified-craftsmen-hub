import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Clock, Send, User, Briefcase, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";

const TRAVAUX_OPTIONS = [
  "Peinture",
  "Électricité",
  "Maçonnerie",
  "Menuiserie",
  "Autre",
] as const;

type ContactType = "particulier" | "professionnel" | null;

const particulierSchema = z.object({
  lastName: z.string().trim().min(1, "Le nom est requis").max(100),
  email: z.string().trim().email("L'email est invalide").max(255),
  phone: z.string().trim().min(1, "Le téléphone est requis").max(20),
  city: z.string().trim().min(1, "La ville est requise").max(100),
  projectType: z.string().trim().min(1, "Le type de travaux est requis").max(200),
  message: z.string().trim().min(1, "Le message est requis").max(5000),
});

const professionnelSchema = z.object({
  directorName: z.string().trim().min(1, "Le nom du dirigeant est requis").max(100),
  companyName: z.string().trim().min(1, "Le nom de l'entreprise est requis").max(200),
  siret: z.string().trim().min(1, "Le SIRET est requis").max(20),
  trade: z.string().trim().min(1, "Le métier est requis").max(100),
  email: z.string().trim().email("L'email est invalide").max(255),
  phone: z.string().trim().min(1, "Le téléphone est requis").max(20),
});

const Contact = () => {
  const [contactType, setContactType] = useState<ContactType>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [honeypot, setHoneypot] = useState("");

  const [particulierData, setParticulierData] = useState({
    lastName: "", email: "", phone: "", city: "", projectType: "", message: "",
  });

  const [proData, setProData] = useState({
    directorName: "", companyName: "", siret: "", trade: "", email: "", phone: "",
  });

  const handleParticulierChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setParticulierData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleProChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (honeypot) return;

    let subject = "";
    let message = "";

    if (contactType === "particulier") {
      const result = particulierSchema.safeParse(particulierData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        toast.error("Veuillez corriger les erreurs dans le formulaire");
        return;
      }
      subject = `[Particulier] ${result.data.projectType}`;
      message = `Nom: ${result.data.lastName}\nEmail: ${result.data.email}\nTéléphone: ${result.data.phone}\nVille: ${result.data.city}\nType de travaux: ${result.data.projectType}\n\nMessage:\n${result.data.message}`;
    } else {
      const result = professionnelSchema.safeParse(proData);
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
        });
        setErrors(fieldErrors);
        toast.error("Veuillez corriger les erreurs dans le formulaire");
        return;
      }
      subject = `[Professionnel] ${result.data.companyName}`;
      message = `Dirigeant: ${result.data.directorName}\nEntreprise: ${result.data.companyName}\nSIRET: ${result.data.siret}\nMétier: ${result.data.trade}\nEmail: ${result.data.email}\nTéléphone: ${result.data.phone}`;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: contactType === "particulier" ? particulierData.lastName : proData.directorName,
          email: contactType === "particulier" ? particulierData.email : proData.email,
          subject,
          message,
          _hp: honeypot,
        },
      });
      if (error) throw new Error(error.message);
      toast.success("Message envoyé ! Un expert vous rappelle sous 24h.");
      setContactType(null);
      setParticulierData({ lastName: "", email: "", phone: "", city: "", projectType: "", message: "" });
      setProData({ directorName: "", companyName: "", siret: "", trade: "", email: "", phone: "" });
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contactez-nous"
        description="Particulier ou professionnel, contactez l'équipe Artisans Validés. Un expert vous rappelle sous 24h."
        canonical="https://artisansvalides.fr/contact"
      />
      <Navbar />

      {/* Hero */}
      <section className="bg-navy pt-16 lg:pt-20 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Contactez-nous</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Notre équipe est à votre écoute pour répondre à toutes vos questions
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-12">
            
            {/* Form Column */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-bold text-foreground mb-2">Envoyez-nous un message</h2>
              <p className="text-muted-foreground mb-8">Choisissez votre profil pour un traitement adapté.</p>

              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                  onClick={() => { setContactType("particulier"); setErrors({}); }}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                    contactType === "particulier"
                      ? "border-gold bg-gold/5 shadow-md"
                      : "border-border hover:border-gold/50 hover:bg-muted/50"
                  }`}
                >
                  <div className={`p-3 rounded-full ${contactType === "particulier" ? "bg-gold/20" : "bg-muted"}`}>
                    <User className={`h-6 w-6 ${contactType === "particulier" ? "text-gold" : "text-muted-foreground"}`} />
                  </div>
                  <span className="font-semibold text-foreground">Je suis un Particulier</span>
                </button>
                <button
                  onClick={() => { setContactType("professionnel"); setErrors({}); }}
                  className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all ${
                    contactType === "professionnel"
                      ? "border-gold bg-gold/5 shadow-md"
                      : "border-border hover:border-gold/50 hover:bg-muted/50"
                  }`}
                >
                  <div className={`p-3 rounded-full ${contactType === "professionnel" ? "bg-gold/20" : "bg-muted"}`}>
                    <Briefcase className={`h-6 w-6 ${contactType === "professionnel" ? "text-gold" : "text-muted-foreground"}`} />
                  </div>
                  <span className="font-semibold text-foreground">Je suis un Professionnel</span>
                </button>
              </div>

              {/* Forms */}
              <AnimatePresence mode="wait">
                {contactType && (
                  <motion.div
                    key={contactType}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-border/50">
                      <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                          {/* Honeypot */}
                          <div className="absolute -left-[9999px]" aria-hidden="true">
                            <input type="text" name="website" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" />
                          </div>

                          {contactType === "particulier" ? (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">Nom</label>
                                  <Input id="lastName" name="lastName" value={particulierData.lastName} onChange={handleParticulierChange} placeholder="Votre nom" required className={errors.lastName ? "border-destructive" : ""} />
                                  {errors.lastName && <p className="text-sm text-destructive mt-1">{errors.lastName}</p>}
                                </div>
                                <div>
                                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">Email</label>
                                  <Input id="email" name="email" type="email" value={particulierData.email} onChange={handleParticulierChange} placeholder="votre@email.fr" required className={errors.email ? "border-destructive" : ""} />
                                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
                                  <Input id="phone" name="phone" type="tel" value={particulierData.phone} onChange={handleParticulierChange} placeholder="06 12 34 56 78" required className={errors.phone ? "border-destructive" : ""} />
                                  {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                                </div>
                                <div>
                                  <label htmlFor="city" className="block text-sm font-medium text-foreground mb-2">Ville</label>
                                  <Input id="city" name="city" value={particulierData.city} onChange={handleParticulierChange} placeholder="Votre ville" required className={errors.city ? "border-destructive" : ""} />
                                  {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                                </div>
                              </div>
                              <div>
                                <label htmlFor="projectType" className="block text-sm font-medium text-foreground mb-2">Type de travaux</label>
                                <Select value={particulierData.projectType} onValueChange={(val) => { setParticulierData(prev => ({ ...prev, projectType: val })); if (errors.projectType) setErrors(prev => ({ ...prev, projectType: "" })); }}>
                                  <SelectTrigger className={errors.projectType ? "border-destructive" : ""}>
                                    <SelectValue placeholder="Sélectionnez un type de travaux" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {TRAVAUX_OPTIONS.map(opt => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {errors.projectType && <p className="text-sm text-destructive mt-1">{errors.projectType}</p>}
                              </div>
                              <div>
                                <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">Message</label>
                                <Textarea id="message" name="message" value={particulierData.message} onChange={handleParticulierChange} placeholder="Décrivez votre projet..." rows={4} required className={errors.message ? "border-destructive" : ""} />
                                {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor="directorName" className="block text-sm font-medium text-foreground mb-2">Nom du dirigeant</label>
                                  <Input id="directorName" name="directorName" value={proData.directorName} onChange={handleProChange} placeholder="Nom complet" required className={errors.directorName ? "border-destructive" : ""} />
                                  {errors.directorName && <p className="text-sm text-destructive mt-1">{errors.directorName}</p>}
                                </div>
                                <div>
                                  <label htmlFor="companyName" className="block text-sm font-medium text-foreground mb-2">Nom de l'entreprise</label>
                                  <Input id="companyName" name="companyName" value={proData.companyName} onChange={handleProChange} placeholder="Raison sociale" required className={errors.companyName ? "border-destructive" : ""} />
                                  {errors.companyName && <p className="text-sm text-destructive mt-1">{errors.companyName}</p>}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor="siret" className="block text-sm font-medium text-foreground mb-2">SIRET</label>
                                  <Input id="siret" name="siret" value={proData.siret} onChange={handleProChange} placeholder="123 456 789 00012" required className={errors.siret ? "border-destructive" : ""} />
                                  {errors.siret && <p className="text-sm text-destructive mt-1">{errors.siret}</p>}
                                </div>
                                <div>
                                  <label htmlFor="trade" className="block text-sm font-medium text-foreground mb-2">Métier</label>
                                  <Input id="trade" name="trade" value={proData.trade} onChange={handleProChange} placeholder="Ex: Plombier, Électricien..." required className={errors.trade ? "border-destructive" : ""} />
                                  {errors.trade && <p className="text-sm text-destructive mt-1">{errors.trade}</p>}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label htmlFor="proEmail" className="block text-sm font-medium text-foreground mb-2">Email</label>
                                  <Input id="proEmail" name="email" type="email" value={proData.email} onChange={handleProChange} placeholder="contact@entreprise.fr" required className={errors.email ? "border-destructive" : ""} />
                                  {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                  <label htmlFor="proPhone" className="block text-sm font-medium text-foreground mb-2">Téléphone</label>
                                  <Input id="proPhone" name="phone" type="tel" value={proData.phone} onChange={handleProChange} placeholder="06 12 34 56 78" required className={errors.phone ? "border-destructive" : ""} />
                                  {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                                </div>
                              </div>
                            </>
                          )}

                          <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting} size="lg">
                            {isSubmitting ? "Envoi en cours..." : (
                              <><Send className="h-4 w-4 mr-2" />Envoyer ma demande</>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>

                    {/* Reassurance */}
                    <div className="flex items-center gap-3 mt-4 p-4 bg-success/10 rounded-lg border border-success/20">
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                      <p className="text-sm text-foreground font-medium">
                        Un expert Artisans Validés vous recontacte sous 24h.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!contactType && (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">👆 Sélectionnez votre profil pour commencer</p>
                </div>
              )}
            </div>

            {/* Info Column */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Nos coordonnées</h2>

              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10"><Mail className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <a href="mailto:contact@artisansvalides.fr" className="text-primary hover:underline font-medium text-sm">contact@artisansvalides.fr</a>
                    <p className="text-xs text-muted-foreground mt-1">Réponse sous 24h</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10"><Phone className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">Téléphone</h3>
                    <a href="tel:+33353632999" className="text-primary hover:underline font-medium text-sm">03 53 63 29 99</a>
                    <p className="text-xs text-muted-foreground mt-1">Du lundi au vendredi</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">Adresse</h3>
                    <p className="text-sm text-muted-foreground">77 rue de la Monnaie</p>
                    <p className="text-sm text-muted-foreground">59800 Lille, France</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10"><Clock className="h-5 w-5 text-primary" /></div>
                  <div>
                    <h3 className="font-semibold text-foreground">Horaires</h3>
                    <p className="text-sm text-muted-foreground">Lun - Ven : 9h00 - 18h00</p>
                    <p className="text-sm text-muted-foreground">Sam : 9h00 - 12h00</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
