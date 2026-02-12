import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { CheckCheck, Star, Shield, MapPin, Sparkles, Send } from "lucide-react";
import { ShimmerOverlay } from "@/components/marketing-lab/ShimmerOverlay";
import { GhostCursor } from "@/components/marketing-lab/GhostCursor";
import { ConfettiLayer, useConfetti } from "@/components/marketing-lab/GoldenConfetti";

/* ─── Spring presets ─── */
const snappy = { type: "spring" as const, stiffness: 300, damping: 30 };
const popIn = { type: "spring" as const, stiffness: 300, damping: 30, delay: 0.1 };

/* ─── Glass utility ─── */
const glass = "bg-white/[0.04] backdrop-blur-[12px] border border-white/[0.08]";
const glassLight = "bg-white/[0.06] backdrop-blur-[14px] border border-white/[0.1]";

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
      {/* Terminal frame */}
      <motion.div
        className="rounded-xl border border-primary/30 shadow-[0_0_80px_-20px_hsl(43_72%_52%/0.2)] overflow-hidden relative bg-black"
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={snappy}
        viewport={{ once: true }}
      >
        <ShimmerOverlay interval={3} />

        {/* Terminal Header */}
        <div className="px-5 py-3 flex items-center gap-3 border-b border-primary/20 bg-black">
          {/* Terminal dots */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-destructive/80" />
            <div className="w-3 h-3 rounded-full bg-primary/50" />
            <div className="w-3 h-3 rounded-full bg-success/50" />
          </div>
          <div className="flex-1 text-center">
            <span className="text-[11px] font-mono text-primary/60 tracking-widest uppercase">ANDREA_TERMINAL v3.2</span>
          </div>
          <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-mono">LIVE</Badge>
        </div>

        {/* Scan line effect */}
        <div className="relative">
          <motion.div
            className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent z-30 pointer-events-none"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />

          {/* Messages area */}
          <div className="bg-black p-4 min-h-[320px] flex flex-col gap-3 overflow-hidden relative">
            {/* Grid overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "linear-gradient(hsl(43 72% 52%) 1px, transparent 1px), linear-gradient(90deg, hsl(43 72% 52%) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

            <AnimatePresence>
              {chatMessages.slice(0, visibleCount).map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: msg.role === "andrea" ? -30 : 30, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={snappy}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed font-mono relative overflow-hidden ${
                      msg.role === "user"
                        ? "bg-primary/10 text-primary border border-primary/30 rounded-lg rounded-br-sm"
                        : "bg-white/[0.03] text-foreground border border-white/[0.08] rounded-lg rounded-bl-sm"
                    }`}
                  >
                    {/* Laser scan on each message */}
                    <motion.div
                      className="absolute inset-x-0 top-0 h-full pointer-events-none"
                      style={{ background: "linear-gradient(180deg, transparent 0%, hsl(43 72% 52% / 0.04) 50%, transparent 100%)" }}
                      animate={{ y: ["-100%", "100%"] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                    />
                    <span className="text-[10px] text-primary/40 block mb-1 font-mono">{msg.role === "andrea" ? "▸ ANDREA.AI" : "▸ USER.INPUT"}</span>
                    {msg.text}
                    <div className="flex justify-end mt-1">
                      {msg.role === "user" && <CheckCheck className="w-3.5 h-3.5 text-primary/60" />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {showTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-2 font-mono text-xs text-primary/50">
                <span>PROCESSING</span>
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </motion.div>
            )}

            {visibleCount >= chatMessages.length && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={popIn}
                className="mt-2 p-3 rounded-lg border border-success/30 bg-success/5 text-center"
              >
                <Sparkles className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-xs text-success font-mono font-semibold">✓ LEAD_CAPTURED — 12s elapsed</p>
                <button onClick={restart} className="mt-2 text-[10px] text-primary/60 underline hover:text-primary transition-colors font-mono">[ REPLAY ]</button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Terminal input bar */}
        <div className="px-4 py-3 flex items-center gap-2 border-t border-primary/20 bg-black">
          <span className="text-primary/40 font-mono text-xs">▸</span>
          <div className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded px-3 py-2 text-xs text-muted-foreground font-mono">Entrez une commande…</div>
          <div className="w-8 h-8 rounded bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Send className="w-4 h-4 text-primary" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ───────────────────────────────────────────
   Zone 2 — Social Post : Instagram Card 1080
   ─────────────────────────────────────────── */

function SocialPostCard() {
  const { particles, burst } = useConfetti();

  return (
    <div className="relative">
      <motion.div
        className={`w-full max-w-[540px] mx-auto aspect-square rounded-2xl overflow-hidden relative shadow-[0_0_80px_-20px_hsl(45_93%_47%/0.2)] border border-gold/20 ${glass}`}
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={snappy}
        viewport={{ once: true }}
      >
        <ShimmerOverlay interval={3} />
        <ConfettiLayer particles={particles} />

        {/* Background grain */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")" }} />

        {/* Gold corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-gold/30 rounded-tl-2xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-gold/30 rounded-br-2xl" />

        <div className="relative h-full flex flex-col items-center justify-center p-8 text-center gap-5 z-20">
          {/* Logo area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={popIn}
            className="flex items-center gap-2"
          >
            <Shield className="w-5 h-5 text-gold" />
            <span className="text-gold font-bold text-sm tracking-[0.2em] uppercase">Artisan Vérifié</span>
          </motion.div>

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...snappy, delay: 0.2 }}
            className="relative"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-navy-dark text-4xl font-bold shadow-[0_0_30px_hsl(45_93%_47%/0.35)]">
              JD
            </div>
            <motion.div
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-success flex items-center justify-center border-2 border-navy-dark"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <CheckCheck className="w-4 h-4 text-white" />
            </motion.div>
          </motion.div>

          {/* Info */}
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ ...snappy, delay: 0.35 }} className="space-y-2">
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

          {/* CTA — Ghost cursor target */}
          <motion.div
            id="validate-btn"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...snappy, delay: 0.5 }}
            className="relative px-8 py-2.5 rounded-full bg-gold text-navy-dark font-bold text-sm tracking-wide shadow-[0_0_20px_hsl(45_93%_47%/0.4)] cursor-default"
          >
            VOIR LE PROFIL COMPLET →
          </motion.div>

          {/* Bottom branding */}
          <p className="absolute bottom-4 text-[10px] text-muted-foreground tracking-[0.15em] uppercase">
            verified-craftsmen-hub.lovable.app
          </p>
        </div>

        {/* Ghost cursor */}
        <GhostCursor
          path={[
            { x: 300, y: 400, delay: 0.6 },
            { x: 250, y: 380, delay: 0.8 },
            { x: 200, y: 360, delay: 0.6 },
            { x: 180, y: 350, delay: 1.0 },
            { x: 200, y: 360, delay: 0.4 },
            { x: 300, y: 400, delay: 0.6 },
          ]}
          clickAtIndex={3}
          onClick={() => burst(0, -20)}
        />
      </motion.div>
    </div>
  );
}

