import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, Sparkles, Shield, ArrowRight, Mic, MicOff, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
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

const AndreaExpertBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<{ role: "andrea" | "user"; text: string; isConfidence?: boolean }[]>([
    { role: "andrea", text: INTRO_MESSAGE },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const cacheRef = useRef<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Badge notification after 5s + rotating tooltips
  useEffect(() => {
    if (isOpen) {
      setShowBadge(false);
      setShowTooltip(false);
      return;
    }

    badgeTimerRef.current = setTimeout(() => setShowBadge(true), 5000);

    const showRandomTooltip = () => {
      const msg = TOOLTIP_MESSAGES[Math.floor(Math.random() * TOOLTIP_MESSAGES.length)];
      setTooltipText(msg);
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 4000);
    };

    tooltipTimerRef.current = setTimeout(() => {
      showRandomTooltip();
      tooltipTimerRef.current = setInterval(showRandomTooltip, 12000);
    }, 8000);

    return () => {
      if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
        clearInterval(tooltipTimerRef.current);
      }
    };
  }, [isOpen]);

  // Confidence & technical topic detection
  const isConfidenceTopic = (q: string) => {
    const keywords = ["assurance", "décennale", "prix", "devis", "tarif", "coût", "coûte", "combien", "garantie", "rc pro", "siret", "kbis"];
    return keywords.some((k) => q.toLowerCase().includes(k));
  };

  const isTechnicalQuestion = (q: string) => {
    const keywords = ["technique", "norme", "dtu", "réglementation", "certification", "qualibat", "rge", "électricité", "plomberie", "maçonnerie", "toiture", "charpente", "isolation"];
    return keywords.some((k) => q.toLowerCase().includes(k));
  };

  // Ask Andrea
  const handleAsk = async () => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    const confidence = isConfidenceTopic(trimmed);
    const technical = isTechnicalQuestion(trimmed);

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");

    if (cacheRef.current[trimmed]) {
      let text = cacheRef.current[trimmed];
      if (technical) text += "\n\nD'ailleurs, il y a des chantiers qui correspondent à votre expertise en ce moment. Vous voulez les voir ?";
      setMessages((prev) => [...prev, { role: "andrea", text, isConfidence: confidence }]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ask-expert-andrea", {
        body: { question: trimmed },
      });
      if (error) throw error;
      let response = data?.answer || "Je n'ai pas pu répondre. Reformulez votre question.";
      cacheRef.current[trimmed] = response;
      if (technical) response += "\n\nD'ailleurs, il y a des chantiers qui correspondent à votre expertise en ce moment. Vous voulez les voir ?";
      setMessages((prev) => [...prev, { role: "andrea", text: response, isConfidence: confidence }]);
    } catch {
      toast.error("Impossible de contacter Andrea. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  };

  // Speech-to-Text
  const toggleListening = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("La reconnaissance vocale n'est pas supportée par votre navigateur.");
      return;
    }

    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setQuestion((prev) => (prev ? prev + " " + transcript : transcript));
        toast.success("🎙️ Texte capté !");
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "denied") {
        toast.error("Micro bloqué. Autorisez l'accès dans les réglages du navigateur.", { duration: 5000 });
      } else if (event.error !== "no-speech") {
        toast.error("Erreur de reconnaissance vocale.");
      }
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      toast.info("🎙️ Parlez maintenant...");
    } catch {
      toast.error("Micro bloqué. Autorisez l'accès dans les réglages du navigateur.", { duration: 5000 });
    }
  }, [isListening]);

  // Text-to-Speech for Andrea's responses
  const speakText = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) {
      toast.error("La synthèse vocale n'est pas supportée.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.95;
    utterance.pitch = 0.85;

    // Try to pick a deeper French voice
    const voices = window.speechSynthesis.getVoices();
    const frenchMale = voices.find(
      (v) => v.lang.startsWith("fr") && v.name.toLowerCase().includes("male")
    ) || voices.find((v) => v.lang.startsWith("fr"));
    if (frenchMale) utterance.voice = frenchMale;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  return (
    <>
      {/* Floating Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            {/* Random tooltip */}
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute -top-16 right-0 bg-card text-foreground text-xs font-medium px-3 py-2 rounded-xl shadow-lg border border-gold/30 whitespace-nowrap max-w-[220px] text-wrap pointer-events-none"
                >
                  <span className="text-gold">💬</span> {tooltipText}
                  <div className="absolute -bottom-1 right-6 w-2 h-2 bg-card border-b border-r border-gold/30 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => {
                setIsOpen(true);
                setShowBadge(false);
              }}
              className="relative h-16 w-16 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-lg shadow-gold/30 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Parler à Andrea, l'Expert IA"
            >
              <Sparkles className="h-7 w-7 text-navy-dark" />
              {/* Glow ring */}
              <span className="absolute inset-0 rounded-full animate-ping bg-gold/20 pointer-events-none" />

              {/* Notification badge */}
              <AnimatePresence>
                {showBadge && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-card"
                  >
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
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-gold/20 bg-card flex flex-col"
            style={{ maxHeight: "min(560px, calc(100vh - 6rem))" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-navy to-navy-dark p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-navy-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">Andrea — Expert IA</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-white/70">En ligne · Analyse en temps réel</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-navy text-white rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                    {/* Confidence badge */}
                    {msg.role === "andrea" && msg.isConfidence && (
                      <div className="flex items-center gap-1 mt-1.5 ml-1">
                        <Shield className="h-3 w-3 text-gold" />
                        <span className="text-[10px] font-semibold text-gold">Conseil de Terrain</span>
                      </div>
                    )}
                    {/* Mission link for technical answers */}
                    {msg.role === "andrea" && msg.text.includes("Vous voulez les voir ?") && (
                      <Link to="/nos-missions" className="inline-flex items-center gap-1 mt-2 ml-1 text-xs text-gold hover:text-gold/80 font-medium transition-colors">
                        Voir les chantiers <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                    {/* Listen button for Andrea's responses */}
                    {msg.role === "andrea" && i > 0 && (
                      <button
                        onClick={() => speakText(msg.text)}
                        disabled={isSpeaking}
                        className="inline-flex items-center gap-1 mt-1.5 ml-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        <Volume2 className={`h-3 w-3 ${isSpeaking ? "text-gold animate-pulse" : ""}`} />
                        {isSpeaking ? "Écoute en cours…" : "Écouter la réponse"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-gold" />
                    Andrea réfléchit…
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk();
                }}
                className="flex gap-2"
              >
                <Input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Posez votre question…"
                  className="h-10 text-sm flex-1"
                  disabled={isLoading}
                />
                {/* Mic button */}
                <Button
                  type="button"
                  size="icon"
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`h-10 w-10 shrink-0 transition-all ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                      : "bg-muted hover:bg-muted/80 text-foreground"
                  }`}
                  aria-label={isListening ? "Arrêter le micro" : "Dicter ma question"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                {/* Send button */}
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0 bg-gold hover:bg-gold/90 text-navy-dark"
                  disabled={isLoading || !question.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground text-center mt-2">
                ⚡ IA experte · 20 ans d'expérience terrain ·{" "}
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
