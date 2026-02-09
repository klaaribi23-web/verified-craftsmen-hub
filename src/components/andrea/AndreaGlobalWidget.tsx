import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sparkles, X, Mic, Loader2, Phone, Send, CheckCircle2, ShieldCheck, ArrowRight, FileText, PhoneCall } from "lucide-react";
import {
  ANDREA_TOOLTIP,
  ANDREA_WELCOME,
  ANDREA_ARTISAN_PITCH,
  ANDREA_PARTICULIER_PITCH,
  ANDREA_HEADER_SUBTITLE,
  ANDREA_PHONE_RELANCE,
  ANDREA_STEP_BY_STEP_PARTICULIER,
  ANDREA_STEP_BY_STEP_ARTISAN,
  ANDREA_CONVERSION_ANNONCE,
  ANDREA_CONVERSION_RAPPEL,
} from "@/config/andreaMessages";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAndreaVoiceAgent } from "@/hooks/useAndreaVoiceAgent";
import { useAndreaLeadCapture } from "@/hooks/useAndreaLeadCapture";
import MicWaveform from "@/components/home/MicWaveform";
import ThinkingDots from "@/components/home/ThinkingDots";
import VoiceErrorBoundary from "@/components/home/VoiceErrorBoundary";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PAGE_CONTEXT: Record<string, string> = {
  "/nos-missions": "L'utilisateur consulte les missions/chantiers disponibles.",
  "/trouver-artisan": "L'utilisateur recherche un artisan. Conseille aussi sur MaPrimeRénov, CEE et économies d'énergie.",
  "/demande-devis": "L'utilisateur veut un devis. Propose un Appel Expert si besoin.",
  "/devenir-artisan": "L'utilisateur est un artisan. Mets en avant la technologie exclusive.",
  "/inscription-artisan": "L'utilisateur est sur la page d'inscription artisan.",
  "/artisan/dashboard": "L'utilisateur est un artisan connecté.",
  "/artisan/abonnement": "L'utilisateur consulte les offres d'abonnement.",
  "/client/dashboard": "L'utilisateur est un client connecté.",
  "/comment-ca-marche": "L'utilisateur veut comprendre le fonctionnement.",
  "/": "Page d'accueil.",
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
  const [showArtisanCTA, setShowArtisanCTA] = useState(false);
  const [phoneRelanceShown, setPhoneRelanceShown] = useState(false);
  const [showConversionActions, setShowConversionActions] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevTextRef = useRef<string | null>(null);

  const {
    startConversation, isConnecting, isConnected, isSpeaking, isThinking,
    isGeneratingAudio, micActive, micLevel, stopConversation, hardReset, micPermission,
    requestMicPermission, lastAgentText, error,
    callingIndicator, micStatus,
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

  // Auto-save lead when conversation ends and we have phone (mandatory)
  useEffect(() => {
    if (!isConnected && leadData.lead_type && leadData.telephone && !savedId) {
      saveLead(undefined, location.pathname);
    }
    // Phone relance: if conversation ends with lead_type but no phone, show relance
    if (!isConnected && leadData.lead_type && !leadData.telephone && !phoneRelanceShown && lastAgentText) {
      setPhoneRelanceShown(true);
    }
  }, [isConnected, leadData, savedId, saveLead, location.pathname, phoneRelanceShown, lastAgentText]);

  // Show conversion actions after lead is saved for particuliers
  useEffect(() => {
    if (savedId && leadData.lead_type === "particulier") {
      setShowConversionActions(true);
    }
  }, [savedId, leadData.lead_type]);

  // Show artisan CTA when lead type is artisan or on relevant pages
  useEffect(() => {
    if (leadData.lead_type === "artisan" || location.pathname === "/devenir-artisan") {
      setShowArtisanCTA(true);
    }
  }, [leadData.lead_type, location.pathname]);

  // Detect new response for mini-icon pulse
  useEffect(() => {
    if (lastAgentText && lastAgentText !== prevTextRef.current) {
      prevTextRef.current = lastAgentText;
      if (!isOpen) setHasNewResponse(true);
    }
  }, [lastAgentText, isOpen]);

  // Auto-scroll to TOP of new message so user reads from the beginning
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [lastAgentText, isThinking]);

  // Send page context + step-by-step instructions when connecting
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

  const handleStartParticulier = useCallback(() => {
    updateLead({ lead_type: "particulier" });
    startConversation();
    // Send step-by-step instructions after a small delay for connection
    setTimeout(() => {
      try {
        sendTextMessage(ANDREA_STEP_BY_STEP_PARTICULIER);
      } catch {}
    }, 1500);
  }, [startConversation, sendTextMessage, updateLead]);

  const handleStartArtisan = useCallback(() => {
    updateLead({ lead_type: "artisan" });
    setShowArtisanCTA(true);
    startConversation();
    setTimeout(() => {
      try {
        sendTextMessage(ANDREA_STEP_BY_STEP_ARTISAN);
      } catch {}
    }, 1500);
  }, [startConversation, sendTextMessage, updateLead, setShowArtisanCTA]);

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
    setShowArtisanCTA(false);
    setPhoneRelanceShown(false);
    setShowConversionActions(false);
    setCallbackRequested(false);
  };

  // Expert callback — mark lead as prioritaire
  const handleRequestCallback = useCallback(async () => {
    if (!savedId || callbackRequested) return;
    setCallbackRequested(true);
    try {
      // Save as expert_call with status prioritaire
      await supabase.functions.invoke("save-andrea-lead", {
        body: {
          lead_type: "expert_call",
          data: {
            nom: leadData.nom || null,
            prenom: leadData.prenom || null,
            telephone: leadData.telephone || null,
            email: leadData.email || null,
            ville: leadData.ville || null,
            code_postal: leadData.code_postal || null,
            description: leadData.description_projet || leadData.type_projet || null,
            type_demande: "rappel_expert",
          },
          source_page: location.pathname,
        },
      });
      toast.success("Un expert vous rappellera très bientôt !");
    } catch {
      toast.error("Erreur, réessayez.");
      setCallbackRequested(false);
    }
  }, [savedId, callbackRequested, leadData, location.pathname]);

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
            className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2"
          >
            {/* Permanent tooltip */}
            <div className="max-w-[260px] rounded-xl px-3 py-2 text-[11px] font-medium text-white shadow-lg" style={{ backgroundColor: "#1A1A1A" }}>
              {ANDREA_TOOLTIP}
            </div>
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
            style={{ maxHeight: "min(580px, calc(100vh - 6rem))" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-navy to-navy-dark p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-navy-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-white text-sm">Andrea</p>
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider">Expert</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-white/40"}`} />
                   <span className="text-[11px] text-white/70">
                    {isConnected 
                      ? isSpeaking ? "Parle…" : isThinking ? "Réfléchit…" : "Connectée"
                      : ANDREA_HEADER_SUBTITLE}
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
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[140px] flex flex-col">
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
                  {isConnected && isGeneratingAudio && !isSpeaking && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                      <span className="text-xs text-teal-400 animate-pulse">🔊 Synthèse vocale en cours…</span>
                    </div>
                  )}
                  {isConnected && isSpeaking && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-400" />
                      <span className="text-xs text-teal-400 font-medium">🗣️ Andrea parle…</span>
                    </div>
                  )}
                  {isConnected && micStatus && !isThinking && !isGeneratingAudio && !isSpeaking && (
                    <div className="text-xs text-gold/80 animate-pulse text-center">{micStatus}</div>
                  )}
                </div>
              </VoiceErrorBoundary>

              {/* Welcome message — before any agent response */}
              {!lastAgentText && !isConnected && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{ backgroundColor: "#1A1A1A" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                      <Sparkles className="w-3 h-3 text-navy-dark" />
                    </div>
                    <span className="text-[11px] font-semibold text-gold/80">Andrea</span>
                    <ShieldCheck className="w-3 h-3 text-teal-400" />
                  </div>
                  <p className="text-white text-[13.5px] leading-relaxed mb-3">{ANDREA_WELCOME}</p>
                  <div className="space-y-2">
                    <button
                      onClick={handleStartParticulier}
                      className="w-full text-left text-[12px] px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                    >
                      🏠 Je suis un <strong>particulier</strong> — travaux, aides, économies
                    </button>
                    <button
                      onClick={handleStartArtisan}
                      className="w-full text-left text-[12px] px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                    >
                      🔧 Je suis un <strong>artisan</strong> — chantiers & avantages Pro
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Agent text bubble (SMS-style WhatsApp) */}
              <AnimatePresence>
                {lastAgentText && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3"
                    style={{ backgroundColor: "#1A1A1A" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center shrink-0">
                        <Sparkles className="w-3 h-3 text-navy-dark" />
                      </div>
                      <span className="text-[11px] font-semibold text-gold/80">Andrea</span>
                      <ShieldCheck className="w-3 h-3 text-teal-400" />
                    </div>
                    <p className="text-white text-[13.5px] leading-relaxed">{lastAgentText}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phone relance — shown when lead detected but no phone */}
              <AnimatePresence>
                {phoneRelanceShown && !leadData.telephone && !savedId && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3 border border-amber-500/30"
                    style={{ backgroundColor: "#1A1A1A" }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-semibold text-amber-400">Téléphone requis</span>
                    </div>
                    <p className="text-white text-[13px] leading-relaxed">{ANDREA_PHONE_RELANCE}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post-capture conversion actions for particuliers */}
              <AnimatePresence>
                {showConversionActions && leadData.lead_type === "particulier" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <div
                      className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3"
                      style={{ backgroundColor: "#1A1A1A" }}
                    >
                      <p className="text-white text-[13px] leading-relaxed mb-2">{ANDREA_CONVERSION_ANNONCE}</p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsOpen(false);
                          navigate("/demande-devis");
                        }}
                        className="w-full gap-2 bg-gold hover:bg-gold/90 text-navy-dark font-semibold text-xs h-9 rounded-lg"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Déposer une annonce
                      </Button>
                    </div>
                    <div
                      className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3"
                      style={{ backgroundColor: "#1A1A1A" }}
                    >
                      <p className="text-white text-[13px] leading-relaxed mb-2">{ANDREA_CONVERSION_RAPPEL}</p>
                      <Button
                        size="sm"
                        onClick={handleRequestCallback}
                        disabled={callbackRequested}
                        className={`w-full gap-2 text-xs h-9 rounded-lg font-semibold ${
                          callbackRequested
                            ? "bg-green-600/20 text-green-400 border border-green-500/30"
                            : "bg-teal-600 hover:bg-teal-500 text-white"
                        }`}
                      >
                        {callbackRequested ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Demande enregistrée ✓
                          </>
                        ) : (
                          <>
                            <PhoneCall className="w-3.5 h-3.5" />
                            Être rappelé par un expert
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Artisan CTA */}
              <AnimatePresence>
                {showArtisanCTA && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <Button
                      onClick={() => {
                        setIsOpen(false);
                        navigate("/inscription-artisan");
                      }}
                      className="w-full bg-gradient-to-r from-gold to-gold-light text-navy-dark font-semibold gap-2 rounded-xl h-10 text-sm hover:opacity-90"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Créer mon compte Pro & Activer mes avantages
                      <ArrowRight className="w-4 h-4" />
                    </Button>
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
            <div className="p-3 border-t border-border/50" style={{ backgroundColor: "#1A1A1A" }}>
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Écrivez votre question ici…"
                  className="flex-1 h-10 rounded-full bg-white/10 border border-white/15 text-white text-sm px-4 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-gold/40"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full bg-gold hover:bg-gold/90 text-navy-dark"
                  disabled={!textInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AndreaGlobalWidget;
