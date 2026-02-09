import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Mic, MicOff, Send, ShieldCheck, ArrowRight, FileText, PhoneCall, CheckCircle2, Phone, Sparkles } from "lucide-react";
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

const AndreaGlobalWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [hasNewResponse, setHasNewResponse] = useState(false);
  const [showArtisanCTA, setShowArtisanCTA] = useState(false);
  const [phoneRelanceShown, setPhoneRelanceShown] = useState(false);
  const [showConversionActions, setShowConversionActions] = useState(false);
  const [callbackRequested, setCallbackRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "andrea"; text: string }[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
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

    // Add user message to chat
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
                setStreamingText(fullText);
              }
            } catch {}
          }
        }
      }

      setMessages(prev => [...prev, { role: "andrea", text: fullText }]);
      setStreamingText("");
      setIsStreaming(false);
      if (!isOpen) setHasNewResponse(true);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Impossible de contacter Andrea. Réessayez.");
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

  // Speech-to-Text toggle
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
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        setTextInput(transcript);
      }
    };
    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error === "not-allowed" || event.error === "denied") toast.error("Micro bloqué. Autorisez l'accès.", { duration: 2000 });
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    try { recognition.start(); setIsListening(true); }
    catch { toast.error("Micro bloqué.", { duration: 2000 }); }
  }, [isListening, handleAsk]);

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
      {/* Floating Bubble + Label */}
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
              className="hidden md:block rounded-full px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-xl border border-white/10"
              style={{
                background: "linear-gradient(135deg, hsla(265, 85%, 55%, 0.15), hsla(220, 90%, 55%, 0.15))",
              }}
            >
              Besoin d'un artisan ? <span className="font-semibold text-white">Demandez à Andrea</span>
            </motion.div>

            {/* Bubble */}
            <button
              onClick={handleOpen}
              className="relative h-16 w-16 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_hsla(265,85%,55%,0.4)]"
              style={{
                background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))",
                border: "1px solid hsla(265, 90%, 70%, 0.5)",
                backdropFilter: "blur(12px)",
              }}
              aria-label="Parler à Andrea"
            >
              <Mic className="h-7 w-7 text-white" />
              <span className="absolute inset-0 rounded-full animate-[ping_3s_ease-in-out_infinite] pointer-events-none"
                style={{ background: "hsla(265, 85%, 55%, 0.15)" }} />
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

      {/* Chat Panel — Glassmorphism + Neon Border */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-[9999] w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            style={{
              maxHeight: "min(580px, calc(100vh - 6rem))",
              background: "hsla(222, 47%, 11%, 0.85)",
              backdropFilter: "blur(20px) saturate(1.5)",
              WebkitBackdropFilter: "blur(20px) saturate(1.5)",
              border: "1px solid hsla(265, 90%, 65%, 0.4)",
              boxShadow: "0 0 20px hsla(265, 85%, 55%, 0.2), 0 25px 50px -12px rgba(0,0,0,0.4)",
            }}
          >
            {/* Header */}
            <div
              className="p-3 flex items-center gap-3"
              style={{
                background: "linear-gradient(135deg, hsla(265, 85%, 55%, 0.2), hsla(220, 90%, 55%, 0.15))",
                borderBottom: "1px solid hsla(265, 90%, 65%, 0.2)",
              }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))",
                  boxShadow: "0 0 12px hsla(265, 85%, 55%, 0.4)",
                }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-white text-sm">Andrea</p>
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span className="text-[9px] font-bold text-teal-400 uppercase tracking-wider">Expert</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[11px] text-white/60">{ANDREA_HEADER_SUBTITLE}</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Lead completion bar */}
            {leadData.lead_type && completionPercent > 0 && (
              <div className="px-3 pt-2">
                <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                  <span>Fiche {leadData.lead_type === "particulier" ? "Particulier" : "Artisan"}</span>
                  <span>{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="h-1.5" />
              </div>
            )}

            {/* Content area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[140px] flex flex-col">
              {/* Welcome message */}
              {!hasMessages && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{ backgroundColor: "hsla(265, 50%, 20%, 0.4)", border: "1px solid hsla(265, 90%, 65%, 0.15)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))" }}>
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold text-purple-300">Andrea</span>
                    <ShieldCheck className="w-3 h-3 text-teal-400" />
                  </div>
                  <p className="text-white/90 text-[13.5px] leading-relaxed mb-3">{ANDREA_WELCOME}</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => { updateLead({ lead_type: "particulier" }); }}
                      className="w-full text-left text-[12px] px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                    >
                      🏠 Je suis un <strong>particulier</strong> — travaux, aides, économies
                    </button>
                    <button
                      onClick={() => { updateLead({ lead_type: "artisan" }); setShowArtisanCTA(true); }}
                      className="w-full text-left text-[12px] px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-colors"
                    >
                      🔧 Je suis un <strong>artisan</strong> — chantiers & avantages Pro
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Message history */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`w-[92%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "self-end rounded-br-sm bg-white/10 border border-white/10"
                      : "self-start rounded-bl-sm"
                  }`}
                  style={msg.role === "andrea" ? { backgroundColor: "hsla(265, 50%, 20%, 0.4)", border: "1px solid hsla(265, 90%, 65%, 0.15)" } : undefined}
                >
                  {msg.role === "andrea" && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))" }}>
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-semibold text-purple-300">Andrea</span>
                      <ShieldCheck className="w-3 h-3 text-teal-400" />
                    </div>
                  )}
                  <p className="text-white/90 text-[13.5px] leading-relaxed">{msg.text}</p>
                </motion.div>
              ))}

              {/* Streaming bubble */}
              {isStreaming && streamingText && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3"
                  style={{ backgroundColor: "hsla(265, 50%, 20%, 0.4)", border: "1px solid hsla(265, 90%, 65%, 0.15)" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))" }}>
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold text-purple-300">Andrea</span>
                    <ShieldCheck className="w-3 h-3 text-teal-400" />
                  </div>
                  <p className="text-white/90 text-[13.5px] leading-relaxed">
                    {streamingText}
                    <motion.span
                      className="inline-block w-1.5 h-4 ml-0.5 align-text-bottom rounded-sm"
                      style={{ backgroundColor: "hsl(265, 85%, 55%)" }}
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  </p>
                </motion.div>
              )}

              {/* Loading indicator */}
              {isLoading && !isStreaming && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-3 text-white/60 text-sm"
                    style={{ backgroundColor: "hsla(265, 50%, 20%, 0.4)" }}>
                    <div className="flex items-center gap-[3px] h-5">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                          key={i}
                          className="w-[3px] rounded-full"
                          style={{ backgroundColor: "hsl(265, 85%, 55%)" }}
                          animate={{ height: ["6px", "16px", "6px"] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1, ease: "easeInOut" }}
                        />
                      ))}
                    </div>
                    <span>Andrea prépare sa réponse…</span>
                  </div>
                </div>
              )}

              {/* Phone relance */}
              <AnimatePresence>
                {phoneRelanceShown && !leadData.telephone && !savedId && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3 border border-amber-500/30"
                    style={{ backgroundColor: "hsla(265, 50%, 20%, 0.4)" }}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-[11px] font-semibold text-amber-400">Téléphone requis</span>
                    </div>
                    <p className="text-white text-[13px] leading-relaxed">{ANDREA_PHONE_RELANCE}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Post-capture conversion */}
              <AnimatePresence>
                {showConversionActions && leadData.lead_type === "particulier" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-2">
                    <div className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3"
                      style={{ backgroundColor: "hsla(265, 50%, 20%, 0.4)" }}>
                      <p className="text-white text-[13px] leading-relaxed mb-2">{ANDREA_CONVERSION_ANNONCE}</p>
                      <Button size="sm" onClick={() => { setIsOpen(false); navigate("/demande-devis"); }}
                        className="w-full gap-2 text-white font-semibold text-xs h-9 rounded-lg"
                        style={{ background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))" }}>
                        <FileText className="w-3.5 h-3.5" /> Déposer une annonce
                      </Button>
                    </div>
                    <div className="self-start w-[92%] rounded-2xl rounded-bl-sm px-4 py-3"
                      style={{ backgroundColor: "hsla(265, 50%, 20%, 0.4)" }}>
                      <p className="text-white text-[13px] leading-relaxed mb-2">{ANDREA_CONVERSION_RAPPEL}</p>
                      <Button size="sm" onClick={handleRequestCallback} disabled={callbackRequested}
                        className={`w-full gap-2 text-xs h-9 rounded-lg font-semibold ${
                          callbackRequested ? "bg-green-600/20 text-green-400 border border-green-500/30" : "bg-teal-600 hover:bg-teal-500 text-white"
                        }`}>
                        {callbackRequested ? (<><CheckCircle2 className="w-3.5 h-3.5" /> Demande enregistrée ✓</>) : (<><PhoneCall className="w-3.5 h-3.5" /> Être rappelé par un expert</>)}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Artisan CTA */}
              <AnimatePresence>
                {showArtisanCTA && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <Button
                      onClick={() => { setIsOpen(false); navigate("/inscription-artisan"); }}
                      className="w-full text-white font-semibold gap-2 rounded-xl h-10 text-sm hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))" }}>
                      <ShieldCheck className="w-4 h-4" /> Créer mon compte Pro <ArrowRight className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Extracted data chips */}
              {extractedFields.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-1.5">
                  {extractedFields.slice(0, 6).map(({ key, value }) => (
                    <span key={key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-300 text-[10px] border border-teal-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {key}: {value.length > 15 ? value.slice(0, 15) + "…" : value}
                    </span>
                  ))}
                </motion.div>
              )}

              {savedId && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400 text-xs">
                  <CheckCircle2 className="w-4 h-4" /> Fiche enregistrée ✓
                </motion.div>
              )}
            </div>

            {/* Input bar */}
            <div className="p-3" style={{ borderTop: "1px solid hsla(265, 90%, 65%, 0.15)", backgroundColor: "hsla(222, 47%, 8%, 0.6)" }}>
              <form onSubmit={handleTextSubmit} className="flex gap-2">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Posez votre question ici…"
                  className="flex-1 h-10 rounded-full bg-white/8 border text-white text-sm px-4 placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                  style={{ borderColor: "hsla(265, 90%, 65%, 0.2)" }}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isLoading}
                  className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-[0_0_12px_hsla(0,80%,50%,0.4)]"
                      : "bg-white/10 hover:bg-white/15 text-white/70"
                  }`}
                  aria-label={isListening ? "Arrêter le micro" : "Dicter ma question"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <Button
                  type="submit"
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-full text-white"
                  style={{ background: "linear-gradient(135deg, hsl(265, 85%, 55%), hsl(220, 90%, 55%))" }}
                  disabled={isLoading || !textInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-white/30 text-center mt-2">
                ⚡ IA experte · Réponse instantanée · 🎙️ Dictez votre question
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AndreaGlobalWidget;
