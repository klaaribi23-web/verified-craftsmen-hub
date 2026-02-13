import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
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
  Star,
  Zap,
  Clock,
  Loader2,
  Lock,
  Crown,
  Check,
  Phone,
  MapPin,
  MessageCircle,
  Quote,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

// --- Dynamic Mission Header ---
const DynamicMissionHeader = ({ missionType, missionCity }: { missionType?: string | null; missionCity?: string | null }) => {
  const fromMission = missionType && missionCity;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mx-auto max-w-3xl rounded-xl border px-5 py-4 mb-8 ${
        fromMission ? "bg-gold/10 border-gold/40" : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700"
      }`}
    >
      {fromMission ? (
        <div className="flex items-center gap-3 flex-wrap">
          <Zap className="w-5 h-5 text-gold flex-shrink-0" />
          <p className="text-foreground text-sm md:text-base">
            <span className="font-bold text-gold">Opportunité sélectionnée :</span>{" "}
            {missionType} à {missionCity}.{" "}
            <span className="text-muted-foreground">Statut : En attente de validation.</span>
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          </div>
          <p className="text-foreground text-sm md:text-base">
            <span className="font-bold text-emerald-700 dark:text-emerald-400">Radar Missions :</span>{" "}
            24 projets en attente dans le 59.{" "}
            <span className="text-muted-foreground">Places limitées par ville.</span>
          </p>
        </div>
      )}
    </motion.div>
  );
};

// --- Zone Banner ---
const ZoneBanner = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3 }}
    className="max-w-3xl mx-auto mb-8"
  >
    <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-5 py-3">
      <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
      <p className="text-sm text-foreground">
        <strong className="text-emerald-700 dark:text-emerald-400">✅ Votre zone est ouverte</strong> — Des créneaux sont encore disponibles dans le Nord (59). Inscrivez-vous avant saturation.
      </p>
    </div>
  </motion.div>
);

// --- WhatsApp Alert ---
const WhatsAppAlert = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="max-w-3xl mx-auto mb-10"
  >
    <div className="flex items-center gap-3 bg-[#dcf8c6] dark:bg-[#1a3a1a] border border-[#25d366]/30 rounded-lg px-5 py-3">
      <MessageCircle className="w-5 h-5 text-[#25d366] flex-shrink-0" />
      <p className="text-sm text-foreground">
        <strong>📲 Alerte WhatsApp :</strong> Recevez les nouvelles missions en temps réel directement sur votre téléphone dès l'activation de votre licence.
      </p>
    </div>
  </motion.div>
);

// --- Social Proof Testimonials ---
const testimonials = [
  {
    name: "Karim B.",
    metier: "Installateur PAC",
    city: "Lille",
    text: "En 3 semaines j'ai signé 2 chantiers PAC à 12 000€. Avant je payais 40€ le lead sur les plateformes classiques pour des faux numéros. Ici c'est du concret.",
  },
  {
    name: "David M.",
    metier: "Électricien",
    city: "Roubaix",
    text: "Le fait d'être seulement 2 par ville, ça change tout. Les clients me rappellent parce qu'ils ont le choix entre moi et un autre, pas entre 15 artisans.",
  },
  {
    name: "Sophie L.",
    metier: "Menuiserie PVC/Alu",
    city: "Arras",
    text: "J'ai arrêté ma pub Google à 800€/mois. Avec Artisans Validés, je reçois des demandes qualifiées de clients qui ont un vrai projet et un vrai budget.",
  },
];

const SocialProofSection = () => (
  <section className="py-16 bg-muted/40">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-12"
      >
        <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
          Témoignages bruts
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Ils ont activé leur licence. Voici ce qu'ils en disent.
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Pas de mise en scène. Des artisans du Nord qui parlent de leur expérience.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="h-full border-border/60">
              <CardContent className="p-6">
                <Quote className="w-6 h-6 text-gold/40 mb-3" />
                <p className="text-sm text-foreground leading-relaxed mb-4 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.metier} — {t.city}</p>
                  </div>
                  <div className="ml-auto">
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Vérifié
                    </span>
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
const candidacySchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis (min 2 caractères)").max(100),
  email: z.string().trim().email("Adresse email invalide").max(255),
  phone: z.string().trim().refine(val => validateFrenchPhone(val), { message: "Numéro français invalide" }),
  city: z.string().trim().min(2, "Ville requise").max(100),
  metier: z.string().trim().min(2, "Métier requis").max(100),
});

const stats = [
  { value: "2 max", label: "Artisans par ville" },
  { value: "0%", label: "Commission" },
  { value: "3 à 5", label: "RDV/mois en moyenne" },
  { value: "2h", label: "Délai de rappel" },
];

// --- Main Page ---
const DevenirArtisan = () => {
  const [searchParams] = useSearchParams();
  const missionType = searchParams.get("mission");
  const missionCity = searchParams.get("ville");

  const [isLoading, setIsLoading] = useState(false);
  const [candidacySent, setCandidacySent] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: missionCity || "",
    metier: missionType || "",
  });

  const updateForm = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = candidacySchema.safeParse(formData);
      if (!result.success) {
        toast({ title: "Erreur de validation", description: result.error.errors[0].message, variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const { error: dbError } = await supabase
        .from("partner_candidacies")
        .insert({
          business_name: formData.fullName,
          siret: "00000000000000",
          metier: formData.metier,
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
        });

      if (dbError) throw dbError;

      setCandidacySent(true);
      toast({ title: "Demande reçue !", description: "Un expert vous rappelle sous 2h." });
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation screen
  if (candidacySent) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead title="Demande reçue — Artisans Validés" description="Votre demande d'accès au réseau a bien été reçue." />
        <Navbar />
        <main className="pt-32 lg:pt-20 pb-20">
          <div className="container mx-auto px-4 max-w-md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 shadow-floating text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-primary" />
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                  <p className="font-medium">Demande d'accès reçue !</p>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-4">Demande d'accréditation reçue !</h1>
              <p className="text-muted-foreground mb-6">
                Merci ! <strong className="text-foreground">Jane</strong> ou <strong className="text-foreground">Andrea</strong> vous contacteront sous 24h pour valider votre secteur à <strong className="text-foreground">{formData.city}</strong>.
              </p>
              <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Pas de robot, pas de spam.</strong> C'est un humain qui étudie votre dossier et vérifie vos documents.
                </p>
              </div>
              <Button variant="gold" onClick={() => window.location.href = "/"} className="w-full">Retour à l'accueil</Button>
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
        title="Licence d'accès aux chantiers — Artisans Validés"
        description="Activez votre licence d'accès au flux de chantiers qualifiés. 99€/mois, 0% commission, marketing inclus."
        canonical="https://artisansvalides.fr/devenir-artisan"
      />
      <Navbar />

      <main className="pt-20 lg:pt-20">
        {/* Barre de réassurance */}
        <div className="bg-navy py-2.5 border-b border-white/10">
          <div className="container mx-auto px-4 flex items-center justify-center gap-4 md:gap-8 flex-wrap text-xs md:text-sm text-white/90 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Entreprise Française</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Support 7j/7</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Paiement Sécurisé Stripe</span>
          </div>
        </div>

        {/* Bandeau urgence */}
        <div className="bg-navy-dark overflow-hidden py-2 z-40">
          <motion.div
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            className="whitespace-nowrap text-xs md:text-sm font-semibold text-amber-400 tracking-wide"
          >
            ⚠️ Alerte : Secteurs Bordeaux, Lyon et Nice bientôt complets. 1 seule place restante. &nbsp;&nbsp;&nbsp; ⚠️ Alerte : Secteurs Bordeaux, Lyon et Nice bientôt complets. 1 seule place restante.
          </motion.div>
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-muted/50 to-white py-10 md:py-16 lg:py-24 relative overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            {/* Dynamic Mission Header */}
            <DynamicMissionHeader missionType={missionType} missionCity={missionCity} />

            {/* Zone Banner */}
            <ZoneBanner />

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-10 md:mb-16">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-gold text-navy-dark text-sm font-bold mb-5 shadow-gold">
                <Crown className="w-4 h-4" />
                Licence d'accès aux chantiers
              </div>

              <h1 className="text-xl md:text-4xl lg:text-5xl font-bold text-navy leading-tight mb-4 md:mb-6">
                Accédez à un flux de <span className="text-gradient-gold">chantiers qualifiés</span> à 10 min de votre dépôt.
              </h1>

              <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Votre licence d'accès à des projets pré-qualifiés. Zéro démarchage. Zéro commission.
                <strong className="text-foreground"> Votre abonnement finance nos campagnes pub pour vous apporter des clients.</strong>
              </p>
            </motion.div>

            {/* WhatsApp Alert */}
            <WhatsAppAlert />

            {/* Stats */}
            <div className="hidden md:grid grid-cols-4 gap-6 max-w-2xl mx-auto mb-12">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-gold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 Piliers */}
        <section className="py-10 md:py-16 bg-[#F9FAFB]">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-[15px] md:gap-6 max-w-5xl mx-auto">
              {[
                { icon: Lock, title: "99€/MOIS", description: "Votre licence d'accès au flux de chantiers qualifiés. Un prix fixe, une rentabilité infinie." },
                { icon: Shield, title: "ZÉRO COMMISSION", description: "Vous gardez 100% de votre chiffre d'affaires. Pas de frais cachés, pas de surprise." },
                { icon: Star, title: "MARKETING INCLUS", description: "Votre abonnement finance nos campagnes pub pour vous apporter des clients. Vous, vous bossez." },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="p-7 rounded-2xl bg-white border border-[#FFD700] shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_-4px_rgba(234,179,8,0.25)] transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center shrink-0 shadow-gold">
                      <card.icon className="w-8 h-8 text-navy-dark" />
                    </div>
                    <div>
                      <h3 className="font-black text-navy text-base uppercase tracking-wide mb-2">{card.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Exclusivity notice */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="max-w-3xl mx-auto text-center mt-8"
            >
              <div className="inline-flex items-start gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-5 py-3">
                <Shield className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground text-left">
                  <strong className="text-gold">Attention :</strong> Nous limitons strictement l'accès à{" "}
                  <strong>2 artisans par métier et par ville</strong> pour garantir votre volume de travail.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Formulaire */}
        <section id="formulaire-licence" className="py-12 md:py-20 bg-muted/40">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-lg mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="bg-white rounded-2xl p-5 md:p-8 shadow-[0_12px_48px_-8px_rgba(0,0,0,0.18)] border-2 border-gold/30">
                  <div className="text-center mb-5 md:mb-6">
                    <h2 className="text-lg md:text-xl font-black text-navy mb-1 md:mb-2 uppercase tracking-wide">
                      Activez votre licence d'accès
                    </h2>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2">
                      Remplissez ce formulaire, on vous rappelle sous 2h
                    </p>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-xs font-medium text-gold">
                      99€ HT/mois · 0% commission · Marketing inclus
                    </div>
                    <p className="text-sm font-semibold text-amber-600 animate-pulse mt-2">
                      🔥 Plus que 2 places disponibles sur votre secteur ce mois-ci.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 pb-16 md:pb-0">
                    <div>
                      <Label htmlFor="fullName" className="text-navy text-sm">Prénom / Nom *</Label>
                      <Input id="fullName" placeholder="Jean Dupont" value={formData.fullName} onChange={(e) => updateForm("fullName", e.target.value)} className="mt-1 h-9 md:h-10" required />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-navy text-sm">Adresse Email *</Label>
                      <Input id="email" type="email" placeholder="contact@entreprise.fr" value={formData.email} onChange={(e) => updateForm("email", e.target.value)} className="mt-1 h-9 md:h-10" required />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-navy text-sm">Téléphone *</Label>
                      <div className="mt-1">
                        <FrenchPhoneInput id="phone" value={formData.phone} onChange={(value) => updateForm("phone", value)} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-navy text-sm">Ville *</Label>
                      <Input id="city" placeholder="Ex: Lille, Roubaix, Arras..." value={formData.city} onChange={(e) => updateForm("city", e.target.value)} className="mt-1 h-9 md:h-10" required />
                    </div>
                    <div>
                      <Label htmlFor="metier" className="text-navy text-sm">Métier *</Label>
                      <Input id="metier" placeholder="Ex: Plombier, Électricien, PAC..." value={formData.metier} onChange={(e) => updateForm("metier", e.target.value)} className="mt-1 h-9 md:h-10" required />
                    </div>

                    {/* Desktop submit */}
                    <div className="hidden md:block">
                      <Button
                        type="submit"
                        variant="gold"
                        size="xl"
                        className="w-full !text-lg !py-7 !font-black uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_24px_rgba(234,179,8,0.4)] transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Lock className="w-5 h-5 mr-2" />}
                        {isLoading ? "Vérification..." : "DÉBLOQUER MES CHANTIERS"}
                      </Button>
                      <div className="mt-8 text-center">
                        <p className="text-[14px] font-light text-muted-foreground">
                          99€/mois • Sans commission • Sans engagement
                        </p>
                        <p className="text-[14px] font-bold text-gold mt-2">
                          Validation finale par Jane sous 24h.
                        </p>
                      </div>
                    </div>
                  </form>

                  {/* Mobile sticky submit */}
                  <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-5 py-3 shadow-lg">
                    <Button
                      type="button"
                      variant="gold"
                      size="xl"
                      className="w-full !text-base !py-6 !font-black uppercase tracking-wider"
                      disabled={isLoading}
                      onClick={() => {
                        const form = document.querySelector('form');
                        if (form) form.requestSubmit();
                      }}
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Lock className="w-5 h-5 mr-2" />}
                      {isLoading ? "Vérification..." : "DÉBLOQUER MES CHANTIERS"}
                    </Button>
                    <div className="mt-3 text-center">
                      <p className="text-[11px] font-light text-muted-foreground">99€/mois • Sans commission • Sans engagement</p>
                      <p className="text-[11px] font-bold text-gold mt-0.5">Validation finale par Jane sous 24h.</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp help encart */}
                <div className="mt-6 bg-[#dcf8c6] dark:bg-[#1a3a1a] border border-[#25d366]/30 rounded-xl p-4 flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-[#25d366] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">
                    <strong>Besoin d'aide pour configurer votre compte ?</strong> Contactez votre conseiller Artisans Validés sur{" "}
                    <a href="https://wa.me/33612345678" target="_blank" rel="noopener noreferrer" className="text-[#25d366] font-bold underline hover:no-underline">WhatsApp</a>.
                  </p>
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
                  Rejoignez les <strong className="text-foreground">500+ artisans</strong> qui ont choisi la qualité plutôt que la quantité.
                </motion.p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
                Votre licence d'accès
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Le seul réseau qui ne prend aucune commission sur votre travail.
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Un prix fixe, pas de surprise. Vous gardez 100% de vos devis.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Mensuel */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <Card className="flex flex-col h-full border-2 border-border hover:border-gold/50 transition-colors">
                  <CardHeader className="text-center pb-2 pt-8">
                    <div className="flex justify-center mb-3"><div className="p-3 rounded-full bg-primary/10"><Crown className="w-8 h-8 text-primary" /></div></div>
                    <CardTitle className="text-xl">Licence Mensuelle</CardTitle>
                    <CardDescription>Sans engagement, résiliable à tout moment</CardDescription>
                    <div className="mt-4"><span className="text-4xl font-bold text-foreground">99€</span><span className="text-muted-foreground"> HT/mois</span></div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {["Accès au flux de chantiers qualifiés", "2 places max par ville", "0% commission sur vos devis", "Marketing & pub inclus", "Badge Artisan Validé"].map((f) => (
                        <li key={f} className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 flex-shrink-0 text-gold" /><span>{f}</span></li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-4 mt-auto">
                    <Button variant="outline" size="lg" className="w-full" onClick={() => document.getElementById('formulaire-licence')?.scrollIntoView({ behavior: 'smooth' })}>
                      <Lock className="w-4 h-4 mr-2" /> Activer ma licence
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>

              {/* Annuel */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <div className="relative">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-gold text-navy-dark px-4 py-1.5 rounded-full text-sm font-bold shadow-gold z-10 whitespace-nowrap">
                    👑 LE MEILLEUR DEAL
                  </div>
                  <Card className="flex flex-col h-full border-2 border-gold shadow-lg shadow-gold/10">
                    <CardHeader className="text-center pb-2 pt-8">
                      <div className="flex justify-center mb-3"><div className="p-3 rounded-full bg-gold/20"><Crown className="w-8 h-8 text-gold" /></div></div>
                      <CardTitle className="text-xl">Licence Annuelle</CardTitle>
                      <CardDescription>Badge Audité Offert + 3 RDV Qualifiés Garantis</CardDescription>
                      <div className="mt-4"><span className="text-4xl font-bold text-foreground">990€</span><span className="text-muted-foreground"> HT/an</span></div>
                      <p className="text-sm font-medium text-emerald-600 mt-2">✅ Économisez 198€ vs mensuel</p>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <ul className="space-y-3">
                        {["Tout le plan Mensuel inclus", "Badge Audité offert", "3 RDV qualifiés garantis", "Référencement prioritaire", "Support dédié"].map((f) => (
                          <li key={f} className="flex items-center gap-3 text-sm"><Check className="w-4 h-4 flex-shrink-0 text-gold" /><span className="font-medium">{f}</span></li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="pt-4 mt-auto">
                      <Button variant="gold" size="lg" className="w-full !font-bold" onClick={() => document.getElementById('formulaire-licence')?.scrollIntoView({ behavior: 'smooth' })}>
                        <Lock className="w-5 h-5 mr-2" /> ACTIVER MA LICENCE <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </motion.div>
            </div>

            {/* Charte Artisans Validés */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto mt-16"
            >
              <div className="text-center mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-navy">La Charte Artisans Validés</h3>
                <p className="text-muted-foreground mt-2">Notre contrat de confiance, noir sur blanc.</p>
              </div>
              <div className="grid sm:grid-cols-3 gap-5">
                {[
                  { icon: Shield, title: "Pas de faux leads", desc: "Uniquement des missions vérifiées par notre équipe. Zéro faux numéro, zéro demande bidon." },
                  { icon: Lock, title: "Liberté totale", desc: "Vous n'êtes pas enchaîné. Résiliez quand vous voulez, sans frais cachés ni préavis abusif." },
                  { icon: CheckCircle2, title: "Éthique absolue", desc: "Nous ne vendons vos coordonnées à personne. Jamais. Vos données restent les vôtres." },
                ].map((item, i) => (
                  <div key={item.title} className="bg-muted/60 border border-border rounded-xl p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-navy" />
                    </div>
                    <h4 className="font-bold text-navy mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Social Proof Testimonials */}
        <SocialProofSection />

        {/* How it works */}
        <section className="py-16 lg:py-24 bg-white">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">Comment ça marche ?</h2>
            </motion.div>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { step: "01", title: "Demander ma licence", desc: "Remplissez le formulaire en 30 secondes" },
                { step: "02", title: "Rappel sous 2h", desc: "On vérifie votre secteur et vos assurances" },
                { step: "03", title: "Vérification humaine", desc: "Audit par Jane : assurances décennales, références, avis." },
                { step: "04", title: "C'est parti", desc: "Votre licence est activée, les clients vous contactent" },
              ].map((item, index) => (
                <motion.div key={item.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-4 text-navy-dark font-bold text-xl shadow-gold">{item.step}</div>
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
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Votre ville est peut-être encore disponible.</h2>
                <p className="text-white/70 mb-8 max-w-xl mx-auto">2 licences max par secteur. Quand c'est pris, c'est pris.</p>
                <Button variant="gold" size="xl" onClick={() => document.getElementById('formulaire-licence')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Lock className="w-5 h-5 mr-2" /> ACTIVER MA LICENCE <ArrowRight className="w-5 h-5 ml-2" />
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
