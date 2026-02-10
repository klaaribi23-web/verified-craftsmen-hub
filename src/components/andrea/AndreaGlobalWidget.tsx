import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Send, ShieldCheck, ArrowRight, FileText, PhoneCall, CheckCircle2, Phone, Sparkles, HardHat, Home } from "lucide-react";
import {
  ANDREA_TOOLTIP,
  ANDREA_WELCOME,
  ANDREA_HEADER_SUBTITLE,
  ANDREA_PHONE_RELANCE,
  ANDREA_CONVERSION_ANNONCE,
  ANDREA_CONVERSION_RAPPEL,
} from "@/config/andreaMessages";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useAndreaLeadCapture } from "@/hooks/useAndreaLeadCapture";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/* ─── Glassmorphism Andrea bubble — Anthracite + Gold border ─── */
const AndreaBubbleWrapper = ({ children, className = "", glowing = false }: { children: React.ReactNode; className?: string; glowing?: boolean }) => (
  <div className={`relative ${className}`}>
    <div
      className="relative px-4 py-3 rounded-2xl overflow-hidden"
      style={{
        background: "hsla(220, 15%, 10%, 0.88)",
        backdropFilter: "blur(20px) saturate(1.4)",
        WebkitBackdropFilter: "blur(20px) saturate(1.4)",
        border: "1px solid hsla(45, 90%, 50%, 0.2)",
        boxShadow: glowing
          ? "0 0 24px hsla(45, 93%, 47%, 0.25), 0 0 48px hsla(45, 93%, 47%, 0.08), inset 0 1px 0 hsla(45, 90%, 60%, 0.08)"
          : "0 4px 24px hsla(0, 0%, 0%, 0.25), inset 0 1px 0 hsla(45, 90%, 60%, 0.04)",
        transition: "box-shadow 0.6s ease",
      }}
    >
      {children}
    </div>
  </div>
);

/* ─── Andrea header badge — Gold/Navy ─── */
const AndreaAvatar = () => (
  <div
    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
    style={{
      background: "linear-gradient(145deg, hsl(45, 93%, 47%), hsl(35, 90%, 45%))",
      boxShadow: "0 0 12px hsla(45, 93%, 47%, 0.4)",
    }}
  >
    <Sparkles className="w-3 h-3 text-white" />
  </div>
);

const AndreaLabel = () => (
  <div className="flex items-center gap-2 mb-2">
    <AndreaAvatar />
    <span className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: "hsl(45, 93%, 60%)" }}>Andrea</span>
    <ShieldCheck className="w-3 h-3" style={{ color: "hsl(142, 71%, 45%)" }} />
  </div>
);

const AndreaGlobalWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [hasNewResponse, setHasNewResponse] = useState(false);
  const [showArtisanCTA, setShowArtisanCTA] = useState(false);
  const [phoneRelanceShown, setPhoneRelanceShown] = useState(false);
  const [showConversionActions, setShowConversionActions] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState<{ role: "user" | "andrea"; text: string }[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const {
    leadData, updateLead, processAgentText, saveLead, resetLead,
    isSaving, savedId, completionPercent,
  } = useAndreaLeadCapture();

  const lastAndreaText = messages.filter(m => m.role === "andrea").at(-1)?.text ?? null;

  useEffect(() => {
    if (lastAndreaText) processAgentText(lastAndreaText);
  }, [lastAndreaText, processAgentText]);

  useEffect(() => {
    if (leadData.lead_type && leadData.telephone && !savedId) {
      saveLead(undefined, location.pathname);
    }
    // Save draft as soon as lead type is selected (even without phone)
    if (leadData.lead_type && !leadData.telephone && !savedId && !phoneRelanceShown) {
      saveLead(undefined, location.pathname, true);
    }
    if (leadData.lead_type && !leadData.telephone && !phoneRelanceShown && lastAndreaText) {
      setPhoneRelanceShown(true);
    }
  }, [leadData, savedId, saveLead, location.pathname, phoneRelanceShown, lastAndreaText]);

  useEffect(() => {
    if (savedId && leadData.lead_type === "particulier") setShowConversionActions(true);
  }, [savedId, leadData.lead_type]);

  useEffect(() => {
    if (leadData.lead_type === "artisan" || location.pathname === "/devenir-artisan") setShowArtisanCTA(true);
  }, [leadData.lead_type, location.pathname]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamingText, isLoading]);

  // Mobile keyboard: update --vh custom property so chat resizes when virtual keyboard opens
  useEffect(() => {
    const setVh = () => document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    setVh();
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);

  const handleAsk = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    // Pad very short questions so the backend doesn't reject them
    const safeQuestion = trimmed.length < 5 ? trimmed + " (détails)" : trimmed;

    setMessages(prev => [...prev, { role: "user", text: trimmed }]);
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingText("");

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
          body: JSON.stringify({ question: safeQuestion }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        console.error("[Andrea] HTTP error", response.status, errBody);

        if (response.status === 429) {
          setMessages(prev => [...prev, { role: "andrea", text: "Trop de requêtes en ce moment. Réessayez dans quelques secondes." }]);
        } else if (response.status === 402) {
          setMessages(prev => [...prev, { role: "andrea", text: "Service temporairement indisponible. Réessayez plus tard." }]);
        } else {
          setMessages(prev => [...prev, { role: "andrea", text: "Je n'ai pas pu traiter votre demande. Reformulez votre question et réessayez." }]);
        }
        setIsStreaming(false);
        setStreamingText("");
        setIsLoading(false);
        abortRef.current = null;
        return;
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const data = line.slice(6).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.text || parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setStreamingText(fullText);
            }
          } catch {
            // partial JSON
          }
        }
      }

      if (fullText) {
        setMessages(prev => [...prev, { role: "andrea", text: fullText }]);
      } else {
        setMessages(prev => [...prev, { role: "andrea", text: "Désolé, je n'ai pas pu formuler de réponse. Réessayez." }]);
      }
      setStreamingText("");
      setIsStreaming(false);
      if (!isOpen) setHasNewResponse(true);
    } catch (err: any) {
      console.error("[Andrea] Error:", err);
      if (err.name !== "AbortError") {
        setMessages(prev => [...prev, { role: "andrea", text: "Connexion interrompue. Vérifiez votre réseau et réessayez." }]);
      }
      setIsStreaming(false);
      setStreamingText("");
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [isLoading, isOpen]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    handleAsk(textInput);
    setTextInput("");
  };

  const handleOpen = () => { setIsOpen(true); setHasNewResponse(false); };

  const handleReset = () => {
    resetLead();
    setMessages([]);
    setStreamingText("");
    setShowArtisanCTA(false);
    setPhoneRelanceShown(false);
    setShowConversionActions(false);
    setCallbackRequested(false);
  };

  const handleRequestCallback = useCallback(async () => {
    if (!savedId || callbackRequested) return;
    setCallbackRequested(true);
    try {
      await supabase.functions.invoke("save-andrea-lead", {
        body: {
          lead_type: "expert_call",
          data: {
            nom: leadData.nom || null, prenom: leadData.prenom || null,
            telephone: leadData.telephone || null, email: leadData.email || null,
            ville: leadData.ville || null, code_postal: leadData.code_postal || null,
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

  if (location.pathname.startsWith("/admin")) return null;

  const extractedFields = Object.entries(leadData)
    .filter(([k, v]) => k !== "lead_type" && v != null && v !== "" && v !== false)
    .map(([k, v]) => ({ key: k, value: String(v) }));

  const hasMessages = messages.length > 0 || isStreaming;

  /* Is Andrea currently "speaking"? Used to trigger reactive neon glow */
  const isSpeaking = isStreaming && streamingText.length > 0;

  return (
    <>
      {/* ═══════ Floating Bubble — Glassmorphism round ═══════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999] flex items-center gap-3"
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden md:block px-4 py-2 rounded-xl text-xs tracking-wide text-white/70 backdrop-blur-2xl border border-white/10"
              style={{ background: "hsla(222, 47%, 12%, 0.7)" }}
            >
              Expertise terrain · <span className="font-bold text-white">Andrea</span>
            </motion.div>

            <button
              onClick={handleOpen}
              className="relative h-16 w-16 rounded-2xl flex items-center justify-center hover:scale-110 transition-transform"
              style={{
                background: "linear-gradient(145deg, hsla(45, 93%, 47%, 0.9), hsla(35, 85%, 42%, 0.9))",
                backdropFilter: "blur(20px) saturate(2)",
                WebkitBackdropFilter: "blur(20px) saturate(2)",
              }}
              aria-label="Parler à Andrea"
            >
              {/* Gold pulse ring */}
              <motion.span
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ border: "1.5px solid hsla(45, 93%, 55%, 0.5)" }}
                animate={{
                  boxShadow: [
                    "0 0 8px hsla(45,93%,50%,0.3), 0 0 3px hsla(45,80%,70%,0.2)",
                    "0 0 24px hsla(45,93%,50%,0.6), 0 0 8px hsla(45,80%,70%,0.35)",
                    "0 0 8px hsla(45,93%,50%,0.3), 0 0 3px hsla(45,80%,70%,0.2)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <Sparkles className="h-6 w-6 text-white drop-shadow-lg" />
              <AnimatePresence>
                {hasNewResponse && (
                  <motion.span
                    initial={{ scale: 0 }} animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }} exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full ring-2 ring-background" style={{ background: "hsl(142, 71%, 45%)" }}
                  />
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Chat Panel — Cyber-Artisan Glassmorphism ═══════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", damping: 22, stiffness: 280, mass: 0.6 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[9999] w-full sm:w-[440px] sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
            style={{
              maxHeight: "min(640px, calc(var(--vh, 1vh) * 100 - 2rem))",
              background: "hsla(222, 30%, 8%, 0.82)",
              backdropFilter: "blur(28px) saturate(1.8)",
              WebkitBackdropFilter: "blur(28px) saturate(1.8)",
              boxShadow: isSpeaking
                ? "0 0 40px hsla(45, 93%, 47%, 0.3), 0 0 80px hsla(45, 93%, 47%, 0.1), 0 40px 80px -16px rgba(0,0,0,0.5)"
                : "0 0 20px hsla(45, 93%, 47%, 0.08), 0 40px 80px -16px rgba(0,0,0,0.5)",
              transition: "box-shadow 0.5s ease",
            }}
          >
            {/* Reactive gold border — glows when Andrea speaks */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              animate={{
                boxShadow: isSpeaking
                  ? [
                      "inset 0 0 0 1px hsla(45, 93%, 50%, 0.4)",
                      "inset 0 0 0 1.5px hsla(45, 93%, 55%, 0.6)",
                      "inset 0 0 0 1px hsla(45, 93%, 50%, 0.4)",
                    ]
                  : "inset 0 0 0 1px hsla(45, 90%, 50%, 0.15)",
              }}
              transition={isSpeaking ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.5 }}
            />

            {/* Header */}
            <div
              className="relative p-3.5 flex items-center gap-3 z-20"
              style={{
                background: "linear-gradient(135deg, hsla(222, 47%, 15%, 0.4), hsla(222, 40%, 12%, 0.25))",
                borderBottom: "1px solid hsla(45, 90%, 50%, 0.1)",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(145deg, hsl(45, 93%, 47%), hsl(35, 85%, 42%))",
                  boxShadow: "0 0 18px hsla(45, 93%, 47%, 0.3)",
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-black text-white text-sm tracking-wide uppercase">Andrea</p>
                  <ShieldCheck className="w-3.5 h-3.5" style={{ color: "hsl(142, 71%, 45%)" }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(142, 71%, 45%)" }} />
                  <span className="text-[10px] text-white/40 tracking-wide">{ANDREA_HEADER_SUBTITLE}</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lead bar */}
            {leadData.lead_type && completionPercent > 0 && (
              <div className="px-4 pt-2 relative z-20">
                <div className="flex items-center justify-between text-[9px] text-white/35 mb-1 tracking-widest uppercase">
                  <span>{leadData.lead_type === "particulier" ? "Dossier Client" : "Dossier Pro"}</span>
                  <span>{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-1" />
              </div>
            )}

            {/* ─── Content ─── */}
            <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-4 space-y-3 min-h-[140px] flex flex-col z-20">

              {/* Welcome */}
              {!hasMessages && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                >
                  <AndreaBubbleWrapper className="self-start w-full">
                    <AndreaLabel />
                    <p className="text-white text-[13px] leading-relaxed mb-3">{ANDREA_WELCOME}</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => { updateLead({ lead_type: "particulier" }); }}
                        className="w-full text-left text-[12px] px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/8 transition-all hover:border-gold/30 tracking-wide"
                      >
                        🏠 Je suis un <strong className="text-white">particulier</strong> — travaux, aides, économies
                      </button>
                      <button
                        onClick={() => { updateLead({ lead_type: "artisan" }); setShowArtisanCTA(true); }}
                        className="w-full text-left text-[12px] px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/8 transition-all hover:border-gold/30 tracking-wide"
                      >
                        🔧 Je suis un <strong className="text-white">artisan</strong> — chantiers & avantages Pro
                      </button>
                    </div>
                  </AndreaBubbleWrapper>
                </motion.div>
              )}

              {/* Messages */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`${msg.role === "user" ? "self-end w-[88%]" : "self-start w-full"}`}
                >
                  {msg.role === "andrea" ? (
                    <AndreaBubbleWrapper>
                      <AndreaLabel />
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-white text-[13px] leading-relaxed"
                      >{msg.text}</motion.p>
                    </AndreaBubbleWrapper>
                  ) : (
                    <div
                      className="px-4 py-3 rounded-2xl"
                      style={{
                        background: "hsla(222, 47%, 18%, 0.35)",
                        border: "1px solid hsla(222, 47%, 30%, 0.2)",
                      }}
                    >
                      <p className="text-white text-[13px] leading-relaxed">{msg.text}</p>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Streaming */}
              {isStreaming && streamingText && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-start w-full">
                  <AndreaBubbleWrapper glowing>
                    <AndreaLabel />
                    <p className="text-white text-[13px] leading-relaxed">
                      {streamingText}
                      <motion.span
                        className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom rounded-sm"
                        style={{ backgroundColor: "hsl(45, 93%, 50%)" }}
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    </p>
                  </AndreaBubbleWrapper>
                </motion.div>
              )}

              {/* Typing dots */}
              {isLoading && !isStreaming && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="self-start">
                  <AndreaBubbleWrapper>
                    <AndreaLabel />
                    <div className="flex items-center gap-2 px-1 py-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ background: "linear-gradient(135deg, hsl(45, 93%, 50%), hsl(35, 85%, 45%))" }}
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8], y: [0, -5, 0] }}
                          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                  </AndreaBubbleWrapper>
                </motion.div>
              )}

              {/* Phone relance */}
              <AnimatePresence>
                {phoneRelanceShown && !leadData.telephone && !savedId && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="self-start w-full">
                    <AndreaBubbleWrapper>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] font-black text-amber-400 tracking-widest uppercase">Téléphone requis</span>
                      </div>
                      <p className="text-white text-[13px] leading-relaxed">{ANDREA_PHONE_RELANCE}</p>
                    </AndreaBubbleWrapper>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Conversion */}
              <AnimatePresence>
                {showConversionActions && leadData.lead_type === "particulier" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                    <AndreaBubbleWrapper className="self-start w-full">
                      <p className="text-white text-[13px] leading-relaxed mb-2">{ANDREA_CONVERSION_ANNONCE}</p>
                      <Button size="sm" onClick={() => { setIsOpen(false); navigate("/demande-devis"); }}
                        className="w-full gap-2 rounded-xl text-white font-bold text-xs h-9"
                        style={{ background: "linear-gradient(135deg, hsl(45, 93%, 47%), hsl(35, 85%, 42%))" }}>
                        <FileText className="w-3.5 h-3.5" /> Déposer une annonce
                      </Button>
                    </AndreaBubbleWrapper>
                    <AndreaBubbleWrapper className="self-start w-full">
                      <p className="text-white text-[13px] leading-relaxed mb-2">{ANDREA_CONVERSION_RAPPEL}</p>
                      <Button size="sm" onClick={handleRequestCallback} disabled={callbackRequested}
                        className={`w-full gap-2 rounded-xl text-xs h-9 font-bold ${
                          callbackRequested ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-teal-600 hover:bg-teal-500 text-white"
                        }`}>
                        {callbackRequested ? (<><CheckCircle2 className="w-3.5 h-3.5" /> Demande enregistrée ✓</>) : (<><PhoneCall className="w-3.5 h-3.5" /> Être rappelé par un expert</>)}
                      </Button>
                    </AndreaBubbleWrapper>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Artisan CTA — "Je veux être validé" avec shimmer */}
              <AnimatePresence>
                {showArtisanCTA && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full space-y-1.5">
                    <p className="text-[10px] text-center tracking-wide" style={{ color: "hsla(45, 90%, 65%, 0.7)" }}>
                      Déjà +200 artisans labellisés dans les Hauts-de-France
                    </p>
                    <Button
                      onClick={() => { setIsOpen(false); navigate("/inscription-artisan"); }}
                      className="relative w-full font-black gap-2 h-10 text-sm hover:opacity-90 tracking-wide uppercase rounded-xl overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, hsl(30, 90%, 50%), hsl(45, 93%, 47%))",
                        boxShadow: "0 0 24px hsla(35, 90%, 50%, 0.35)",
                        color: "#ffffff",
                      }}
                    >
                      {/* Shimmer effect */}
                      <span
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: "linear-gradient(100deg, transparent 30%, hsla(0, 0%, 100%, 0.15) 50%, transparent 70%)",
                          backgroundSize: "200% 100%",
                          animation: "shimmer 2.5s infinite linear",
                        }}
                      />
                      <ShieldCheck className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">Je veux être validé</span>
                      <ArrowRight className="w-4 h-4 relative z-10" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chips */}
              {extractedFields.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5">
                  {extractedFields.slice(0, 6).map(({ key, value }) => (
                    <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] tracking-wide" style={{ background: "hsla(142, 71%, 45%, 0.12)", color: "hsl(142, 71%, 55%)", border: "1px solid hsla(142, 71%, 45%, 0.15)" }}>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {key}: {value.length > 15 ? value.slice(0, 15) + "…" : value}
                    </span>
                  ))}
                </motion.div>
              )}

              {savedId && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/12 border border-green-500/15 text-green-400 text-xs tracking-wide">
                  <CheckCircle2 className="w-4 h-4" /> Dossier validé ✓
                </motion.div>
              )}
            </div>

            {/* ─── Dual CTA + Input bar ─── */}
            <div className="relative p-3 z-20" style={{ borderTop: "1px solid hsla(45, 90%, 50%, 0.08)", background: "hsla(222, 30%, 6%, 0.6)" }}>
              {/* Quick-action dual buttons */}
              {!savedId && (
                <>
                  <div className="flex gap-2 mb-1.5">
                    <button
                      onClick={() => {
                        updateLead({ lead_type: "artisan" });
                        setShowArtisanCTA(true);
                        handleAsk("Je veux être validé en tant qu'artisan");
                      }}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, hsla(30, 90%, 50%, 0.85), hsla(45, 93%, 47%, 0.85))",
                        backdropFilter: "blur(12px)",
                        border: "1px solid hsla(45, 90%, 55%, 0.3)",
                        color: "#ffffff",
                        boxShadow: "0 0 12px hsla(35, 90%, 50%, 0.2)",
                      }}
                    >
                      <HardHat className="w-3.5 h-3.5" />
                      Je veux être validé
                    </button>
                    <button
                      onClick={() => {
                        updateLead({ lead_type: "particulier" });
                        handleAsk("C'est parti. Pour vous trouver le meilleur artisan certifié, j'ai besoin de 3 infos : 1) Quel est votre code postal ? 2) Quel est le métier concerné ? 3) Quel est votre budget approximatif ?");
                      }}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{
                        background: "hsla(160, 60%, 18%, 0.85)",
                        backdropFilter: "blur(12px)",
                        border: "1px solid hsla(45, 90%, 50%, 0.25)",
                        color: "hsla(0, 0%, 100%, 0.9)",
                        boxShadow: "0 0 10px hsla(160, 50%, 30%, 0.15)",
                      }}
                    >
                      <Home className="w-3.5 h-3.5" />
                      Je dépose mon projet
                    </button>
                  </div>
                  <p className="text-[9px] text-center mb-2 tracking-wide" style={{ color: "hsla(45, 80%, 65%, 0.55)" }}>
                    ✨ Andrea a déjà audité 542 chantiers ce mois-ci.
                  </p>
                </>
              )}
              <form onSubmit={handleTextSubmit} className="relative flex items-center">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Décrivez votre projet à Andrea..."
                  className="w-full h-12 rounded-xl text-[13px] pl-5 pr-14 focus:outline-none transition-all placeholder:text-white/25"
                  style={{
                    border: "1px solid hsla(45, 90%, 50%, 0.12)",
                    backgroundColor: "hsla(0, 0%, 100%, 0.06)",
                    color: "#ffffff",
                    caretColor: "#ffffff",
                    letterSpacing: "0.02em",
                  }}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1.5 h-9 w-9 rounded-lg shrink-0 text-white hover:scale-105 transition-transform"
                  style={{
                    background: "linear-gradient(145deg, hsl(45, 93%, 47%), hsl(35, 85%, 42%))",
                    boxShadow: "0 0 12px hsla(45, 93%, 47%, 0.25)",
                  }}
                  disabled={isLoading || !textInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[9px] text-white/20 text-center mt-1.5 tracking-widest uppercase">
                Expertise terrain Andrea · Réponse instantanée
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AndreaGlobalWidget;
