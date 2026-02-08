import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Shield, ArrowRight, Mic, MicOff, Volume2, VolumeX, Share2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const INTRO_MESSAGE =
  "Salut, je suis Andrea. Ici, on ne vend pas de leads, on valide le sérieux. Posez-moi n'importe quelle question sur vos travaux ou sur le réseau.";

const TOOLTIP_MESSAGES = [
  "Un doute sur un devis ? Je vous réponds cash.",
  "Attention aux faux pros, testez-moi.",
  "Décennale bidon ? Je vous explique.",
  "Prix cassé = danger. On en parle ?",
  "Besoin d'un conseil terrain ? Je suis là.",
];

const PRICING_KEYWORDS = ["abonnement", "tarif", "prix", "99", "990", "mensuel", "annuel", "payer", "offre", "alliance", "partenaire", "rejoindre", "accès", "souscrire", "inscription"];
const CONFIDENCE_KEYWORDS = ["assurance", "décennale", "prix", "devis", "tarif", "coût", "coûte", "combien", "garantie", "rc pro", "siret", "kbis"];

type ChatMessage = {
  role: "andrea" | "user";
  text: string;
  isConfidence?: boolean;
  isPricing?: boolean;
  isStreaming?: boolean;
};

// Voice frequency visualizer
const VoiceVisualizer = ({ isActive }: { isActive: boolean }) => {
  if (!isActive) return null;
  return (
    <div className="flex items-center gap-[2px] h-4 mx-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[2px] rounded-full bg-gold"
          animate={{
            height: isActive
              ? [3 + Math.random() * 4, 8 + Math.random() * 10, 3 + Math.random() * 4]
              : [3, 3, 3],
          }}
          transition={{
            duration: 0.4 + Math.random() * 0.3,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Loading sound wave animation
const SoundWaves = () => (
  <div className="flex items-center gap-[3px] h-5">
    {[0, 1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        className="w-[3px] rounded-full bg-gold"
        animate={{ height: ["6px", "16px", "6px"] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
      />
    ))}
  </div>
);

const AndreaExpertBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "andrea", text: INTRO_MESSAGE },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Badge + tooltip timers
  useEffect(() => {
    if (isOpen) {
      setShowBadge(false);
      setShowTooltip(false);
      return;
    }
    badgeTimerRef.current = setTimeout(() => setShowBadge(true), 5000);
    const showRandomTooltip = () => {
      setTooltipText(TOOLTIP_MESSAGES[Math.floor(Math.random() * TOOLTIP_MESSAGES.length)]);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 4000);
    };
    tooltipTimerRef.current = setTimeout(() => {
      showRandomTooltip();
      tooltipTimerRef.current = setInterval(showRandomTooltip, 12000);
    }, 8000);
    return () => {
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
      if (tooltipTimerRef.current) { clearTimeout(tooltipTimerRef.current); clearInterval(tooltipTimerRef.current); }
    };
  }, [isOpen]);

  const isConfidenceTopic = (q: string) => CONFIDENCE_KEYWORDS.some((k) => q.toLowerCase().includes(k));

  const isPricingTopic = (q: string, answer: string) => {
    const combined = (q + " " + answer).toLowerCase();
    return PRICING_KEYWORDS.some((k) => combined.includes(k));
  };

  // Streaming ask
  const handleAsk = async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const confidence = isConfidenceTopic(trimmed);
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setIsLoading(true);

    // Add empty streaming message
    const streamingMsgIndex = messages.length + 1; // +1 for user message just added
    setMessages((prev) => [...prev, { role: "andrea", text: "", isStreaming: true, isConfidence: confidence }]);

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ask-expert-andrea-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ question: trimmed }),
          signal: controller.signal,
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setMessages((prev) => {
                  const updated = [...prev];
                  const lastAndrea = updated.length - 1;
                  if (updated[lastAndrea]?.role === "andrea") {
                    updated[lastAndrea] = {
                      ...updated[lastAndrea],
                      text: fullText,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Skip unparseable
            }
          }
        }
      }

      // Finalize message
      const pricing = isPricingTopic(trimmed, fullText);
      setMessages((prev) => {
        const updated = [...prev];
        const lastAndrea = updated.length - 1;
        if (updated[lastAndrea]?.role === "andrea") {
          updated[lastAndrea] = {
            ...updated[lastAndrea],
            text: fullText,
            isStreaming: false,
            isPricing: pricing,
          };
        }
        return updated;
      });
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Impossible de contacter Andrea. Réessayez.");
        setMessages((prev) => prev.filter((m) => !(m.role === "andrea" && m.isStreaming)));
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  };

  // Speech-to-Text
  const toggleListening = useCallback(() => {
    // If Andrea is speaking, stop her first (interruption)
    if (isSpeaking) {
      stopSpeaking();
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Reconnaissance vocale non supportée."); return; }
    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) { setQuestion((prev) => (prev ? prev + " " + transcript : transcript)); toast.success("🎙️ Texte capté !"); }
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "denied") toast.error("Micro bloqué. Autorisez l'accès.", { duration: 5000 });
      else if (event.error !== "no-speech") toast.error("Erreur vocale.");
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setIsListening(true); toast.info("🎙️ Parlez maintenant..."); }
    catch { toast.error("Micro bloqué.", { duration: 5000 }); }
  }, [isListening, isSpeaking]);

  // Stop speaking (interruption)
  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  // ElevenLabs TTS with fallback to browser TTS
  const speakText = useCallback(async (text: string) => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    setIsSpeaking(true);

    try {
      // Try ElevenLabs first
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: text.substring(0, 500) }),
        }
      );

      if (!response.ok) throw new Error("ElevenLabs failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch {
      // Fallback to browser TTS
      console.log("[Andrea] ElevenLabs unavailable, falling back to browser TTS");
      if (!("speechSynthesis" in window)) {
        toast.error("Synthèse vocale non supportée.");
        setIsSpeaking(false);
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-FR";
      utterance.rate = 0.95;
      utterance.pitch = 0.85;
      const voices = window.speechSynthesis.getVoices();
      const fr = voices.find((v) => v.lang.startsWith("fr") && v.name.toLowerCase().includes("female")) ||
                 voices.find((v) => v.lang.startsWith("fr"));
      if (fr) utterance.voice = fr;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [isSpeaking, stopSpeaking]);

  // Share via WhatsApp
  const shareResponse = (text: string) => {
    const shareText = `💬 L'Expert Andrea (Artisans Validés) dit :\n\n"${text}"\n\n👉 Posez vos questions : https://artisans-valides.fr`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  return (
    <>
      {/* Floating Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed bottom-6 right-6 z-50">
            <AnimatePresence>
              {showTooltip && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute -top-16 right-0 bg-card text-foreground text-xs font-medium px-3 py-2 rounded-xl shadow-lg border border-gold/30 whitespace-nowrap max-w-[220px] text-wrap pointer-events-none">
                  <span className="text-gold">💬</span> {tooltipText}
                  <div className="absolute -bottom-1 right-6 w-2 h-2 bg-card border-b border-r border-gold/30 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={() => { setIsOpen(true); setShowBadge(false); }}
              className="relative h-16 w-16 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-lg shadow-gold/30 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Parler à Andrea, l'Expert IA">
              <Sparkles className="h-7 w-7 text-navy-dark" />
              <span className="absolute inset-0 rounded-full animate-ping bg-gold/20 pointer-events-none" />
              <AnimatePresence>
                {showBadge && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-card">
                    1
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-gold/20 bg-card flex flex-col"
            style={{ maxHeight: "min(580px, calc(100vh - 6rem))" }}>

            {/* Header */}
            <div className="bg-gradient-to-r from-navy to-navy-dark p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-navy-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">Andrea — Expert IA</p>
                  <VoiceVisualizer isActive={isSpeaking} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/70">
                    {isSpeaking ? "Andrea parle…" : "En ligne · Analyse en temps réel"}
                  </span>
                </div>
              </div>
              {isSpeaking && (
                <button onClick={stopSpeaking} className="text-white/70 hover:text-white transition-colors" title="Couper la parole">
                  <VolumeX className="h-5 w-5" />
                </button>
              )}
              <button onClick={() => { setIsOpen(false); stopSpeaking(); }} className="text-white/70 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user" ? "bg-navy text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                    }`}>
                      {msg.text}
                      {msg.isStreaming && (
                        <motion.span
                          className="inline-block w-1.5 h-4 bg-gold ml-0.5 align-text-bottom rounded-sm"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}
                    </div>

                    {msg.role === "andrea" && i > 0 && !msg.isStreaming && (
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 ml-1">
                        {msg.isConfidence && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-gold" />
                            <span className="text-[10px] font-semibold text-gold">Conseil de Terrain</span>
                          </div>
                        )}
                        <button onClick={() => speakText(msg.text)}
                          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                          <Volume2 className={`h-3 w-3 ${isSpeaking ? "text-gold animate-pulse" : ""}`} />
                          {isSpeaking ? "Stop" : "Écouter"}
                        </button>
                        <button onClick={() => shareResponse(msg.text)}
                          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                          <Share2 className="h-3 w-3" />
                          Partager
                        </button>
                      </div>
                    )}

                    {msg.role === "andrea" && msg.text.includes("Vous voulez les voir ?") && !msg.isStreaming && (
                      <Link to="/nos-missions" className="inline-flex items-center gap-1 mt-2 ml-1 text-xs text-gold hover:text-gold/80 font-medium transition-colors">
                        Voir les chantiers <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}

                    {msg.role === "andrea" && msg.isPricing && !msg.isStreaming && (
                      <div className="flex flex-col gap-2 mt-3 ml-1">
                        <Link to="/devenir-artisan" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors">
                          <CreditCard className="h-4 w-4" /> Accès Mensuel — 99€ HT/mois
                        </Link>
                        <Link to="/devenir-artisan" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors">
                          <CreditCard className="h-4 w-4" /> Accès Annuel — 990€ HT/an
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "andrea" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-3 text-muted-foreground text-sm">
                    <SoundWaves />
                    <span>Andrea prépare sa réponse…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="flex gap-2">
                <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Posez votre question…"
                  className="h-10 text-sm flex-1" disabled={isLoading} />
                <Button type="button" size="icon" onClick={toggleListening} disabled={isLoading}
                  className={`h-10 w-10 shrink-0 transition-all ${
                    isListening ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-muted hover:bg-muted/80 text-foreground"
                  }`} aria-label={isListening ? "Arrêter le micro" : "Dicter ma question"}>
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button type="submit" size="icon" className="h-10 w-10 shrink-0 bg-gold hover:bg-gold/90 text-navy-dark"
                  disabled={isLoading || !question.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                ⚡ IA experte · Voix premium ElevenLabs ·{" "}
                <Link to="/a-propos" className="underline hover:text-foreground">En savoir plus</Link>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AndreaExpertBubble;
