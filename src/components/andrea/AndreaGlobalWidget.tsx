import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Send, ShieldCheck, ArrowRight, FileText, PhoneCall, CheckCircle2, Phone, Sparkles, ClipboardCheck } from "lucide-react";
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

/* ─── Futuristic Andrea bubble: noir pur 80% + bordure violet/argent + angles vifs ─── */
const AndreaBubbleWrapper = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Violet/silver gradient border glow */}
    <div className="absolute -inset-[1px] pointer-events-none"
      style={{
        background: "linear-gradient(145deg, hsla(265, 90%, 65%, 0.55), hsla(0, 0%, 82%, 0.3), hsla(265, 80%, 55%, 0.45))",
        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
      }}
    />
    <div className="relative px-4 py-3 overflow-hidden"
      style={{
        background: "hsla(0, 0%, 0%, 0.82)",
        clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
        boxShadow: "inset 0 1px 0 hsla(265, 80%, 60%, 0.08), 0 8px 32px -4px hsla(265, 85%, 40%, 0.2)",
      }}>
      {children}
    </div>
  </div>
);

/* ─── Andrea header badge ─── */
const AndreaAvatar = () => (
  <div className="w-6 h-6 flex items-center justify-center shrink-0"
    style={{
      background: "linear-gradient(145deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))",
      clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))",
    }}>
    <Sparkles className="w-3 h-3 text-white" />
  </div>
);

