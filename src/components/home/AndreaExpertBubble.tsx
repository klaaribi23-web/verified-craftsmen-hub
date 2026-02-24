import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Sparkles, Shield, ArrowRight, Mic, MicOff, Share2, CreditCard, ShieldCheck, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const INTRO_MESSAGE =
  "Bonjour. Ici, on ne fait pas dans la dentelle. Je suis Andrea, l'IA d'audit d'Artisans Validés, entraînée sur 20 ans d'expertise terrain. Vous êtes artisan ou particulier ?";

const TOOLTIP_MESSAGES = [
  "Un doute sur un devis ? Je vous réponds cash.",
  "Attention aux faux pros, testez-moi.",
  "Décennale bidon ? Je vous explique.",
  "Prix cassé = danger. On en parle ?",
  "Besoin d'un conseil terrain ? Je suis là.",
];

const PRICING_KEYWORDS = ["abonnement", "tarif", "prix", "99", "990", "mensuel", "annuel", "payer", "offre", "alliance", "partenaire", "rejoindre", "accès", "souscrire", "inscription"];

type ChatMessage = {
  role: "andrea" | "user";
  text: string;
  isPricing?: boolean;
  isStreaming?: boolean;
  time?: string;
};

const getTime = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Typing indicator dots
const TypingIndicator = () => (
  <div className="flex items-center gap-1 px-4 py-3">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full bg-muted-foreground/50"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
      />
    ))}
  </div>
);

