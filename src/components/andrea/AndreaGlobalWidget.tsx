import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles, X, Mic, Loader2, Phone, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAndreaVoiceAgent } from "@/hooks/useAndreaVoiceAgent";
import { useAndreaLeadCapture } from "@/hooks/useAndreaLeadCapture";
import MicWaveform from "@/components/home/MicWaveform";
import ThinkingDots from "@/components/home/ThinkingDots";
import VoiceErrorBoundary from "@/components/home/VoiceErrorBoundary";
import { Progress } from "@/components/ui/progress";

const PAGE_CONTEXT: Record<string, string> = {
  "/nos-missions": "L'utilisateur consulte les missions/chantiers disponibles. Aide-le à trouver des chantiers adaptés.",
  "/trouver-artisan": "L'utilisateur recherche un artisan. Aide-le à trouver le bon professionnel.",
  "/demande-devis": "L'utilisateur veut déposer un projet ou demander un devis.",
  "/devenir-artisan": "L'utilisateur est un artisan qui veut rejoindre le réseau. Qualifie-le comme lead artisan.",
  "/artisan/dashboard": "L'utilisateur est un artisan connecté sur son tableau de bord.",
  "/artisan/abonnement": "L'utilisateur consulte les offres d'abonnement artisan.",
  "/client/dashboard": "L'utilisateur est un client connecté.",
  "/comment-ca-marche": "L'utilisateur veut comprendre le fonctionnement.",
};

const getPageContext = (pathname: string): string | null => {
  for (const [path, ctx] of Object.entries(PAGE_CONTEXT)) {
    if (pathname.startsWith(path)) return ctx;
  }
  return null;
};

const AndreaGlobalWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [hasNewResponse, setHasNewResponse] = useState(false);
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTextRef = useRef<string | null>(null);

  const {
    startConversation, isConnecting, isConnected, isSpeaking, isThinking,
    micActive, micLevel, stopConversation, hardReset, micPermission,
    requestMicPermission, lastAgentText, error,
    showTextFallback, audioBlocked, callingIndicator, micStatus,
    sendTextMessage,
  } = useAndreaVoiceAgent();

  const {
    leadData, updateLead, processAgentText, saveLead, resetLead,
    isSaving, savedId, completionPercent,
  } = useAndreaLeadCapture();

  // Process agent text for lead extraction
  useEffect(() => {
    if (lastAgentText) {
      processAgentText(lastAgentText);
    }
  }, [lastAgentText, processAgentText]);

  // Auto-save lead when conversation ends and we have data
  useEffect(() => {
    if (!isConnected && leadData.lead_type && (leadData.telephone || leadData.email) && !savedId) {
      saveLead(undefined, location.pathname);
    }
  }, [isConnected, leadData, savedId, saveLead, location.pathname]);

  // Detect new response for mini-icon pulse
  useEffect(() => {
    if (lastAgentText && lastAgentText !== prevTextRef.current) {
      prevTextRef.current = lastAgentText;
      if (!isOpen) setHasNewResponse(true);
    }
  }, [lastAgentText, isOpen]);

  // Auto-scroll text bubble
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lastAgentText, isThinking]);

  // Send page context when connecting
  useEffect(() => {
    if (isConnected) {
      const ctx = getPageContext(location.pathname);
      if (ctx) {
        try {
          sendTextMessage(`[CONTEXTE PAGE] ${ctx}`);
        } catch {}
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, location.pathname]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    if (!isConnected) {
      startConversation();
    } else {
      sendTextMessage(textInput);
    }
    setTextInput("");
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasNewResponse(false);
  };

  const handleReset = () => {
    hardReset();
    resetLead();
  };

  // Don't show on admin pages
  if (location.pathname.startsWith("/admin")) return null;

  // Extracted data badges
  const extractedFields = Object.entries(leadData)
    .filter(([k, v]) => k !== "lead_type" && v != null && v !== "" && v !== false)
    .map(([k, v]) => ({ key: k, value: String(v) }));

  return (
    <>
      {/* Mini floating icon */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-[9999]"
          >
            <button
              onClick={handleOpen}
              className="relative h-14 w-14 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-lg shadow-gold/30 flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Parler à Andrea"
            >
              <Sparkles className="h-6 w-6 text-navy-dark" />
              {isConnected && (
                <span className="absolute inset-0 rounded-full animate-ping bg-gold/20 pointer-events-none" />
              )}
              <AnimatePresence>
                {hasNewResponse && !isConnected && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 h-4 w-4 bg-teal-400 rounded-full ring-2 ring-background"
                  />
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded widget panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl border border-gold/20 bg-card flex flex-col"
            style={{ maxHeight: "min(560px, calc(100vh - 6rem))" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-navy to-navy-dark p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-navy-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm">Andrea — Expert Vocal</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-white/40"}`} />
                  <span className="text-[11px] text-white/70">
                    {isConnected
                      ? isSpeaking ? "Parle…" : isThinking ? "Réfléchit…" : "Connectée"
                      : "Prête à vous aider"}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lead completion bar */}
            {leadData.lead_type && completionPercent > 0 && (
              <div className="px-3 pt-2">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Fiche {leadData.lead_type === "particulier" ? "Particulier" : "Artisan"}</span>
                  <span>{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-1.5" />
              </div>
            )}

            {/* Content area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[140px]">
              {/* Voice controls */}
              <VoiceErrorBoundary>
                <div className="space-y-2">
                  {callingIndicator && !isConnected && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/20 border border-gold/30 text-xs text-gold animate-pulse w-fit">
                      <Phone className="w-3 h-3" />
                      Appel en cours...
                    </div>
                  )}

                  <div className="flex gap-2">
                    {micPermission === "denied" ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full gap-2"
                        onClick={requestMicPermission}
                      >
                        <Mic className="w-4 h-4" /> Activer le micro 🔴
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="gold"
                          className={`flex-1 gap-2 transition-all ${
                            isConnected
                              ? isSpeaking ? "ring-2 ring-teal-400/50 bg-teal-600/20"
                              : isThinking ? "animate-pulse ring-2 ring-gold/30"
                              : "ring-2 ring-gold/50"
                              : ""
                          }`}
                          onClick={() => isConnected ? stopConversation() : startConversation()}
                          disabled={isConnecting}
                        >
                          {isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Mic className={`w-4 h-4 ${isConnected && micActive && !isSpeaking ? "animate-pulse" : ""}`} />
                          )}
                          {isConnected ? "Arrêter ⏹️" : "Parler à Andrea 🎙️"}
                        </Button>
                        {isConnected && (
                          <Button size="sm" variant="destructive" className="px-3" onClick={handleReset} title="Reset">✕</Button>
                        )}
                      </>
                    )}
                  </div>

                  {isConnected && (
                    <MicWaveform
                      level={micLevel}
                      isActive={micActive}
                      isThinking={isThinking}
                      isSpeaking={isSpeaking}
                      onReset={handleReset}
                      className="justify-center"
                    />
                  )}
                  {isConnected && isThinking && (
                    <div className="flex items-center justify-center gap-2">
                      <ThinkingDots />
                      <span className="text-xs text-gold/70">Andrea réfléchit…</span>
                    </div>
                  )}
                  {isConnected && micStatus && !isThinking && (
                    <div className="text-xs text-gold/80 animate-pulse text-center">{micStatus}</div>
                  )}
                </div>
              </VoiceErrorBoundary>

              {/* Agent text bubble (SMS-style) */}
              <AnimatePresence>
                {lastAgentText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-2xl rounded-bl-sm bg-navy-dark/95 border border-gold/20 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-navy-dark" />
                      </div>
                      <span className="text-[11px] font-semibold text-gold/80">Andrea</span>
                    </div>
                    <p className="text-white text-sm leading-relaxed">{lastAgentText}</p>
                    {audioBlocked && (
                      <p className="text-[10px] text-amber-400/80 mt-2 animate-pulse">🔇 Son bloqué — lisez ci-dessus</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Extracted data chips — real-time validation */}
              {extractedFields.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap gap-1.5"
                >
                  {extractedFields.slice(0, 6).map(({ key, value }) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 text-[10px] border border-teal-500/20"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {key}: {value.length > 15 ? value.slice(0, 15) + "…" : value}
                    </span>
                  ))}
                </motion.div>
              )}

              {/* Saved confirmation */}
              {savedId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Fiche enregistrée ✓
                </motion.div>
              )}

              {/* Error display */}
              {error && !isConnected && (
                <p className="text-xs text-destructive text-center">{error}</p>
              )}
            </div>

            {/* Text input — always visible */}
            <div className="p-3 border-t border-border">
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Écrivez votre question ici…"
                  className="flex-1 h-9 rounded-lg bg-muted border border-border text-sm px-3 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 shrink-0 bg-gold hover:bg-gold/90 text-navy-dark"
                  disabled={!textInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                ⚡ Expert IA · Voix + Texte · Qualification auto
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AndreaGlobalWidget;
