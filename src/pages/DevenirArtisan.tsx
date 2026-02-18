import { useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  Loader2,
  Lock,
  Crown,
  Check,
  Phone,
  MapPin,
  MessageCircle,
  Quote,
  FileText,
  Search,
  Rocket,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

// --- Marquee Banner ---
const MarqueeBanner = () => (
  <div className="bg-navy overflow-hidden py-2.5 shadow-[0_4px_16px_-2px_rgba(26,43,72,0.25)] relative z-40">
    <motion.div
      animate={{ x: ["100%", "-100%"] }}
      transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      className="whitespace-nowrap text-xs md:text-sm font-semibold text-gold tracking-wide"
    >
      🔒 Accès limité : 2 places restantes à Lille · 1 place à Roubaix · Complet à Valenciennes · 1 place à Arras · Complet à Douai · 2 places à Cambrai &nbsp;&nbsp;&nbsp;&nbsp; 🔒 Accès limité : 2 places restantes à Lille · 1 place à Roubaix · Complet à Valenciennes · 1 place à Arras · Complet à Douai · 2 places à Cambrai
    </motion.div>
  </div>
);

// --- Money Section: Comparatif choc ---
const ComparisonSection = () => (
  <section className="py-16 lg:py-24 bg-secondary/50">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
          Le vrai calcul
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Comparez et décidez.
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Lead classique */}
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <Card className="h-full border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Le Lead Classique</h3>
                  <p className="text-xs text-muted-foreground">Ce que vous payez aujourd'hui</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  "30 à 80€ par lead",
                  "Vendu à 5 artisans en même temps",
                  "Contact non vérifié, souvent faux numéro",
                  "Aucune exclusivité territoriale",
                  "Commission sur chaque chantier signé",
                  "Vous courez après le client",
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

        {/* Licence AV */}
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <Card className="h-full border-2 border-gold shadow-lg shadow-gold/10">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">La Licence Artisans Validés</h3>
                  <p className="text-xs text-gold font-medium">Ce que vous méritez</p>
                </div>
              </div>
              <ul className="space-y-4">
                {[
                  "99€/mois, prix fixe et prévisible",
                  "Maximum 2 artisans par ville et par métier",
                  "Clients pré-qualifiés, projet réel vérifié",
                  "Exclusivité territoriale garantie",
                  "0% de commission, vous gardez tout",
                  "Le client vient à vous directement",
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

// --- Territory Widget ---
const TerritoryWidget = () => (
  <section className="py-12 lg:py-16 bg-navy relative overflow-hidden">
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
    </div>
    <div className="container mx-auto px-4 lg:px-8 relative z-10">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 md:p-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
            <AlertTriangle className="w-4 h-4 text-gold" />
            <span className="text-sm font-bold text-gold animate-pulse">PLACES LIMITÉES</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-wide">
            Disponibilité dans le Nord : <span className="text-gold">1 place restante</span>
          </h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            Nous limitons strictement à 2 artisans par métier et par ville. Quand c'est pris, c'est pris.
          </p>
          <Button variant="gold" size="xl" className="!font-black !text-lg uppercase tracking-wider glow-gold-hover" onClick={() => document.getElementById('formulaire-licence')?.scrollIntoView({ behavior: 'smooth' })}>
            <MapPin className="w-5 h-5 mr-2" /> VÉRIFIER MON ÉLIGIBILITÉ <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </motion.div>
    </div>
  </section>
);

// --- Dashboard Preview ---
const DashboardPreview = () => (
  <section className="py-16 lg:py-24 bg-secondary/50">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">
            Votre futur quotidien
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            C'est ce que vous recevrez dès que votre audit sera validé.
          </h2>
        </div>

        {/* Fake dashboard */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
          <div className="bg-navy rounded-2xl p-6 md:p-8 shadow-[0_16px_64px_-8px_rgba(26,43,72,0.4)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Cockpit Artisan</p>
                  <p className="text-white/40 text-xs">3 nouvelles missions aujourd'hui</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 border border-gold/30">
                <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                <span className="text-xs text-gold font-medium">En ligne</span>
              </div>
            </div>

            {/* WhatsApp notification */}
            <div className="bg-[#dcf8c6]/20 border border-[#25d366]/30 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25d366]/20 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-[#25d366]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-bold text-sm">📲 WhatsApp — Artisans Validés</p>
                    <span className="text-white/40 text-xs">il y a 3 min</span>
                  </div>
                  <p className="text-white/80 text-sm">
                    🔔 <strong className="text-gold">Nouveau projet :</strong> Rénovation complète 25 000€ à 12km de vous. Client vérifié, budget confirmé.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <span className="px-3 py-1.5 rounded-lg bg-gold/20 text-gold text-xs font-bold cursor-pointer hover:bg-gold/30 transition-colors">
                      ✅ Répondre
                    </span>
                    <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-xs cursor-pointer hover:bg-white/20 transition-colors">
                      Voir détails
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Ce mois", value: "5 missions", color: "text-gold" },
                { label: "Taux de réponse", value: "92%", color: "text-[#25d366]" },
                { label: "CA estimé", value: "18 400€", color: "text-white" },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-lg p-3 text-center">
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-white/40 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  </section>
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
  <section className="py-16 bg-secondary/50 border-y border-border">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">Témoignages bruts</span>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Ils ont rejoint l'Alliance. Voici ce qu'ils en disent.</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Pas de mise en scène. Des artisans du Nord qui parlent de leur expérience.</p>
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
                    <span className="text-xs text-success font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Vérifié</span>
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

// --- Risk Reversal ---
const RiskReversal = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto mt-8">
    <div className="bg-navy rounded-2xl p-6 shadow-[0_8px_32px_-4px_rgba(26,43,72,0.25)]">
      <div className="text-center mb-4">
        <h3 className="text-white font-black text-lg uppercase tracking-wide">Sans engagement.</h3>
        <p className="text-gold font-bold text-base mt-1">Testez un mois. Si vous ne décrochez pas de chantier, vous coupez.</p>
      </div>
      <div className="space-y-3 mb-5">
        {[
          "Inscription sans frais",
          "Audit humain sous 24h",
          "Activation après validation uniquement",
        ].map((item) => (
          <div key={item} className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
            <span className="text-white text-sm font-medium">{item}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 pt-4">
        <p className="text-xs text-white/70 leading-relaxed">
          Nous ne sommes pas des vendeurs de leads. Nous sommes un <strong className="text-gold">réseau de confiance</strong>. Aucun paiement ne vous sera demandé avant que votre dossier ne soit validé par notre équipe.
        </p>
      </div>
    </div>
  </motion.div>
);

// --- Schema ---
const partnerSchema = z.object({
  fullName: z.string().trim().min(2, "Nom complet requis (min 2 caractères)").max(100),
  email: z.string().trim().email("Adresse email invalide").max(255),
  phone: z.string().trim().refine(val => validateFrenchPhone(val), { message: "Numéro français invalide" }),
  city: z.string().trim().min(2, "Ville requise").max(100),
  metier: z.string().trim().min(2, "Métier requis").max(100),
});

// --- Main Page ---
const DevenirArtisan = () => {
  const [searchParams] = useSearchParams();
  const missionType = searchParams.get("mission");
  const missionCity = searchParams.get("ville");

  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
      const result = partnerSchema.safeParse(formData);
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
          status: "pending",
        });
      if (dbError) throw dbError;

      // Notify admins
      const { data: adminUsers } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      if (adminUsers) {
        for (const admin of adminUsers) {
          await supabase.rpc("create_notification", {
            p_user_id: admin.user_id,
            p_type: "new_candidacy",
            p_title: "Nouvelle candidature artisan",
            p_message: `${formData.fullName} (${formData.metier}) à ${formData.city} souhaite rejoindre le réseau.`,
            p_related_id: null,
          });
        }
      }

      // Send notification email
      try {
        await supabase.functions.invoke("send-preregistration-email", {
          body: { email: formData.email, name: formData.fullName, metier: formData.metier, city: formData.city },
        });
      } catch {}

      setSubmitted(true);
      toast({ title: "Candidature envoyée !", description: "Notre équipe va étudier votre dossier sous 24h." });
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Une erreur est survenue", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-16 lg:pt-20 pb-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-lg mx-auto text-center py-20">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
                <div className="w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-12 h-12 text-gold" />
                </div>
              </motion.div>
              <h1 className="text-3xl font-bold text-foreground mb-4">Candidature reçue ✅</h1>
              <p className="text-muted-foreground mb-8">
                Merci <strong className="text-foreground">{formData.fullName}</strong> ! Notre équipe va étudier votre dossier et vérifier la disponibilité de votre zone à <strong className="text-gold">{formData.city}</strong>. Réponse sous 24h max.
              </p>
              <Button variant="gold" size="lg" onClick={() => window.location.href = "/"}>
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Rejoindre le réseau Artisans Validés — Licence exclusive"
        description="Accédez à des chantiers pré-qualifiés sur votre secteur. Maximum 2 artisans par ville. 0% commission. Inscription gratuite, audit sous 24h."
        canonical="https://artisansvalides.fr/devenir-artisan"
      />
      <Navbar />

      <main className="pt-16 lg:pt-20">
        {/* Trust bar */}
        <div className="bg-navy py-2.5 border-b border-white/10">
          <div className="container mx-auto px-4 flex items-center justify-center gap-4 md:gap-8 flex-wrap text-xs md:text-sm text-white/90 font-medium">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold fill-gold/20" /> Entreprise Française</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold fill-gold/20" /> Support 7j/7</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-gold fill-gold/20" /> Paiement Sécurisé Stripe</span>
          </div>
        </div>

        {/* Marquee */}
        <MarqueeBanner />

        {/* Hero — Crochet Psychologique */}
        <section className="bg-gradient-to-b from-secondary/50 to-background py-12 md:py-20 lg:py-28 relative overflow-hidden">
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto mb-10 md:mb-16">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-gold text-primary-foreground text-sm font-bold mb-6 shadow-gold">
                <Shield className="w-4 h-4" />
                Réseau sélectif — Inscription gratuite
              </div>

              <h1 className="text-2xl md:text-4xl lg:text-[3.25rem] font-black text-foreground leading-[1.1] mb-5 md:mb-7 uppercase tracking-tight">
                Arrêtez de chercher vos chantiers.<br />
                <span className="text-gradient-gold">Commencez à les choisir.</span>
              </h1>

              <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Accédez à la licence exclusive Artisans Validés. Un flux continu de missions pré-qualifiées sur votre secteur.
                <strong className="text-foreground"> Pas de commission. Pas de concurrence déloyale.</strong>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button variant="gold" size="xl" className="!font-black !text-base md:!text-lg uppercase tracking-wider glow-gold-hover" onClick={() => document.getElementById('formulaire-licence')?.scrollIntoView({ behavior: 'smooth' })}>
                   <Shield className="w-5 h-5 mr-2" /> VÉRIFIER MA ZONE & RÉSERVER MON ACCÈS <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-10">
                {[
                  { value: "2 max", label: "Artisans par ville" },
                  { value: "0%", label: "Commission" },
                  { value: "3 à 5", label: "RDV/mois en moyenne" },
                  { value: "24h", label: "Délai d'audit" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-xl md:text-2xl font-bold text-gold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Money Section — Comparatif choc */}
        <ComparisonSection />

        {/* Territory Widget */}
        <TerritoryWidget />

        {/* Dashboard Preview */}
        <DashboardPreview />

        {/* Parcours d'Intégration */}
        <section className="py-16 lg:py-24 bg-navy relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-gold/20 text-gold text-sm font-medium mb-4">Audit & Validation</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Votre Parcours d'Intégration</h2>
              <p className="text-white/60 max-w-xl mx-auto">Un processus rigoureux pour garantir l'excellence du réseau.</p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: "01", icon: FileText, title: "Réservation de votre Zone", desc: "Indiquez votre secteur d'intervention pour vérifier la disponibilité des places. Gratuit et sans engagement." },
                { step: "02", icon: Search, title: "Audit de conformité", desc: "Jane valide votre profil et vos assurances sous 24h. Décennales, références et avis clients passés au crible." },
                { step: "03", icon: Rocket, title: "Activation du Cockpit", desc: "Une fois validé, accédez à votre radar et à la liste des missions qualifiées." },
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

        {/* Social Proof */}
        <SocialProofSection />

        {/* Formulaire */}
        <section id="formulaire-licence" className="py-12 md:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-lg mx-auto">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 md:p-8 shadow-lg border border-gold/20">
                  <div className="text-center mb-5 md:mb-6">
                   <h2 className="text-lg md:text-xl font-black text-foreground mb-1 md:mb-2 uppercase tracking-wide">
                      Réservez votre accès
                    </h2>
                    <p className="text-xs md:text-sm text-gold font-semibold mb-1">
                      💰 Revenus estimés sur votre secteur : 18 400€ de chantiers disponibles ce mois-ci.
                    </p>
                     <p className="text-xs md:text-sm text-muted-foreground mb-1">
                       Gratuit · Sans engagement · Audit sous 24h
                     </p>
                     <p className="text-xs text-muted-foreground">
                       🔒 Validation finale de votre accès par <strong className="text-foreground">Jane</strong> après examen de votre dossier.
                     </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 pb-16 md:pb-0">
                    <div>
                      <Label htmlFor="fullName" className="text-foreground text-sm">Prénom / Nom *</Label>
                      <Input id="fullName" placeholder="Jean Dupont" value={formData.fullName} onChange={(e) => updateForm("fullName", e.target.value)} className="mt-1 h-9 md:h-10" required />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground text-sm">Adresse Email *</Label>
                      <Input id="email" type="email" placeholder="contact@entreprise.fr" value={formData.email} onChange={(e) => updateForm("email", e.target.value)} className="mt-1 h-9 md:h-10" required />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-foreground text-sm">Téléphone *</Label>
                      <div className="mt-1">
                        <FrenchPhoneInput id="phone" value={formData.phone} onChange={(value) => updateForm("phone", value)} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-foreground text-sm">Ville *</Label>
                      <Input id="city" placeholder="Ex: Lille, Roubaix, Arras..." value={formData.city} onChange={(e) => updateForm("city", e.target.value)} className="mt-1 h-9 md:h-10" required />
                    </div>
                    <div>
                      <Label htmlFor="metier" className="text-foreground text-sm">Métier *</Label>
                      <Input id="metier" placeholder="Ex: Plombier, Électricien, PAC..." value={formData.metier} onChange={(e) => updateForm("metier", e.target.value)} className="mt-1 h-9 md:h-10" required />
                    </div>

                    {/* Desktop submit */}
                    <div className="hidden md:block">
                      <Button
                        type="submit"
                        variant="gold"
                        size="xl"
                        className="w-full !text-lg !py-7 !font-black uppercase tracking-wider hover:brightness-110 hover:shadow-[0_0_24px_rgba(234,179,8,0.4)] transition-all duration-300 glow-gold-hover"
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Shield className="w-5 h-5 mr-2" />}
                        {isLoading ? "Vérification..." : "VÉRIFIER MA ZONE & RÉSERVER MON ACCÈS"}
                      </Button>
                      <p className="text-xs text-muted-foreground mt-3 text-center">
                        🔒 Validation finale par <strong className="text-foreground">Khalid</strong> sous 24h après audit de vos documents.
                      </p>
                    </div>
                  </form>

                  {/* Mobile sticky submit */}
                  <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-5 py-3 shadow-lg">
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
                      {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Shield className="w-5 h-5 mr-2" />}
                      {isLoading ? "Vérification..." : "RÉSERVER MON ACCÈS"}
                    </Button>
                    <div className="mt-2 text-center">
                      <p className="text-[11px] font-light text-muted-foreground">Gratuit · Sans engagement · Audit sous 24h</p>
                    </div>
                  </div>
                </div>

                {/* Risk Reversal */}
                <RiskReversal />

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

        {/* CTA Final */}
        <section className="py-16 lg:py-20 bg-secondary/30">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-navy rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden shadow-[0_16px_64px_-8px_rgba(26,43,72,0.4)]">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full blur-3xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">Votre ville est peut-être encore disponible.</h2>
                <p className="text-white/60 mb-8 max-w-xl mx-auto">2 licences max par secteur. Quand c'est pris, c'est pris.</p>
                <Button variant="gold" size="xl" onClick={() => document.getElementById('formulaire-licence')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Shield className="w-5 h-5 mr-2" /> REJOINDRE L'ALLIANCE <ArrowRight className="w-5 h-5 ml-2" />
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