/* ───────────────────────────────────────────
   Zone 3 — Hero Banner LinkedIn
   ─────────────────────────────────────────── */

function HeroBanner() {
  return (
    <motion.div
      className={`w-full aspect-[1200/630] max-w-4xl mx-auto rounded-2xl overflow-hidden relative shadow-[0_0_80px_-20px_hsl(45_93%_47%/0.15)] border border-gold/20 ${glass}`}
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={snappy}
      viewport={{ once: true }}
    >
      <ShimmerOverlay interval={3} />

      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-dark via-navy to-navy-light opacity-90" />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(45 93% 47%) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      {/* Gold accent line */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-gold via-gold-light to-gold-dark"
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ transformOrigin: "top" }}
      />

      <div className="relative h-full flex items-center px-10 md:px-16 z-20">
        <div className="flex-1 space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ ...snappy, delay: 0.15 }}
            className="flex items-center gap-2"
          >
            <Shield className="w-5 h-5 text-gold" />
            <span className="text-gold text-xs font-bold tracking-[0.2em] uppercase">Plateforme de confiance</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ ...snappy, delay: 0.3 }}
            className="text-3xl md:text-5xl font-bold text-primary-foreground leading-tight"
          >
            Accédez à l'élite<br />
            <span className="text-gold">des artisans</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ ...snappy, delay: 0.45 }}
            className="text-muted-foreground text-sm md:text-base max-w-md"
          >
            Chaque professionnel est audité, vérifié et recommandé. Zéro mauvaise surprise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ ...snappy, delay: 0.6 }}
            className="flex items-center gap-6 pt-2"
          >
            {[
              { icon: Shield, label: "100% Vérifiés" },
              { icon: Star, label: "4.8/5 Moyenne", fill: true },
              { icon: CheckCheck, label: "Assurés" },
            ].map(({ icon: Icon, label, fill }) => (
              <div key={label} className="flex items-center gap-2 text-gold text-sm font-semibold">
                <Icon className={`w-4 h-4 ${fill ? "fill-gold" : ""}`} /> {label}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right decorative element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ ...snappy, delay: 0.4 }}
          className="hidden md:flex flex-col items-center gap-3"
        >
          <div className="w-32 h-32 rounded-full border-4 border-gold/20 flex items-center justify-center">
            <motion.div
              className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center"
              animate={{ boxShadow: ["0 0 0 0 hsl(45 93% 47%/0.2)", "0 0 0 16px hsl(45 93% 47%/0)", "0 0 0 0 hsl(45 93% 47%/0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Shield className="w-12 h-12 text-gold" />
            </motion.div>
          </div>
          <div className="flex -space-x-2">
            {["JD", "ML", "PT", "AS"].map((initials, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ ...snappy, delay: 0.6 + i * 0.08 }}
                className="w-8 h-8 rounded-full bg-gold/80 flex items-center justify-center text-[10px] font-bold text-navy-dark border-2 border-navy-dark"
              >
                {initials}
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ ...snappy, delay: 0.92 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] text-gold border-2 border-navy-dark ${glassLight}`}
            >
              +42
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
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
        <header className={`border-b border-white/[0.06] ${glass} sticky top-0 z-50`}>
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
              <motion.div className="w-2 h-8 rounded-full bg-gold" layoutId="section-marker" />
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
