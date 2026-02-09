import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Send, ShieldCheck, ArrowRight, FileText, PhoneCall, CheckCircle2, Phone, Sparkles } from "lucide-react";
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

/* ─── Andrea bubble style: chrome/violet metallic border ─── */
const andreaBubbleStyle = {
  backgroundColor: "hsla(265, 45%, 14%, 0.55)",
  border: "1px solid transparent",
  borderImage: "linear-gradient(135deg, hsla(265, 90%, 65%, 0.5), hsla(0, 0%, 75%, 0.35), hsla(265, 85%, 55%, 0.5)) 1",
  borderRadius: "1rem 1rem 0.25rem 1rem",
  boxShadow: "0 4px 18px -2px hsla(265, 85%, 45%, 0.25)",
  clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)",
};

/* Wrapper to apply clip-path + border since borderImage breaks borderRadius */
const AndreaBubbleWrapper = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative ${className}`}>
    {/* Metallic border glow behind */}
    <div className="absolute -inset-[1px] rounded-2xl rounded-bl-sm opacity-60 pointer-events-none"
      style={{
        background: "linear-gradient(135deg, hsla(265, 90%, 65%, 0.5), hsla(0, 0%, 80%, 0.3), hsla(220, 90%, 55%, 0.4))",
        filter: "blur(0.5px)",
      }}
    />
    <div className="relative rounded-2xl rounded-bl-sm px-4 py-3 overflow-hidden"
      style={{
        background: "hsla(265, 45%, 12%, 0.65)",
        backdropFilter: "blur(8px)",
        boxShadow: "0 6px 24px -4px hsla(265, 85%, 45%, 0.2)",
      }}>
      {children}
    </div>
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

  // Process agent text for lead extraction
  useEffect(() => {
    if (lastAndreaText) processAgentText(lastAndreaText);
  }, [lastAndreaText, processAgentText]);

  // Auto-save lead
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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, streamingText, isLoading]);

  // Streaming text ask
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
            // partial JSON, skip
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
      {/* ─────── Floating Bubble — Ultra Glassmorphism ─────── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3"
          >
            {/* Label */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden md:block rounded-full px-4 py-2 text-xs tracking-wide text-white/80 backdrop-blur-2xl border border-white/10"
              style={{
                background: "linear-gradient(135deg, hsla(265, 85%, 55%, 0.12), hsla(0, 0%, 60%, 0.08))",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                letterSpacing: "0.04em",
              }}
            >
              L'élite du bâtiment · <span className="font-semibold text-white">Andrea</span>
            </motion.div>

            {/* Bubble — Chrome/Violet metallic glow */}
            <button
              onClick={handleOpen}
              className="relative h-16 w-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform"
              style={{
                background: "linear-gradient(145deg, hsla(265, 80%, 50%, 0.7), hsla(220, 85%, 45%, 0.7))",
                backdropFilter: "blur(20px) saturate(2)",
                WebkitBackdropFilter: "blur(20px) saturate(2)",
              }}
              aria-label="Parler à Andrea"
            >
              {/* Metallic chrome/violet border ring */}
              <motion.span
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  border: "1.5px solid transparent",
                  background: "linear-gradient(135deg, hsla(265, 90%, 70%, 0.6), hsla(0, 0%, 85%, 0.4), hsla(220, 90%, 60%, 0.6)) border-box",
                  WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                }}
                animate={{
                  boxShadow: [
                    "0 0 12px hsla(265,85%,55%,0.3), 0 0 4px hsla(0,0%,80%,0.2)",
                    "0 0 28px hsla(265,85%,55%,0.5), 0 0 10px hsla(0,0%,80%,0.35)",
                    "0 0 12px hsla(265,85%,55%,0.3), 0 0 4px hsla(0,0%,80%,0.2)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <Sparkles className="h-6 w-6 text-white drop-shadow-lg" />
              <AnimatePresence>
                {hasNewResponse && (
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

      {/* ─────── Chat Panel — Smoked Glass Ultra ─────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.85, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 60, scale: 0.85, rotateX: 8 }}
            transition={{ type: "spring", damping: 22, stiffness: 260, mass: 0.8 }}
            className="fixed bottom-6 right-6 z-[9999] w-[390px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden flex flex-col"
            style={{
              maxHeight: "min(600px, calc(100vh - 6rem))",
              background: "hsla(222, 50%, 8%, 0.88)",
              backdropFilter: "blur(24px) saturate(1.8)",
              WebkitBackdropFilter: "blur(24px) saturate(1.8)",
              boxShadow: "0 0 30px hsla(265, 85%, 45%, 0.2), 0 0 60px hsla(265, 85%, 45%, 0.08), 0 30px 60px -12px rgba(0,0,0,0.5)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              letterSpacing: "0.01em",
            }}
          >
            {/* Metallic gradient border overlay */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                border: "1px solid transparent",
                background: "linear-gradient(160deg, hsla(265, 90%, 65%, 0.45), hsla(0, 0%, 80%, 0.2), hsla(220, 90%, 55%, 0.35), hsla(265, 80%, 50%, 0.3)) border-box",
                WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            {/* Header */}
            <div
              className="relative p-3 flex items-center gap-3"
              style={{
                background: "linear-gradient(135deg, hsla(265, 80%, 45%, 0.2), hsla(0, 0%, 60%, 0.06))",
                borderBottom: "1px solid hsla(265, 80%, 60%, 0.15)",
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(145deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))",
                  boxShadow: "0 0 16px hsla(265, 85%, 55%, 0.35)",
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-white text-sm tracking-wide">Andrea</p>
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[8px] font-black text-teal-400 uppercase tracking-[0.15em]">Directrice</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] text-white/50 tracking-wide">{ANDREA_HEADER_SUBTITLE}</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lead completion bar */}
            {leadData.lead_type && completionPercent > 0 && (
              <div className="px-3 pt-2 relative">
                <div className="flex items-center justify-between text-[10px] text-white/40 mb-1 tracking-wide">
                  <span>{leadData.lead_type === "particulier" ? "Dossier Client" : "Dossier Pro"}</span>
                  <span>{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-1.5" />
              </div>
            )}

            {/* Content area */}
            <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-4 space-y-3 min-h-[140px] flex flex-col">
              {/* Welcome message */}
              {!hasMessages && (
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.5 }}
                >
                  <AndreaBubbleWrapper className="self-start w-[92%]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))" }}>
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-purple-300 tracking-wide">Andrea</span>
                      <ShieldCheck className="w-3 h-3 text-teal-400" />
                    </div>
                    <p className="text-white/90 text-[13px] leading-relaxed mb-3">{ANDREA_WELCOME}</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => { updateLead({ lead_type: "particulier" }); }}
                        className="w-full text-left text-[12px] px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/8 transition-all hover:border-purple-500/30 tracking-wide"
                      >
                        🏠 Je suis un <strong>particulier</strong> — travaux, aides, économies
                      </button>
                      <button
                        onClick={() => { updateLead({ lead_type: "artisan" }); setShowArtisanCTA(true); }}
                        className="w-full text-left text-[12px] px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/8 transition-all hover:border-purple-500/30 tracking-wide"
                      >
                        🔧 Je suis un <strong>artisan</strong> — chantiers & avantages Pro
                      </button>
                    </div>
                  </AndreaBubbleWrapper>
                </motion.div>
              )}

              {/* Message history */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`w-[92%] ${msg.role === "user" ? "self-end" : "self-start"}`}
                >
                  {msg.role === "andrea" ? (
                    <AndreaBubbleWrapper>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "linear-gradient(135deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))" }}>
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-[11px] font-bold text-purple-300 tracking-wide">Andrea</span>
                        <ShieldCheck className="w-3 h-3 text-teal-400" />
                      </div>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="text-white/90 text-[13px] leading-relaxed"
                      >{msg.text}</motion.p>
                    </AndreaBubbleWrapper>
                  ) : (
                    <div className="rounded-2xl rounded-br-sm px-4 py-3 bg-white/8 border border-white/10">
                      <p className="text-white/90 text-[13px] leading-relaxed">{msg.text}</p>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Streaming bubble */}
              {isStreaming && streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="self-start w-[92%]"
                >
                  <AndreaBubbleWrapper>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))" }}>
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-purple-300 tracking-wide">Andrea</span>
                      <ShieldCheck className="w-3 h-3 text-teal-400" />
                    </div>
                    <p className="text-white/90 text-[13px] leading-relaxed">
                      {streamingText}
                      <motion.span
                        className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom rounded-sm"
                        style={{ backgroundColor: "hsl(265, 85%, 55%)" }}
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    </p>
                  </AndreaBubbleWrapper>
                </motion.div>
              )}

              {/* Typing indicator — dancing dots */}
              {isLoading && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="self-start"
                >
                  <AndreaBubbleWrapper>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))" }}>
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-purple-300 tracking-wide">Andrea</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-1 py-1">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{ background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))" }}
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
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="self-start w-[92%]">
                    <AndreaBubbleWrapper>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-400 tracking-wide">Téléphone requis</span>
                      </div>
                      <p className="text-white text-[13px] leading-relaxed">{ANDREA_PHONE_RELANCE}</p>
                    </AndreaBubbleWrapper>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post-capture conversion */}
              <AnimatePresence>
                {showConversionActions && leadData.lead_type === "particulier" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                    <AndreaBubbleWrapper className="self-start w-[92%]">
                      <p className="text-white text-[13px] leading-relaxed mb-2">{ANDREA_CONVERSION_ANNONCE}</p>
                      <Button size="sm" onClick={() => { setIsOpen(false); navigate("/demande-devis"); }}
                        className="w-full gap-2 text-white font-semibold text-xs h-9 rounded-lg"
                        style={{ background: "linear-gradient(135deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))" }}>
                        <FileText className="w-3.5 h-3.5" /> Déposer une annonce
                      </Button>
                    </AndreaBubbleWrapper>
                    <AndreaBubbleWrapper className="self-start w-[92%]">
                      <p className="text-white text-[13px] leading-relaxed mb-2">{ANDREA_CONVERSION_RAPPEL}</p>
                      <Button size="sm" onClick={handleRequestCallback} disabled={callbackRequested}
                        className={`w-full gap-2 text-xs h-9 rounded-lg font-semibold ${
                          callbackRequested ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-teal-600 hover:bg-teal-500 text-white"
                        }`}>
                        {callbackRequested ? (<><CheckCircle2 className="w-3.5 h-3.5" /> Demande enregistrée ✓</>) : (<><PhoneCall className="w-3.5 h-3.5" /> Être rappelé par un expert</>)}
                      </Button>
                    </AndreaBubbleWrapper>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Artisan CTA */}
              <AnimatePresence>
                {showArtisanCTA && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Button
                      onClick={() => { setIsOpen(false); navigate("/inscription-artisan"); }}
                      className="w-full text-white font-bold gap-2 rounded-xl h-10 text-sm hover:opacity-90 tracking-wide"
                      style={{ background: "linear-gradient(135deg, hsl(265, 80%, 50%), hsl(220, 85%, 50%))" }}>
                      <ShieldCheck className="w-4 h-4" /> Rejoindre l'Élite <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Extracted data chips */}
              {extractedFields.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5">
                  {extractedFields.slice(0, 6).map(({ key, value }) => (
                    <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 text-[10px] border border-teal-500/20 tracking-wide">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {key}: {value.length > 15 ? value.slice(0, 15) + "…" : value}
                    </span>
                  ))}
                </motion.div>
              )}

              {savedId && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400 text-xs tracking-wide">
                  <CheckCircle2 className="w-4 h-4" /> Dossier validé ✓
                </motion.div>
              )}
            </div>

            {/* ─── Input bar ─── */}
            <div className="relative p-3" style={{ borderTop: "1px solid hsla(265, 80%, 55%, 0.12)", background: "hsla(222, 50%, 6%, 0.92)" }}>
              <form onSubmit={handleTextSubmit} className="flex gap-2 items-center">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Décrivez votre projet à Andrea..."
                  className="flex-1 h-12 rounded-full border text-[13px] px-5 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all placeholder:text-white/25"
                  style={{
                    borderColor: "hsla(265, 80%, 55%, 0.2)",
                    backgroundColor: "hsla(0, 0%, 100%, 0.08)",
                    color: "#ffffff",
                    caretColor: "#ffffff",
                    letterSpacing: "0.02em",
                  }}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="h-12 w-12 shrink-0 rounded-full text-white shadow-lg hover:scale-105 transition-transform"
                  style={{
                    background: "linear-gradient(145deg, hsl(220, 85%, 50%), hsl(265, 80%, 50%))",
                    boxShadow: "0 0 16px hsla(265, 85%, 50%, 0.3)",
                  }}
                  disabled={isLoading || !textInput.trim()}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
              <p className="text-[10px] text-white/25 text-center mt-2 tracking-[0.08em] uppercase">
                Ici on sélectionne, on ne subit pas.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AndreaGlobalWidget;