const AndreaExpertBubble = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "andrea", text: INTRO_MESSAGE, time: getTime() },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [tooltipText, setTooltipText] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const badgeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Badge + tooltip timers
  useEffect(() => {
    if (isOpen) { setShowBadge(false); setShowTooltip(false); return; }
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

  const isPricingTopic = (q: string, answer: string) => {
    const combined = (q + " " + answer).toLowerCase();
    return PRICING_KEYWORDS.some((k) => combined.includes(k));
  };

  // Streaming ask
  const handleAsk = async (textOverride?: string) => {
    const trimmed = (textOverride || question).trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed, time: getTime() }]);
    setQuestion("");
    setIsLoading(true);

    // Add empty streaming message
    setMessages((prev) => [...prev, { role: "andrea", text: "", isStreaming: true, time: getTime() }]);

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
                  const last = updated.length - 1;
                  if (updated[last]?.role === "andrea") {
                    updated[last] = { ...updated[last], text: fullText };
                  }
                  return updated;
                });
              }
            } catch { /* skip */ }
          }
        }
      }

      const pricing = isPricingTopic(trimmed, fullText);
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.length - 1;
        if (updated[last]?.role === "andrea") {
          updated[last] = { ...updated[last], text: fullText, isStreaming: false, isPricing: pricing };
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

  // Speech-to-Text with auto-send
  const toggleListening = useCallback(() => {
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
    recognition.interimResults = true;
    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim = event.results[i][0].transcript;
        }
      }
      setQuestion(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        // Auto-send after voice stops
        handleAsk(finalTranscript.trim());
        setQuestion("");
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "denied") {
        toast.error("Micro bloqué. Autorisez l'accès.", { duration: 5000 });
      }
    };

    recognitionRef.current = recognition;
    try { recognition.start(); setIsListening(true); }
    catch { toast.error("Micro bloqué.", { duration: 5000 }); }
  }, [isListening, isLoading]);

  // Share via WhatsApp
  const shareResponse = (text: string) => {
    const shareText = `💬 Andrea (Artisans Validés) :\n\n"${text}"\n\n👉 https://artisans-valides.fr`;
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
  };

  return (
    <>
      {/* Floating Bubble */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="fixed bottom-6 right-6 z-50 hidden md:block">
            <AnimatePresence>
              {showTooltip && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  style={{ zIndex: 9999 }}
                  className="absolute -top-24 right-10 bg-card text-foreground text-xs font-medium px-4 py-3 rounded-xl shadow-lg border border-gold/30 whitespace-nowrap max-w-[240px] text-wrap pointer-events-none">
                  <span className="text-gold">💬</span> {tooltipText}
                  <div className="absolute -bottom-1 right-6 w-2 h-2 bg-card border-b border-r border-gold/30 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
            <button onClick={() => { setIsOpen(true); setShowBadge(false); }}
              className="relative h-16 w-16 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-lg shadow-gold/30 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Parler à Andrea">
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

      {/* Chat Panel — WhatsApp Style */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[390px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-border/50 flex flex-col"
            style={{ maxHeight: "min(600px, calc(100vh - 6rem))" }}>

            {/* Header — WhatsApp-style */}
            <div className="bg-[hsl(var(--navy))] px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-navy-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">Andrea</p>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wide">
                    <ShieldCheck className="h-2.5 w-2.5" /> Vérifiée
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-white/60">En ligne</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages area — WhatsApp wallpaper style */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
              style={{
                backgroundColor: "hsl(var(--background))",
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
              }}
            >
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] ${msg.role === "user" ? "" : ""}`}>
                    {/* Bubble */}
                    <div
                      className={`relative px-3 py-2 text-[13px] leading-relaxed shadow-sm ${
                        msg.role === "user"
                          ? "bg-[hsl(160,60%,35%)] text-white rounded-2xl rounded-tr-sm"
                          : "bg-card text-foreground rounded-2xl rounded-tl-sm border border-border/50"
                      }`}
                    >
                      {msg.role === "andrea" && (
                        <p className="text-[10px] font-bold text-gold mb-1 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> Andrea
                        </p>
                      )}

                      <span>{msg.text}</span>

                      {msg.isStreaming && (
                        <motion.span
                          className="inline-block w-1 h-3.5 bg-gold ml-0.5 align-text-bottom rounded-sm"
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                        />
                      )}

                      {/* Time + read receipts */}
                      <span className={`flex items-center gap-1 justify-end mt-1 ${
                        msg.role === "user" ? "text-white/60" : "text-muted-foreground"
                      }`}>
                        <span className="text-[10px]">{msg.time}</span>
                        {msg.role === "user" && <CheckCheck className="h-3 w-3 text-sky-300" />}
                      </span>
                    </div>

                    {/* Action buttons under Andrea's messages */}
                    {msg.role === "andrea" && i > 0 && !msg.isStreaming && (
                      <div className="flex items-center gap-2 mt-1 ml-1">
                        <button onClick={() => shareResponse(msg.text)}
                          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                          <Share2 className="h-3 w-3" /> Partager
                        </button>
                      </div>
                    )}

                    {/* Pricing CTA */}
                    {msg.role === "andrea" && msg.isPricing && !msg.isStreaming && (
                      <div className="flex flex-col gap-2 mt-2 ml-1">
                        <Link to="/devenir-artisan" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/30 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors">
                          <CreditCard className="h-4 w-4" /> Accès — 99€ HT/mois
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && messages[messages.length - 1]?.role !== "andrea" && (
                <div className="flex justify-start">
                  <div className="bg-card rounded-2xl rounded-tl-sm border border-border/50 shadow-sm">
                    <p className="text-[10px] font-bold text-gold px-3 pt-2 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Andrea
                    </p>
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Buttons */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-3 pb-2 flex gap-2">
                <button
                  onClick={() => handleAsk("Je suis artisan")}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wide bg-orange-500 hover:bg-orange-600 text-white transition-colors"
                >
                  🔧 JE VEUX ÊTRE VALIDÉ
                </button>
                <button
                  onClick={() => handleAsk("J'ai un projet de travaux")}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wide bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                >
                  🏠 JE DÉPOSE MON PROJET
                </button>
              </div>
            )}

            {/* Input — WhatsApp style */}
            <div className="p-2 bg-[hsl(var(--muted))]">
              <form onSubmit={(e) => { e.preventDefault(); handleAsk(); }} className="flex items-end gap-2">
                {/* Mic button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`shrink-0 h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40"
                      : "bg-card text-muted-foreground hover:text-foreground border border-border"
                  }`}
                  aria-label={isListening ? "Arrêter" : "Dicter"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Text input */}
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={question}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
                    }}
                    placeholder={isListening ? "🎙️ Parlez maintenant..." : "Votre message..."}
                    className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                    rows={1}
                    style={{ maxHeight: "100px" }}
                    disabled={isLoading}
                  />
                </div>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  className="shrink-0 h-10 w-10 rounded-full bg-[hsl(160,60%,35%)] hover:bg-[hsl(160,60%,30%)] text-white flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>

              {isListening && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-center text-red-500 font-medium mt-1"
                >
                  🔴 Enregistrement en cours… Le message s'enverra automatiquement.
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AndreaExpertBubble;
