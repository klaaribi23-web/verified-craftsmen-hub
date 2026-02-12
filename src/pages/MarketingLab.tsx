import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Star, Shield, MapPin, Phone, Mail, Sparkles, MessageCircle, Send } from "lucide-react";

/* ───────────────────────────────────────────
   Zone 1 — Motion Design : Andrea Chat Demo
   ─────────────────────────────────────────── */

const chatMessages = [
  { role: "andrea", text: "Bonjour ! 👋 Je suis Andrea, votre experte travaux. Comment puis-je vous aider ?" },
  { role: "user", text: "Je cherche un plombier certifié à Lyon." },
  { role: "andrea", text: "Parfait ! J'ai 3 artisans vérifiés disponibles à Lyon. Puis-je avoir votre email pour vous envoyer leurs profils ?" },
  { role: "user", text: "Oui, c'est marc.dupont@email.com" },
  { role: "andrea", text: "✅ Lead capturé ! Marc, je vous envoie les profils immédiatement." },
];

function AndreaChatDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    if (visibleCount >= chatMessages.length) return;
    setShowTyping(true);
    const delay = chatMessages[visibleCount].role === "andrea" ? 1800 : 1200;
    const timer = setTimeout(() => {
      setShowTyping(false);
      setVisibleCount((c) => c + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  const restart = () => setVisibleCount(0);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Phone frame */}
      <div className="rounded-[2rem] border-4 border-navy bg-navy-dark shadow-floating overflow-hidden">
        {/* Header */}
        <div className="bg-navy px-5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-navy font-bold text-sm">A</div>
          <div className="flex-1">
            <p className="text-primary-foreground font-semibold text-sm">Andrea</p>
            <p className="text-xs text-gold flex items-center gap-1"><Shield className="w-3 h-3" /> Experte vérifiée</p>
          </div>
          <Badge variant="outline" className="border-gold/40 text-gold text-[10px]">EN LIGNE</Badge>
        </div>

        {/* Messages */}
        <div className="bg-navy-dark/90 p-4 min-h-[320px] flex flex-col gap-3 overflow-hidden">
          <AnimatePresence>
            {chatMessages.slice(0, visibleCount).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gold text-navy-dark rounded-2xl rounded-br-sm font-medium"
                      : "bg-navy-light text-primary-foreground rounded-2xl rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                  <div className="flex justify-end mt-1">
                    {msg.role === "user" && <CheckCheck className="w-3.5 h-3.5 text-navy/60" />}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {showTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-1.5 px-4 py-2">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-gold"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          )}

          {visibleCount >= chatMessages.length && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="mt-2 p-3 rounded-xl bg-success/20 border border-success/30 text-center">
              <Sparkles className="w-5 h-5 text-gold mx-auto mb-1" />
              <p className="text-xs text-success font-semibold">Lead qualifié capturé en 12s</p>
              <button onClick={restart} className="mt-2 text-[10px] text-gold underline hover:text-gold-light transition-colors">Rejouer la démo</button>
            </motion.div>
          )}
        </div>

        {/* Input bar */}
        <div className="bg-navy px-4 py-3 flex items-center gap-2">
          <div className="flex-1 bg-navy-light rounded-full px-4 py-2 text-xs text-muted-foreground">Écrire un message…</div>
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center"><Send className="w-4 h-4 text-navy" /></div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   Zone 2 — Social Post : Instagram Card 1080
   ─────────────────────────────────────────── */

function SocialPostCard() {
  return (
    <div className="w-full max-w-[540px] mx-auto aspect-square bg-navy-dark rounded-2xl overflow-hidden relative shadow-floating border border-gold/20">
      {/* Background grain */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")" }} />
      
      {/* Gold corner accents */}
      <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-gold/40 rounded-tl-2xl" />
      <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-gold/40 rounded-br-2xl" />

      <div className="relative h-full flex flex-col items-center justify-center p-8 text-center gap-6">
        {/* Logo area */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2"
        >
          <Shield className="w-5 h-5 text-gold" />
          <span className="text-gold font-bold text-sm tracking-[0.2em] uppercase">Artisan Vérifié</span>
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative"
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-navy-dark text-4xl font-bold shadow-gold">
            JD
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-success flex items-center justify-center border-2 border-navy-dark">
            <CheckCheck className="w-4 h-4 text-white" />
          </div>
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-2">
          <h3 className="text-2xl font-bold text-primary-foreground">Jean Dupont</h3>
          <p className="text-gold font-medium">Maître Plombier · 15 ans d'exp.</p>
          <div className="flex items-center justify-center gap-1 text-gold-light">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-gold text-gold" />)}
            <span className="text-xs text-muted-foreground ml-1">(47 avis)</span>
          </div>
          <div className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
            <MapPin className="w-3.5 h-3.5" /> Lyon · Rhône-Alpes
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="px-8 py-2.5 rounded-full bg-gold text-navy-dark font-bold text-sm tracking-wide shadow-gold"
        >
          VOIR LE PROFIL COMPLET →
        </motion.div>

        {/* Bottom branding */}
        <p className="absolute bottom-4 text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
          verified-craftsmen-hub.lovable.app
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   Zone 3 — Hero Banner LinkedIn
   ─────────────────────────────────────────── */

function HeroBanner() {
  return (
    <div className="w-full aspect-[1200/630] max-w-4xl mx-auto rounded-2xl overflow-hidden relative shadow-floating border border-gold/20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy to-navy-light" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(45 93% 47%) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      {/* Gold accent line */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-gold via-gold-light to-gold-dark"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        transition={{ duration: 0.8 }}
        style={{ transformOrigin: "top" }}
      />

      <div className="relative h-full flex items-center px-10 md:px-16">
        <div className="flex-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2"
          >
            <Shield className="w-5 h-5 text-gold" />
            <span className="text-gold text-xs font-bold tracking-[0.2em] uppercase">Plateforme de confiance</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl md:text-5xl font-bold text-primary-foreground leading-tight"
          >
            Accédez à l'élite<br />
            <span className="text-gold">des artisans</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="text-muted-foreground text-sm md:text-base max-w-md"
          >
            Chaque professionnel est audité, vérifié et recommandé. Zéro mauvaise surprise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-6 pt-2"
          >
            <div className="flex items-center gap-2 text-gold text-sm font-semibold">
              <Shield className="w-4 h-4" /> 100% Vérifiés
            </div>
            <div className="flex items-center gap-2 text-gold text-sm font-semibold">
              <Star className="w-4 h-4 fill-gold" /> 4.8/5 Moyenne
            </div>
            <div className="flex items-center gap-2 text-gold text-sm font-semibold">
              <CheckCheck className="w-4 h-4" /> Assurés
            </div>
          </motion.div>
        </div>

        {/* Right decorative element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
          className="hidden md:flex flex-col items-center gap-3"
        >
          <div className="w-32 h-32 rounded-full border-4 border-gold/30 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center">
              <Shield className="w-12 h-12 text-gold" />
            </div>
          </div>
          <div className="flex -space-x-2">
            {["JD", "ML", "PT", "AS"].map((initials, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gold/80 flex items-center justify-center text-[10px] font-bold text-navy-dark border-2 border-navy-dark">
                {initials}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-navy-light flex items-center justify-center text-[10px] text-gold border-2 border-navy-dark">
              +42
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────
   Page principale
   ─────────────────────────────────────────── */

export default function MarketingLab() {
  return (
    <>
      <Helmet>
        <title>Marketing Lab — Studio Visuel</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container max-w-7xl py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-gold" />
              <h1 className="text-xl font-bold text-foreground">Marketing Lab</h1>
              <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">INTERNE</Badge>
            </div>
          </div>
        </header>

        <main className="container max-w-7xl py-10 space-y-16">
          {/* Zone 1 — Motion Design */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full bg-gold" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Motion Design</h2>
                <p className="text-sm text-muted-foreground">Démo animée — Andrea capture un lead en live</p>
              </div>
            </div>
            <AndreaChatDemo />
          </section>

          {/* Zone 2 — Social Post */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full bg-gold" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Social Post</h2>
                <p className="text-sm text-muted-foreground">Template Instagram 1080×1080 — Carte artisan premium</p>
              </div>
            </div>
            <SocialPostCard />
          </section>

          {/* Zone 3 — Hero Banner */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-8 rounded-full bg-gold" />
              <div>
                <h2 className="text-2xl font-bold text-foreground">Hero Banner</h2>
                <p className="text-sm text-muted-foreground">Visuel LinkedIn 1200×630 — Slogan de marque</p>
              </div>
            </div>
            <HeroBanner />
          </section>
        </main>
      </div>
    </>
  );
}
