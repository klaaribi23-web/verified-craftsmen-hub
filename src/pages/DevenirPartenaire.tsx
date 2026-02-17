import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FrenchPhoneInput, validateFrenchPhone } from "@/components/ui/french-phone-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  Wrench,
  Search,
  Eye,
  Filter,
  MessageCircle,
  ArrowRight,
  Loader2,
  Quote,
  AlertTriangle,
  Award,
  Users,
} from "lucide-react";

// --- Floating WhatsApp Button ---
const WhatsAppButton = () => (
  <a
    href="https://wa.me/33612345678?text=Bonjour%20Jane%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20la%20licence%20Artisans%20Valid%C3%A9s."
    target="_blank"
    rel="noopener noreferrer"
    className="group fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25d366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
    aria-label="Parler à Jane"
  >
    <MessageCircle className="w-6 h-6 text-white" />
    <span className="absolute -top-8 right-0 bg-white text-navy text-xs font-bold px-2 py-1 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Parler à Jane</span>
  </a>
);

// --- Dynamic Scarcity Banner ---
const ScarcityBanner = ({ metier, city }: { metier?: string; city?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-navy overflow-hidden py-2.5 relative z-40"
  >
    <motion.div
      animate={{ x: ["100%", "-100%"] }}
      transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
      className="whitespace-nowrap text-xs md:text-sm font-semibold text-gold tracking-wide"
    >
      🔒 Alerte : Plus que 2 places disponibles pour les {metier || "artisans"} sur {city || "votre secteur"} · Complet à Valenciennes · 1 place à Roubaix · 2 places à Cambrai &nbsp;&nbsp;&nbsp;&nbsp; 🔒 Alerte : Plus que 2 places disponibles pour les {metier || "artisans"} sur {city || "votre secteur"} · Complet à Valenciennes · 1 place à Roubaix · 2 places à Cambrai
    </motion.div>
  </motion.div>
);

// --- Hero ---
const HeroSection = ({ onCTA }: { onCTA: () => void }) => (
  <section className="bg-navy py-16 md:py-24 lg:py-32 relative overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold rounded-full blur-3xl" />
    </div>
    <div className="container mx-auto px-4 lg:px-8 relative z-10">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold/20 border border-gold/30 mb-8">
          <Shield className="w-4 h-4 text-gold" />
          <span className="text-sm font-bold text-gold">Réseau fermé — Places limitées</span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.05] mb-6 uppercase tracking-tight">
          VOTRE SECTEUR EST-IL ENCORE DISPONIBLE ?{" "}
          <span className="text-gradient-gold">Votre croissance.</span>
        </h1>

        <p className="text-base md:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
          Arrêtez de partager vos chantiers. Devenez{" "}
          <strong className="text-white">l'artisan référent</strong> sur votre secteur
          et laissez <strong className="text-gold">Jane</strong> piloter votre visibilité locale.
        </p>

        <Button
          variant="gold"
          size="xl"
          className="!font-black !text-base md:!text-lg uppercase tracking-wider"
          onClick={onCTA}
        >
          <MapPin className="w-5 h-5 mr-2" /> VÉRIFIER LA DISPONIBILITÉ DE MA ZONE <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        <p className="text-xs text-white/40 mt-4">On ne prend pas tout le monde. On ne garde que les meilleurs.</p>
      </motion.div>
    </div>
  </section>
);

// --- Comparison Section (Eux vs Nous) ---
const ComparisonSection = () => (
  <section className="py-16 lg:py-24 bg-secondary">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">Le vrai calcul</span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Pourquoi nous ?</h2>
        <p className="text-slate-400">Soyons cash : voici ce que vous subissez vs ce qu'on propose.</p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Eux */}
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <Card className="h-full border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Vendeurs de Leads</h3>
                  <p className="text-xs text-muted-foreground">Ce que vous subissez</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  "Multiples artisans sur un même projet",
                  "Prix cassés, course au moins-disant",
                  "Aucune aide, aucun accompagnement",
                  "30 à 80€ par lead non qualifié",
                  "Commission sur chaque chantier signé",
                  "Vous courez. Tout le temps.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-destructive/10 rounded-lg text-center">
                <p className="text-sm font-bold text-destructive">Coût moyen : 400 à 1 200€/mois</p>
                <p className="text-xs text-muted-foreground mt-1">Pour des résultats aléatoires</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Nous */}
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <Card className="h-full border-2 border-gold shadow-lg shadow-gold/10">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Artisans Validés</h3>
                  <p className="text-xs text-gold font-medium">Ce que vous méritez</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  "Exclusivité zone : 2 artisans max par secteur",
                  "Audit de confiance — Badge « Validé 2026 »",
                  "SEO local inclus — n°1 sur Google",
                  "Secrétariat Jane : appels filtrés pour vous",
                  "0% de commission, vous gardez tout",
                  "Le client vient à vous.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-gold/10 rounded-lg text-center">
                <p className="text-sm font-bold text-gold">99€/mois · 0% commission</p>
                <p className="text-xs text-muted-foreground mt-1">Un seul chantier rentabilise l'année</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  </section>
);

