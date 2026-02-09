import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, CheckCircle2, ArrowRight, Camera, MessageSquare, UserCheck, Sparkles, Send, Mic, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import heroBackground from "@/assets/hero-artisan-bg.jpg";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAndreaVoiceAgent } from "@/hooks/useAndreaVoiceAgent";
import MicWaveform from "./MicWaveform";

const HeroSection = () => {
  const {
    startConversation, isConnecting, isConnected, isSpeaking, isThinking,
    micActive, micLevel, stopConversation, hardReset, micPermission,
    requestMicPermission, lastAgentText, lastRawMessage,
    showTextFallback, audioBlocked, unlockAudio,
  } = useAndreaVoiceAgent();

  const getVoiceLabel = () => {
    if (isConnecting) return "Connexion...";
    if (!isConnected) return "Parler à Andrea 🎙️";
    if (isSpeaking) return "Andrea parle… 🔊";
    if (isThinking) return "Andrea réfléchit… 🧠";
    if (!micActive) return "Micro non détecté ⚠️";
    return "Andrea écoute… 🎙️";
  };

  const { data: artisanCount } = useQuery({
    queryKey: ["artisan-count-hero"],
    queryFn: async () => {
      const { count } = await supabase
        .from("artisans")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      return count || 0;
    },
    staleTime: 60000,
  });

  const displayCount = artisanCount && artisanCount > 0 ? artisanCount : 200;

  const VoiceButton = ({ mobile = false }: { mobile?: boolean }) => {
    if (micPermission === "denied") {
      return (
        <Button
          size="lg"
          variant={mobile ? "default" : "destructive"}
          className={`${mobile ? "w-full font-bold text-base py-7 bg-destructive hover:bg-destructive/90 text-destructive-foreground border-2 border-destructive" : "w-full text-base"} gap-2`}
          onClick={requestMicPermission}
        >
          <Mic className="w-5 h-5" />
          Activer le micro 🔴
        </Button>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            size="lg"
            variant={mobile ? "default" : "gold"}
            className={mobile
              ? `flex-1 font-bold text-base py-7 border-2 transition-all gap-2 shadow-lg ${
                  isConnected
                    ? "bg-gold text-navy-dark border-gold animate-pulse"
                    : isConnecting
                    ? "bg-navy/80 text-white border-gold/60"
                    : "bg-navy text-white border-gold/40 hover:bg-navy-dark hover:border-gold/60"
                }`
              : `flex-1 text-base gap-2 ${isConnected ? "animate-pulse ring-2 ring-gold/50" : ""}`
            }
            onClick={() => {
              if (isConnected) {
                stopConversation();
              } else {
                startConversation();
              }
            }}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin text-gold" />
            ) : (
              <Mic className={`w-5 h-5 ${isConnected && mobile ? "text-navy-dark" : ""} ${isConnected && micActive && !isSpeaking ? "animate-pulse" : ""}`} />
            )}
            {isConnected ? "Arrêter Andrea ⏹️" : getVoiceLabel()}
          </Button>
          {isConnected && (
            <Button
              size="lg"
              variant="destructive"
              className={mobile ? "py-7 px-4" : "px-4"}
              onClick={hardReset}
              title="Reset complet"
            >
              ✕
            </Button>
          )}
        </div>
        {isConnected && (
          <MicWaveform
            level={micLevel}
            isActive={micActive}
            isThinking={isThinking}
            onReset={hardReset}
            className="justify-center"
          />
        )}
        {/* Always show text when available (diagnostic mode) */}
        {showTextFallback && lastAgentText && (
          <div className="mt-2 p-3 rounded-lg bg-gold/10 border border-gold/20 text-sm text-white/90 max-w-md animate-fade-in">
            {audioBlocked && (
              <button
                onClick={unlockAudio}
                className="mb-2 px-3 py-1.5 rounded-md bg-gold text-navy-dark text-xs font-bold hover:bg-gold/90 transition-colors flex items-center gap-1.5"
              >
                🔊 Activer le son
              </button>
            )}
            <p className="text-xs text-gold/60 mb-1">💬 Andrea :</p>
            <p className="leading-relaxed">{lastAgentText}</p>
          </div>
        )}
        {lastRawMessage && (
          <p className="text-[10px] text-white/30 font-mono truncate max-w-md mt-1" title={lastRawMessage}>
            📡 {lastRawMessage}
          </p>
        )}
      </div>
    );
  };

  return (
    <section className="relative min-h-screen flex items-center pt-32 lg:pt-20 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img src={heroBackground} alt="Artisan professionnel qualifié au travail" width={1920} height={1080} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/70" />
      </div>
      <div className="absolute top-20 right-0 w-1/2 h-full opacity-10">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,_hsl(var(--gold))_0%,_transparent_70%)]" />
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-20 items-center">
          {/* Content */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center lg:text-left">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-gold/20 border border-gold/30 mb-4 md:mb-6">
              <Shield className="w-3 h-3 md:w-4 md:h-4 text-gold" />
              <span className="text-xs md:text-sm font-medium text-white">
                Votre anonymat garanti jusqu'au dernier moment
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold text-white leading-tight mb-4 md:mb-6">
              Trouvez l'artisan idéal,{" "}
              <span className="text-gradient-gold">votre anonymat en plus.</span>
            </h1>

            <p className="text-sm md:text-base text-gold/80 font-medium mb-3 max-w-xl mx-auto lg:mx-0">
              Le premier réseau d'artisans audités par Andrea, expert du bâtiment (20 ans de terrain) à Roubaix et dans les Hauts-de-France.
            </p>
            <p className="text-base md:text-lg text-white/80 mb-4 max-w-xl mx-auto lg:mx-0">
              Décrivez votre projet, recevez des devis, et ne partagez vos coordonnées que lorsque vous êtes prêt.
            </p>

            {/* Expert Andrea Module */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 md:mb-8 border border-gold/20 max-w-xl mx-auto lg:mx-0 shadow-[0_0_20px_rgba(212,175,55,0.08)]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <p className="text-sm text-gold font-semibold">Posez votre question à l'Expert</p>
              </div>
              <p className="text-xs text-white/60 mb-3 leading-relaxed">
                Une question sur une assurance ? Un doute sur un devis ? Andrea, notre IA experte du bâtiment, vous répond sans langue de bois.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const q = formData.get("question") as string;
                  if (q?.trim()) {
                    window.location.href = `/#expert-andrea?q=${encodeURIComponent(q.trim())}`;
                    const section = document.getElementById("expert-andrea");
                    if (section) section.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="flex gap-2"
              >
                <input
                  name="question"
                  type="text"
                  placeholder="Ex : Comment vérifier une décennale ?"
                  className="flex-1 rounded-lg bg-white/10 border border-gold/20 text-white placeholder:text-white/40 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
                <button
                  type="submit"
                  className="bg-gradient-gold text-navy-dark font-bold px-5 py-2.5 rounded-lg text-sm hover:scale-[1.02] transition-transform flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  Demander
                </button>
              </form>
            </div>

            {/* Main CTA */}
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3 md:gap-4 mb-4 md:mb-8">
              <Button
                size="lg"
                className="bg-gradient-gold text-navy-dark font-bold text-base md:text-lg w-full sm:w-auto px-8 py-7 shadow-xl shadow-gold/40 hover:shadow-gold/60 transition-all hover:scale-[1.03] active:scale-[0.98] animate-[pulse-subtle_5s_ease-in-out_infinite] ring-2 ring-gold/50 ring-offset-2 ring-offset-navy"
                asChild
              >
                <Link to="/demande-devis">
                  Lancer mon projet
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/30 hover:bg-white/20 md:text-base" asChild>
                <Link to="/trouver-artisan">Voir les Artisans</Link>
              </Button>
            </div>

            {/* Mobile-only Andrea CTA */}
            <div className="block lg:hidden mb-6">
              <VoiceButton mobile />
            </div>

            {/* Trust line */}
            <p className="text-sm md:text-base text-white/70 mb-8 md:mb-10">
              <CheckCircle2 className="w-4 h-4 text-gold inline mr-1.5 -mt-0.5" />
              Déjà <span className="text-gold font-bold">+{displayCount}</span> artisans validés et vérifiés par nos soins.
            </p>

            {/* How it works mini */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/20">
              <div className="grid grid-cols-3 gap-3 md:gap-6">
                {[
                  { icon: Camera, label: "Décrivez votre besoin avec des photos" },
                  { icon: MessageSquare, label: "Discutez anonymement avec les artisans" },
                  { icon: UserCheck, label: "Choisissez votre pro et lancez les travaux" },
                ].map((step, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-2">
                      <step.icon className="w-5 h-5 md:w-6 md:h-6 text-gold" />
                    </div>
                    <p className="text-xs md:text-sm text-white/80 leading-tight">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Visual Card — Desktop only */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative hidden lg:block">
            <div className="relative">
              <div className="bg-navy rounded-2xl shadow-floating p-8 border border-gold/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-navy-dark" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Andrea : Ton Assistante de Choc</h3>
                </div>

                <p className="text-white/80 text-base leading-relaxed mb-6">
                  Je suis l'intelligence qui audite vos devis et protège vos marges. Ne perdez plus de temps avec des leads bidons.
                </p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Audits", value: "500+/mois" },
                    { label: "Artisans", value: "Triés" },
                    { label: "Réponse", value: "< 30s" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="text-xs text-white/50">{label}</div>
                      <div className="font-semibold text-gold text-sm">{value}</div>
                    </div>
                  ))}
                </div>

                <VoiceButton />
              </div>

              {/* Floating Element */}
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-4 -right-4 bg-white rounded-xl shadow-elevated p-3 border border-border">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-navy">IA de confiance</div>
                    <div className="text-xs text-muted-foreground">20 ans d'expertise terrain</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