const AndreaLabel = () => (
  <div className="flex items-center gap-2 mb-2">
    <AndreaAvatar />
    <span className="text-[11px] font-black text-purple-300 uppercase tracking-[0.12em]">Andrea</span>
    <ShieldCheck className="w-3 h-3 text-teal-400" />
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

  const handleAsk = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

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
          body: JSON.stringify({ question: trimmed }),
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        console.error("[Andrea] HTTP error", response.status, errBody);
        throw new Error(`HTTP ${response.status}`);
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
        setMessages(prev => [...prev, { role: "andrea", text: "⚠️ Connexion perdue. Réessayez dans un instant." }]);
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

  return (
    <>
      {/* ═══════ Floating Bubble ═══════ */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3"
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden md:block px-4 py-2 text-xs tracking-[0.06em] text-white/70 backdrop-blur-2xl border border-white/8"
              style={{
                background: "hsla(0, 0%, 0%, 0.6)",
                clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
              }}
            >
              Expertise terrain · <span className="font-bold text-white">Andrea</span>
            </motion.div>

            <button
              onClick={handleOpen}
              className="relative h-16 w-16 flex items-center justify-center hover:scale-110 transition-transform"
              style={{
                background: "linear-gradient(145deg, hsla(265, 80%, 50%, 0.8), hsla(220, 85%, 45%, 0.8))",
                backdropFilter: "blur(20px) saturate(2)",
                WebkitBackdropFilter: "blur(20px) saturate(2)",
                clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
              }}
              aria-label="Parler à Andrea"
            >
              <motion.span
                className="absolute inset-0 pointer-events-none"
                style={{
                  clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                  border: "1.5px solid hsla(265, 85%, 60%, 0.5)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 10px hsla(265,85%,55%,0.25), 0 0 4px hsla(0,0%,80%,0.15)",
                    "0 0 30px hsla(265,85%,55%,0.5), 0 0 12px hsla(0,0%,80%,0.3)",
                    "0 0 10px hsla(265,85%,55%,0.25), 0 0 4px hsla(0,0%,80%,0.15)",
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
                    className="absolute -top-1 -right-1 h-4 w-4 bg-teal-400 ring-2 ring-background"
                    style={{ clipPath: "polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 3px 100%, 0 calc(100% - 3px))" }}
                  />
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ Chat Panel — Noir pur + angles vifs ═══════ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.8, rotateX: 12 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 60, scale: 0.8, rotateX: 12 }}
            transition={{ type: "spring", damping: 20, stiffness: 240, mass: 0.7 }}
            className="fixed bottom-6 right-6 z-[9999] w-[440px] max-w-[calc(100vw-2rem)] overflow-hidden flex flex-col"
            style={{
              maxHeight: "min(640px, calc(100vh - 6rem))",
              background: "hsla(0, 0%, 0%, 0.92)",
              backdropFilter: "blur(28px) saturate(1.6)",
              WebkitBackdropFilter: "blur(28px) saturate(1.6)",
              clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
              boxShadow: "0 0 40px hsla(265, 85%, 40%, 0.2), 0 40px 80px -16px rgba(0,0,0,0.6)",
            }}
          >
            {/* Gradient border overlay */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                border: "1px solid transparent",
                background: "linear-gradient(160deg, hsla(265, 90%, 65%, 0.4), hsla(0, 0%, 85%, 0.2), hsla(220, 85%, 55%, 0.3)) border-box",
                WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            {/* Header */}
            <div className="relative p-3.5 flex items-center gap-3"
              style={{
                background: "linear-gradient(135deg, hsla(265, 75%, 40%, 0.15), hsla(0, 0%, 50%, 0.04))",
                borderBottom: "1px solid hsla(265, 75%, 55%, 0.12)",
              }}
            >
              <div className="w-9 h-9 flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(145deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))",
                  clipPath: "polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))",
                  boxShadow: "0 0 18px hsla(265, 85%, 55%, 0.3)",
                }}>
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-black text-white text-sm tracking-[0.06em] uppercase">Andrea</p>
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green-400 animate-pulse" style={{ clipPath: "polygon(0 0, calc(100% - 2px) 0, 100% 2px, 100% 100%, 2px 100%, 0 calc(100% - 2px))" }} />
                  <span className="text-[10px] text-white/40 tracking-[0.08em] uppercase">{ANDREA_HEADER_SUBTITLE}</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lead bar */}
            {leadData.lead_type && completionPercent > 0 && (
              <div className="px-4 pt-2 relative">
                <div className="flex items-center justify-between text-[9px] text-white/35 mb-1 tracking-[0.1em] uppercase">
                  <span>{leadData.lead_type === "particulier" ? "Dossier Client" : "Dossier Pro"}</span>
                  <span>{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-1" />
              </div>
            )}

            {/* ─── Content ─── */}
            <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-4 space-y-3 min-h-[140px] flex flex-col">

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
                        className="w-full text-left text-[12px] px-3 py-2.5 bg-white/4 hover:bg-white/8 text-white/80 border border-white/6 transition-all hover:border-purple-500/25 tracking-wide"
                        style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
                      >
                        🏠 Je suis un <strong className="text-white">particulier</strong> — travaux, aides, économies
                      </button>
                      <button
                        onClick={() => { updateLead({ lead_type: "artisan" }); setShowArtisanCTA(true); }}
                        className="w-full text-left text-[12px] px-3 py-2.5 bg-white/4 hover:bg-white/8 text-white/80 border border-white/6 transition-all hover:border-purple-500/25 tracking-wide"
                        style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
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
                    <div className="px-4 py-3"
                      style={{
                        background: "hsla(0, 0%, 100%, 0.06)",
                        border: "1px solid hsla(0, 0%, 100%, 0.08)",
                        clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
                      }}>
                      <p className="text-white text-[13px] leading-relaxed">{msg.text}</p>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Streaming */}
              {isStreaming && streamingText && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-start w-full">
                  <AndreaBubbleWrapper>
                    <AndreaLabel />
                    <p className="text-white text-[13px] leading-relaxed">
                      {streamingText}
                      <motion.span
                        className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom"
                        style={{ backgroundColor: "hsl(265, 85%, 55%)" }}
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
                          className="w-2 h-2"
                          style={{
                            background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))",
                            clipPath: "polygon(0 0, calc(100% - 2px) 0, 100% 2px, 100% 100%, 2px 100%, 0 calc(100% - 2px))",
                          }}
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8], y: [0, -5, 0] }}
                          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
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
                        <span className="text-[11px] font-black text-amber-400 tracking-[0.1em] uppercase">Téléphone requis</span>
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
                        className="w-full gap-2 text-white font-bold text-xs h-9"
                        style={{
                          background: "linear-gradient(135deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))",
                          clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                          borderRadius: 0,
                        }}>
                        <FileText className="w-3.5 h-3.5" /> Déposer une annonce
                      </Button>
                    </AndreaBubbleWrapper>
                    <AndreaBubbleWrapper className="self-start w-full">
                      <p className="text-white text-[13px] leading-relaxed mb-2">{ANDREA_CONVERSION_RAPPEL}</p>
                      <Button size="sm" onClick={handleRequestCallback} disabled={callbackRequested}
                        className={`w-full gap-2 text-xs h-9 font-bold ${
                          callbackRequested ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-teal-600 hover:bg-teal-500 text-white"
                        }`}
                        style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))", borderRadius: 0 }}>
                        {callbackRequested ? (<><CheckCircle2 className="w-3.5 h-3.5" /> Demande enregistrée ✓</>) : (<><PhoneCall className="w-3.5 h-3.5" /> Être rappelé par un expert</>)}
                      </Button>
                    </AndreaBubbleWrapper>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Artisan CTA — "Obtenir mon audit de chantier gratuit" */}
              <AnimatePresence>
                {showArtisanCTA && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Button
                      onClick={() => { setIsOpen(false); navigate("/inscription-artisan"); }}
                      className="w-full text-white font-black gap-2 h-11 text-sm hover:opacity-90 tracking-[0.04em] uppercase"
                      style={{
                        background: "linear-gradient(135deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))",
                        clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
                        borderRadius: 0,
                        boxShadow: "0 0 20px hsla(265, 85%, 50%, 0.25)",
                      }}>
                      <ClipboardCheck className="w-4 h-4" /> Obtenir mon audit de chantier gratuit <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chips */}
              {extractedFields.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5">
                  {extractedFields.slice(0, 6).map(({ key, value }) => (
                    <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-500/12 text-teal-300 text-[10px] border border-teal-500/15 tracking-[0.06em]"
                      style={{ clipPath: "polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))" }}>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {key}: {value.length > 15 ? value.slice(0, 15) + "…" : value}
                    </span>
                  ))}
                </motion.div>
              )}

              {savedId && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 bg-green-500/12 border border-green-500/15 text-green-400 text-xs tracking-[0.06em]"
                  style={{ clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}>
                  <CheckCircle2 className="w-4 h-4" /> Dossier validé ✓
                </motion.div>
              )}
            </div>

            {/* ─── Input bar ─── */}
            <div className="relative p-3" style={{ borderTop: "1px solid hsla(265, 75%, 50%, 0.1)", background: "hsla(0, 0%, 0%, 0.95)" }}>
              <form onSubmit={handleTextSubmit} className="flex gap-2 items-center">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Décrivez votre projet à Andrea..."
                  className="flex-1 h-12 border text-[13px] px-5 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-white/20"
                  style={{
                    borderColor: "hsla(265, 75%, 50%, 0.15)",
                    backgroundColor: "hsla(0, 0%, 100%, 0.05)",
                    color: "#ffffff",
                    caretColor: "#ffffff",
                    letterSpacing: "0.02em",
                    clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                    borderRadius: 0,
                  }}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-12 w-12 shrink-0 text-white shadow-lg hover:scale-105 transition-transform"
                  style={{
                    background: "linear-gradient(145deg, hsl(220, 85%, 50%), hsl(265, 80%, 50%))",
                    boxShadow: "0 0 18px hsla(265, 85%, 50%, 0.25)",
                    clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
                    borderRadius: 0,
                  }}
                  disabled={isLoading || !textInput.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
              <p className="text-[9px] text-white/20 text-center mt-2 tracking-[0.12em] uppercase">
                20 ans de terrain · Roubaix · Hauts-de-France
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AndreaGlobalWidget;