// --- Méthode Jane ---
const MethodeJane = () => (
  <section className="py-16 lg:py-24 bg-navy relative overflow-hidden">
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
    </div>
    <div className="container mx-auto px-4 lg:px-8 relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-medium mb-4">Comment ça marche</span>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">La « Méthode Jane »</h2>
        <p className="text-white/60 max-w-xl mx-auto">3 étapes. Zéro bullshit. Que du concret.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {[
          {
            step: "01",
            icon: Search,
            title: "Audit",
            desc: "On vérifie vos assurances, vos références et votre sérieux. Vous recevez le badge de confiance « Audité & Validé 2026 ».",
          },
          {
            step: "02",
            icon: Eye,
            title: "Visibilité",
            desc: "On booste votre fiche pour que vous soyez n°1 sur Google dans votre zone. SEO local, profil optimisé, tout est inclus.",
          },
          {
            step: "03",
            icon: Filter,
            title: "Gestion",
            desc: "Jane filtre les demandes et vous envoie les meilleurs chantiers directement sur WhatsApp. Vous ne perdez plus de temps.",
          },
        ].map((item, index) => (
          <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.15 }} className="text-center">
            <div className="w-20 h-20 rounded-full border-2 border-gold bg-transparent flex items-center justify-center mx-auto mb-5">
              <item.icon className="w-8 h-8 text-gold" />
            </div>
            <div className="text-xs text-gold font-bold mb-2 tracking-widest">ÉTAPE {item.step}</div>
            <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
            <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// --- Social Proof ---
const testimonials = [
  {
    name: "Karim B.",
    metier: "Installateur PAC",
    city: "Lille",
    text: "En 3 semaines j'ai signé 2 chantiers à 12 000€. Avant, je payais 40€ le lead pour des faux numéros. Ici c'est du concret.",
  },
  {
    name: "David M.",
    metier: "Électricien",
    city: "Roubaix",
    text: "Le fait d'être seulement 2 par ville, ça change tout. Les clients me rappellent parce qu'ils ont le choix entre moi et un autre, pas entre 15.",
  },
  {
    name: "Sophie L.",
    metier: "Menuiserie PVC/Alu",
    city: "Arras",
    text: "J'ai arrêté ma pub Google à 800€/mois. Avec Artisans Validés, je reçois des demandes qualifiées. Client réel, budget réel.",
  },
];

const SocialProofSection = () => (
  <section className="py-16 lg:py-24 bg-card border-y border-primary/10">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-4">
          <Award className="w-4 h-4 text-gold" />
          <span className="text-sm font-bold text-gold">AUDITÉ & VALIDÉ 2026</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ils ont rejoint l'Alliance. Voici ce qu'ils en disent.</h2>
        <p className="text-slate-400 max-w-xl mx-auto">Pas de mise en scène. Des artisans qui parlent vrai.</p>
      </motion.div>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <Card className="h-full border-border/60">
              <CardContent className="p-6">
                <Quote className="w-6 h-6 text-gold/40 mb-3" />
                <p className="text-sm text-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">{t.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.metier} — {t.city}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Vérifié</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// --- Schema ---
const formSchema = z.object({
  fullName: z.string().trim().min(2, "Nom requis").max(100),
  metier: z.string().trim().min(2, "Métier requis").max(100),
  codePostal: z.string().trim().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
  phone: z.string().trim().refine((val) => validateFrenchPhone(val), { message: "Numéro français invalide" }),
});

// --- Form Section ---
const FormSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    metier: "",
    codePostal: "",
    phone: "",
  });

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = formSchema.safeParse(formData);
      if (!result.success) {
        toast({ title: "Erreur de validation", description: result.error.errors[0].message, variant: "destructive" });
        setIsLoading(false);
        return;
      }
      const { error: dbError } = await supabase.from("partner_candidacies").insert({
        business_name: formData.fullName,
        siret: "00000000000000",
        metier: formData.metier,
        city: formData.codePostal,
        phone: formData.phone,
      });
      if (dbError) throw dbError;
      setSubmitted(true);
      toast({ title: "Zone réservée !", description: "Jane vous rappelle sous 24h." });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
    <section id="formulaire" className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 shadow-gold border border-primary/20 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                <p className="font-medium">Zone réservée !</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Votre dossier est entre les mains de Jane</h2>
            <p className="text-muted-foreground mb-6">
              Pas de robot, pas de spam. <strong className="text-foreground">Jane</strong> étudie personnellement votre dossier et vous rappelle sous 24h.
            </p>
            <Button variant="gold" onClick={() => (window.location.href = "/")} className="w-full">
              Retour à l'accueil
            </Button>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section id="formulaire" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            {/* Scarcity alert */}
            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 mb-6">
              <AlertTriangle className="w-4 h-4 text-gold flex-shrink-0" />
              <p className="text-sm text-foreground">
                <strong className="text-gold">Alerte :</strong> Plus que{" "}
                <strong>2 places disponibles</strong> pour les{" "}
                <strong>{formData.metier || "artisans"}</strong> sur{" "}
                <strong>{formData.codePostal || "votre zone"}</strong>.
              </p>
            </div>

            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-gold border-2 border-primary/30">
              <div className="text-center mb-6">
              <h2 className="text-xl md:text-2xl font-black text-white mb-1 uppercase tracking-wide">
                  Réserver mon accès
                </h2>
                <p className="text-2xl md:text-3xl font-black text-gold mb-1">149€ <span className="text-base font-semibold">HT / mois</span></p>
                <p className="text-sm text-muted-foreground">Licence exclusive par zone — Sans engagement</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-white text-sm">Nom / Prénom *</Label>
                  <Input id="fullName" placeholder="Jean Dupont" value={formData.fullName} onChange={(e) => updateForm("fullName", e.target.value)} className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="metier" className="text-white text-sm">Métier *</Label>
                  <div className="relative mt-1">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="metier" placeholder="Ex: Plombier, Électricien, PAC..." value={formData.metier} onChange={(e) => updateForm("metier", e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="codePostal" className="text-white text-sm">Code Postal *</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="codePostal" placeholder="59000" value={formData.codePostal} onChange={(e) => updateForm("codePostal", e.target.value.replace(/\D/g, "").slice(0, 5))} className="pl-10" required maxLength={5} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-white text-sm">Téléphone *</Label>
                  <div className="mt-1">
                    <FrenchPhoneInput id="phone" value={formData.phone} onChange={(value) => updateForm("phone", value)} />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="xl"
                  className="w-full !text-base md:!text-lg !font-black uppercase tracking-wider !py-6"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Vérification...</>
                  ) : (
                    <><span className="mr-2">🔒</span> VÉRIFIER MON ÉLIGIBILITÉ MAINTENANT</>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-400 mt-2">
                  🔒 Validation finale par <strong className="text-primary">Jane</strong> après examen de votre dossier.
                </p>
              </form>

              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-center text-sm text-muted-foreground mb-3">Votre zone est déjà validée ?</p>
                <Button
                  variant="gold"
                  size="xl"
                  className="w-full !text-base md:!text-lg !font-black uppercase tracking-wider !py-5"
                  onClick={() => window.location.href = "/connexion?redirect=/artisan/abonnement"}
                >
                  <Award className="w-5 h-5 mr-2" /> PAYER MA LICENCE
                </Button>
              </div>
            </div>

            {/* Social proof line */}
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center text-sm text-muted-foreground mt-6 flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-gold" />
              Rejoignez les <strong className="text-foreground">500+ partenaires</strong> qui ont choisi la qualité.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// --- CTA Final ---
const CTAFinal = ({ onCTA }: { onCTA: () => void }) => (
  <section className="py-16 lg:py-20 bg-secondary">
    <div className="container mx-auto px-4 lg:px-8">
      <div className="bg-navy rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden shadow-[0_16px_64px_-8px_rgba(26,43,72,0.4)]">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Votre ville est peut-être encore disponible.</h2>
          <p className="text-white/60 mb-8 max-w-xl mx-auto">On ne prend pas tout le monde. On ne garde que les meilleurs. 2 licences max par secteur.</p>
          <Button variant="gold" size="xl" onClick={onCTA}>
            <Shield className="w-5 h-5 mr-2" /> RÉSERVER MON ACCÈS <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  </section>
);

// --- Main Page ---
const DevenirPartenaire = () => {
  const scrollToForm = () => {
    document.getElementById("formulaire")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Artisans Validés | Devenez l'artisan exclusif de votre zone"
        description="Sécurisez vos chantiers sur votre secteur. Exclusivité garantie, visibilité Google optimisée et secrétariat inclus. Rejoignez l'élite."
        canonical="https://artisansvalides.fr/devenir-partenaire"
      />
      <Navbar />

      <main className="pt-20 lg:pt-20">
        <ScarcityBanner />
        <HeroSection onCTA={scrollToForm} />
        <ComparisonSection />
        <MethodeJane />
        <SocialProofSection />
        <FormSection />
        <CTAFinal onCTA={scrollToForm} />
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default DevenirPartenaire;
