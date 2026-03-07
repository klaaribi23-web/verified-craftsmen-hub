import { useState, useEffect, useRef } from "react";
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
  MapPin,
  Wrench,
  MessageCircle,
  ArrowRight,
  Loader2,
  Quote,
  Award,
  Target,
  Euro,
  Bell,
  TrendingUp,
  Lock,
  Mail,
  User,
  Phone,
} from "lucide-react";

// --- Floating WhatsApp Button ---
const WhatsAppButton = () => (
  <a
    href="https://wa.me/33612345678?text=Bonjour%20Andrea%2C%20je%20souhaite%20en%20savoir%20plus%20sur%20la%20licence%20Artisans%20Valid%C3%A9s."
    target="_blank"
    rel="noopener noreferrer"
    className="group fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25d366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
    aria-label="Parler à Andrea"
  >
    <MessageCircle className="w-6 h-6 text-white" />
    <span className="absolute -top-8 right-0 bg-white text-navy text-xs font-bold px-2 py-1 rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
      Parler à Andrea
    </span>
  </a>
);

// --- SECTION 1: HERO ---
const HeroSection = ({ onCTA }: { onCTA: () => void }) => (
  <section className="bg-primary relative overflow-hidden">
    {/* Ticker */}
    <div className="bg-primary/90 border-b border-primary-foreground/10 overflow-hidden py-2.5">
      <motion.div
        animate={{ x: ["100%", "-100%"] }}
        transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        className="whitespace-nowrap text-xs md:text-sm font-semibold text-gold tracking-wide"
      >
        🔒 Places limitées — 2 artisans max par ville et par métier · Audit sous 24h · Exclusivité garantie
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        🔒 Places limitées — 2 artisans max par ville et par métier · Audit sous 24h · Exclusivité garantie
      </motion.div>
    </div>

    <div className="py-16 md:py-24 lg:py-32 relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold rounded-full blur-3xl" />
      </div>
      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gold/20 border border-gold/30 mb-8">
            <Shield className="w-4 h-4 text-gold" />
            <span className="text-sm font-bold text-gold">🔒 Réseau sélectif — Places limitées</span>
          </div>

          <h1 className="text-[clamp(28px,7vw,44px)] md:text-5xl lg:text-6xl font-black text-primary-foreground leading-[1.1] mb-6 tracking-tight">
            Arrêtez de chercher vos chantiers.
            <br />
            <span className="text-gradient-gold">Commencez à les choisir.</span>
          </h1>

          <p className="text-base md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Accédez à la licence exclusive Artisans Validés. Un flux continu de missions pré-qualifiées sur votre secteur.{" "}
            <strong className="text-primary-foreground">Pas de commission. Pas de concurrence déloyale.</strong>
          </p>

          <Button
            variant="gold"
            size="xl"
            className="w-full sm:w-auto !font-black !text-base md:!text-lg uppercase tracking-wider whitespace-normal text-center px-6"
            onClick={onCTA}
          >
            VÉRIFIER MA ZONE & RÉSERVER MON ACCÈS <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" />
          </Button>

          {/* 4 Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto">
            {[
              { value: "2 max", label: "Artisans par ville" },
              { value: "0%", label: "Commission" },
              { value: "3 à 5", label: "Missions/mois estimées" },
              { value: "24h", label: "Délai d'audit" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-[clamp(28px,7vw,40px)] md:text-3xl font-black text-gold">{s.value}</p>
                <p className="text-[11px] md:text-xs text-primary-foreground/60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

// --- SECTION 2: COMPARATIF ---
const ComparisonSection = ({ onCTA }: { onCTA: () => void }) => (
  <section className="py-16 lg:py-24 bg-secondary">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Le vrai calcul. Comparez et décidez.</h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Lead Classique */}
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <Card className="h-full border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 md:p-8">
              <div className="mb-6">
                <h3 className="font-bold text-lg text-foreground">Le Lead Classique</h3>
                <p className="text-xs text-muted-foreground">Ce que vous payez aujourd'hui</p>
              </div>
              <ul className="space-y-3">
                {[
                  "30 à 80€ par lead",
                  "Vendu à 5 artisans simultanément",
                  "Contact non vérifié, souvent faux numéro",
                  "Aucune exclusivité territoriale",
                  "Commission sur chaque chantier signé",
                  "Vous courez après le client",
                  "Coût moyen : 400 à 1 200€/mois",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[13px] md:text-sm">
                    <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                    <span className="text-foreground break-words">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-destructive/10 rounded-lg text-center">
                <p className="text-xs text-muted-foreground">Pour des résultats aléatoires</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Licence AV */}
        <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <Card className="h-full border-2 border-gold shadow-lg shadow-gold/10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-navy text-xs font-black px-4 py-1 rounded-full uppercase">
              Meilleur choix
            </div>
            <CardContent className="p-4 md:p-8 pt-8">
              <div className="mb-6">
                <h3 className="font-bold text-lg text-foreground">La Licence Artisans Validés</h3>
                <p className="text-xs text-gold font-medium">Ce que vous méritez</p>
              </div>
              <ul className="space-y-3">
                {[
                  "99€/mois, prix fixe et prévisible",
                  "Maximum 2 artisans par ville et métier",
                  "Clients pré-qualifiés, projet réel vérifié",
                  "Exclusivité territoriale garantie",
                  "0% de commission, vous gardez tout",
                  "Accès fournisseurs négociés — achetez mieux, margez mieux",
                  "Le client vient à vous directement",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[13px] md:text-sm">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium break-words">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 p-4 bg-gold/10 rounded-lg text-center">
                <p className="text-sm font-bold text-gold">Un seul chantier rentabilise l'année</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="text-center mt-10">
        <Button variant="gold" size="xl" onClick={onCTA} className="w-full sm:w-auto !font-black uppercase tracking-wider whitespace-normal text-center px-6">
          VÉRIFIER MON ÉLIGIBILITÉ <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" />
        </Button>
      </div>
    </div>
  </section>
);

// --- SECTION 3: LES 3 PILIERS ---
const PillarsSection = () => (
  <section className="py-16 lg:py-24 bg-primary relative overflow-hidden">
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gold/10 blur-3xl" />
    </div>
    <div className="container mx-auto px-4 lg:px-8 relative z-10">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
        <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
          L'Alliance Artisans Validés — bien plus qu'une plateforme
        </h2>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
        {[
          {
            icon: Target,
            title: "Clients qualifiés, exclusivité garantie",
            desc: "2 artisans maximum par ville et par métier. Zéro commission sur vos chantiers. Les clients viennent à vous.",
          },
          {
            icon: Shield,
            title: "Accompagnement terrain et stratégique",
            desc: "Andrea valide votre dossier et notre équipe vous accompagne dans votre développement commercial. Pas juste une plateforme — un partenaire.",
          },
          {
            icon: Euro,
            title: "Achetez mieux, margez mieux",
            desc: "Artisans Validés négocie pour vous auprès de fournisseurs sélectionnés. Panneaux solaires, PAC, matériaux de rénovation — des tarifs préférentiels réservés aux membres du réseau.",
          },
        ].map((p, i) => (
          <motion.div
            key={p.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
          >
            <Card className="h-full border-border/40 bg-card/60 backdrop-blur">
              <CardContent className="p-4 md:p-8 text-center">
                <div className="w-14 h-14 rounded-full border-2 border-gold bg-gold/10 flex items-center justify-center mx-auto mb-5">
                  <p.icon className="w-7 h-7 text-gold" />
                </div>
                <h3 className="font-bold text-foreground text-[15px] md:text-lg mb-3">{p.title}</h3>
                <p className="text-[13px] md:text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// --- SECTION 4: FOMO ---
const FOMOSection = ({ onCTA }: { onCTA: () => void }) => (
  <section className="py-16 lg:py-20 bg-secondary relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-gold/5 to-transparent" />
    <div className="container mx-auto px-4 lg:px-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/20 border border-gold/30 mb-6">
          <Lock className="w-4 h-4 text-gold" />
          <span className="text-sm font-black text-gold uppercase">Places limitées</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
          Nous limitons strictement à 2 artisans par métier et par ville.
          <br />
          <span className="text-gold">Quand c'est pris, c'est pris.</span>
        </h2>
        <p className="text-muted-foreground mb-8">Disponibilité dans votre zone : vérifiez maintenant</p>
        <Button variant="gold" size="xl" onClick={onCTA} className="w-full sm:w-auto !font-black uppercase tracking-wider whitespace-normal text-center px-6">
          VÉRIFIER MON ÉLIGIBILITÉ <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" />
        </Button>
      </motion.div>
    </div>
  </section>
);

// --- SECTION 5: COCKPIT SIMULATION ---
const CockpitSection = () => (
  <section className="py-16 lg:py-24 bg-primary relative overflow-hidden">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">Votre futur quotidien</h2>
        <p className="text-primary-foreground/60">Ce que vous recevrez dès que votre audit sera validé.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-lg mx-auto"
      >
        <Card className="border-2 border-gold/20 bg-card/80 backdrop-blur overflow-hidden">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-primary px-5 py-3 border-b border-primary-foreground/20 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-primary-foreground/60 font-mono">cockpit-artisan.av</span>
            </div>

            <div className="p-5 space-y-4">
              {/* Missions */}
              <div className="flex items-center gap-3 p-3 bg-gold/10 rounded-lg border border-gold/20">
                <TrendingUp className="w-5 h-5 text-gold flex-shrink-0" />
                <p className="text-sm font-bold text-foreground">3 nouvelles missions aujourd'hui</p>
              </div>

              {/* Notification */}
              <div className="p-3 bg-card rounded-lg border border-border">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gold font-bold mb-1">🔔 Nouveau projet</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      Rénovation complète 25 000€ à 12km de vous. Client vérifié, budget confirmé.
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                {[
                  { value: "5", label: "Missions ce mois" },
                  { value: "92%", label: "Taux de réponse" },
                  { value: "18 400€", label: "CA estimé" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-2 bg-primary/60 rounded-lg">
                    <p className="text-sm md:text-lg font-black text-gold">{s.value}</p>
                    <p className="text-[9px] md:text-[10px] text-primary-foreground/50 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  </section>
);

// --- SECTION 6: PARCOURS D'INTÉGRATION ---
const IntegrationSection = () => (
  <section className="py-16 lg:py-24 bg-secondary">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
        <span className="inline-block px-4 py-1.5 rounded-full bg-gold/10 text-gold text-sm font-medium mb-4">Audit & Validation</span>
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Votre Parcours d'Intégration</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">Un processus rigoureux pour garantir l'excellence du réseau.</p>
      </motion.div>

      <div className="max-w-2xl mx-auto space-y-0">
        {[
          {
            num: "01",
            title: "Réservation de votre Zone",
            desc: "Indiquez votre secteur d'intervention pour vérifier la disponibilité des places. Gratuit et sans engagement.",
          },
          {
            num: "02",
            title: "Audit de conformité",
            desc: "Andrea valide votre profil et vos assurances sous 24h. Décennales, références et avis clients passés au crible.",
          },
          {
            num: "03",
            title: "Activation du Cockpit",
            desc: "Une fois validé, accédez à votre radar et à la liste des missions qualifiées sur votre secteur exclusif.",
          },
        ].map((step, i) => (
          <motion.div
            key={step.num}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="relative flex gap-6 pb-10 last:pb-0"
          >
            {/* Vertical line */}
            {i < 2 && (
              <div className="absolute left-[27px] top-14 w-0.5 h-[calc(100%-56px)] bg-gradient-to-b from-gold/60 to-gold/10" />
            )}
            {/* Number circle */}
            <div className="flex-shrink-0 w-14 h-14 rounded-full border-2 border-gold bg-primary flex items-center justify-center z-10">
              <span className="text-sm font-black text-gold">{step.num}</span>
            </div>
            <div className="pt-2">
              <h3 className="font-bold text-foreground text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

// --- SECTION 7: TÉMOIGNAGES ---
const testimonials = [
  {
    headline: "Aujourd'hui je tourne au bouche à oreille.",
    text: "Je galérais à trouver mes premiers clients. Artisans Validés m'a pris en main — sous-traitance au départ, puis des particuliers en direct. Ce qui m'a vraiment surpris c'est l'accès aux fournisseurs négociés. J'achète mes panneaux mieux qu'avant et je marge mieux sur chaque chantier. Aujourd'hui je tourne principalement au bouche à oreille.",
    name: "Anthony B.",
    metier: "Panneaux solaires & Batteries",
    city: "Saint-Venant (62)",
  },
  {
    headline: "Des clients qualifiés dès le premier mois.",
    text: "Venant du monde de l'énergie en tant que Directeur des Opérations, j'avais des exigences élevées quand j'ai créé ma boîte. Artisans Validés les a tenues. Clients qualifiés, accompagnement stratégique, et des conseils fournisseurs qui m'ont permis d'optimiser mes marges dès le départ. Un vrai réseau professionnel.",
    name: "Louis R.",
    metier: "PAC & Panneaux solaires",
    city: "Bordeaux (33)",
  },
  {
    headline: "J'achète mieux, je marge mieux sur chaque chantier.",
    text: "Ce qui m'a convaincu c'est l'accompagnement global. Pas juste des contacts clients — une vraie stratégie de développement, des conseils sur mes achats matériaux, et un suivi qui fait la différence sur les marges. Sur la rénovation d'ampleur les volumes sont importants — acheter mieux c'est gagner plusieurs milliers d'euros par chantier.",
    name: "Stéphane D.",
    metier: "Rénovation d'ampleur",
    city: "Armentières (59)",
  },
];

const TestimonialsSection = () => (
  <section className="py-16 lg:py-24 bg-card border-y border-primary/10">
    <div className="container mx-auto px-4 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Témoignages bruts</h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Ils ont rejoint l'Alliance. Voici ce qu'ils en disent.
          <br />
          Pas de mise en scène. Des artisans qui parlent de leur expérience.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <Card className="h-full border-border/60">
              <CardContent className="p-6">
                <Quote className="w-6 h-6 text-gold/40 mb-3" />
                <p className="text-lg font-bold text-gold mb-3 leading-snug">"{t.headline}"</p>
                <p className="text-[13px] text-foreground leading-relaxed mb-4 italic break-words">"{t.text}"</p>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.metier} — {t.city}</p>
                    </div>
                    <div className="ml-auto flex-shrink-0">
                      <span className="text-xs text-emerald-500 font-medium flex items-center gap-1 whitespace-nowrap">
                        <CheckCircle2 className="w-3 h-3" /> Membre vérifié
                      </span>
                    </div>
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

// --- AVAILABILITY TICKER ---
const AVAILABILITY_MESSAGES = [
  "🔴 Bordeaux — Plomberie : 1 place restante",
  "🟢 Lyon — Électricité : disponible",
  "🔴 Lille — Menuiserie : 1 place restante",
  "🟢 Paris — Chauffage PAC : disponible",
  "🔴 Marseille — Solaire : complet",
];

const AvailabilityTicker = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % AVAILABILITY_MESSAGES.length);
        setVisible(true);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-primary border border-gold/20 rounded-lg px-4 py-2.5 mb-6 text-center">
      <p
        className={`text-[13px] font-semibold text-primary-foreground/90 transition-opacity duration-300 break-words ${visible ? "opacity-100" : "opacity-0"}`}
      >
        {AVAILABILITY_MESSAGES[index]}
      </p>
    </div>
  );
};

// --- SECTION 8: FORMULAIRE ---
const formSchema = z.object({
  firstName: z.string().trim().min(2, "Prénom requis").max(50),
  lastName: z.string().trim().min(2, "Nom requis").max(50),
  email: z.string().trim().email("Email invalide").max(255),
  phone: z.string().trim().refine((val) => validateFrenchPhone(val), { message: "Numéro français invalide" }),
  city: z.string().trim().min(2, "Ville requise").max(100),
  metier: z.string().trim().min(2, "Métier requis").max(100),
});

const FormSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    metier: "",
  });

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
        business_name: `${formData.firstName} ${formData.lastName}`,
        siret: "00000000000000",
        metier: formData.metier,
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
      });
      if (dbError) throw dbError;

      // Send confirmation email
      try {
        await supabase.functions.invoke("send-notification-email", {
          body: {
            type: "artisan_approved",
            recipientEmail: formData.email,
            recipientFirstName: formData.firstName,
            senderName: "Artisans Validés",
          },
        });
      } catch {
        // Non-blocking
      }

      setSubmitted(true);
      toast({ title: "Zone réservée !", description: "Notre équipe vous contacte sous 24h." });
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
              <CheckCircle2 className="w-8 h-8 text-gold" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Zone réservée !</h2>
            <p className="text-muted-foreground mb-6">
              Notre équipe analyse votre dossier et vous recontacte sous 24h.
            </p>
            <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-gold font-bold flex items-center justify-center gap-2">
                <Award className="w-4 h-4" /> Artisan Fondateur — parmi les premiers de votre ville
              </p>
            </div>
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
            <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-6">Réservez votre accès</h2>

            {/* Gold encart */}
            <div className="bg-gold/10 border border-gold/30 rounded-xl p-4 mb-4 text-center">
              <p className="text-sm text-gold font-medium">
                💰 Rejoignez un réseau en construction volontairement limité. Soyez parmi les artisans fondateurs de votre ville.
              </p>
            </div>

            <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 mb-3 text-center">
              <p className="text-sm text-gold font-bold flex items-center justify-center gap-2">
                <Award className="w-4 h-4" /> Artisan Fondateur — parmi les premiers de votre ville
              </p>
            </div>

            {/* Availability ticker */}
            <AvailabilityTicker />

            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-gold border-2 border-primary/30">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName" className="text-foreground text-sm">Prénom *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="firstName" placeholder="Jean" value={formData.firstName} onChange={(e) => updateForm("firstName", e.target.value)} className="pl-10" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="lastName" className="text-foreground text-sm">Nom *</Label>
                    <Input id="lastName" placeholder="Dupont" value={formData.lastName} onChange={(e) => updateForm("lastName", e.target.value)} className="mt-1" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email" className="text-foreground text-sm">Email *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="jean@exemple.fr" value={formData.email} onChange={(e) => updateForm("email", e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-foreground text-sm">Téléphone *</Label>
                  <div className="mt-1">
                    <FrenchPhoneInput id="phone" value={formData.phone} onChange={(value) => updateForm("phone", value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="city" className="text-foreground text-sm">Ville *</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="city" placeholder="Lille" value={formData.city} onChange={(e) => updateForm("city", e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="metier" className="text-foreground text-sm">Métier *</Label>
                  <div className="relative mt-1">
                    <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                    <select
                      id="metier"
                      value={formData.metier}
                      onChange={(e) => updateForm("metier", e.target.value)}
                      required
                      className="w-full min-h-[52px] pl-10 pr-4 rounded-md border border-border bg-background text-foreground text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <option value="" disabled>Sélectionner votre métier...</option>
                      {[
                        "Plomberie & Sanitaire",
                        "Électricité",
                        "Chauffage & PAC",
                        "Panneaux solaires & Énergie",
                        "Rénovation globale",
                        "Menuiserie & Fenêtres",
                        "Toiture & Charpente",
                        "Carrelage & Sol",
                        "Peinture & Décoration",
                        "Cuisine & Salle de bain",
                        "Maçonnerie & Gros œuvre",
                        "Isolation & Combles",
                        "Climatisation",
                        "Serrurerie",
                        "Jardinage & Espaces verts",
                        "Autre (préciser)",
                      ].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="gold"
                  size="xl"
                  className="w-full !font-black uppercase tracking-wider whitespace-normal text-center min-h-[56px] px-4 py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Vérification...</>
                  ) : (
                    <>VÉRIFIER MA ZONE & RÉSERVER MON ACCÈS</>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  🔒 Validation finale par notre équipe sous 24h après audit de vos documents.
                </p>
              </form>

              {/* 3 guarantees */}
              <div className="mt-6 pt-6 border-t border-border space-y-2">
                {[
                  "Inscription sans frais",
                  "Audit humain sous 24h",
                  "Activation après validation uniquement",
                ].map((g) => (
                  <div key={g} className="flex items-center gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{g}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Trust message */}
            <p className="text-center text-xs text-muted-foreground mt-6 leading-relaxed max-w-md mx-auto">
              Nous ne sommes pas des vendeurs de leads. Nous sommes un réseau de confiance. Aucun paiement ne vous sera demandé avant que votre dossier ne soit validé par notre équipe.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// --- SECTION 9: CTA FINAL ---
const CTAFinal = ({ onCTA }: { onCTA: () => void }) => (
  <section className="py-16 lg:py-20 bg-secondary">
    <div className="container mx-auto px-4 lg:px-8">
      <div className="bg-primary rounded-3xl p-8 lg:p-16 text-center relative overflow-hidden shadow-lg" style={{ background: "linear-gradient(180deg, rgba(240,165,0,0.08) 0%, transparent 100%), hsl(var(--primary))" }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
            Votre ville est peut-être encore disponible.
          </h2>
          <p className="text-primary-foreground/60 mb-8 max-w-xl mx-auto">
            2 licences max par secteur. Quand c'est pris, c'est pris.
          </p>
          <Button variant="gold" size="xl" onClick={onCTA} className="w-full sm:w-auto !font-extrabold uppercase tracking-wider whitespace-normal text-center !text-[16px] !px-12 !py-[18px]">
            REJOINDRE L'ALLIANCE <ArrowRight className="w-5 h-5 ml-2 flex-shrink-0" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4">🔒 Aucun paiement avant validation de votre dossier</p>
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
        description="Sécurisez vos chantiers sur votre secteur. Exclusivité garantie, 0% commission, accompagnement stratégique. Rejoignez l'Alliance."
        canonical="https://artisansvalides.fr/devenir-partenaire"
      />
      <Navbar />

      <main>
        <HeroSection onCTA={scrollToForm} />
        <ComparisonSection onCTA={scrollToForm} />
        <PillarsSection />
        <FOMOSection onCTA={scrollToForm} />
        <CockpitSection />
        <IntegrationSection />
        <TestimonialsSection />
        <FormSection />
        <CTAFinal onCTA={scrollToForm} />
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default DevenirPartenaire;
