import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { X, Send, ShieldCheck, ArrowRight, FileText, PhoneCall, CheckCircle2, Phone, Sparkles, HardHat, Home, Mic, MicOff, CheckCheck } from "lucide-react";
import {
  ANDREA_TOOLTIP,
  ANDREA_WELCOME,
  ANDREA_HEADER_SUBTITLE,
  ANDREA_PHONE_RELANCE,
  ANDREA_CONVERSION_ANNONCE,
  ANDREA_CONVERSION_RAPPEL,
  ANDREA_ARTISAN_CONTEXT,
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
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
      style={{ background: "hsla(142, 71%, 45%, 0.15)", color: "hsl(142, 71%, 55%)", border: "1px solid hsla(142, 71%, 45%, 0.25)" }}>
      <ShieldCheck className="w-2.5 h-2.5" /> Vérifiée
    </span>
  </div>
);

const getTime = () => new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

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
  const [showPreviewBubble, setShowPreviewBubble] = useState(false);
  const [dismissedAutoOpen, setDismissedAutoOpen] = useState(false);

  const [messages, setMessages] = useState<{ role: "user" | "andrea"; text: string; time?: string }[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Artisan context detection
  const [artisanContext, setArtisanContext] = useState<{
    business_name: string;
    city: string;
    is_audited: boolean;
    category?: string;
  } | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const {
    leadData, updateLead, processAgentText, saveLead, resetLead,
    isSaving, savedId, completionPercent,
  } = useAndreaLeadCapture();

  const lastAndreaText = messages.filter(m => m.role === "andrea").at(-1)?.text ?? null;

  // Detect artisan page and fetch context
  useEffect(() => {
    const match = location.pathname.match(/^\/artisan\/(.+)$/);
    if (!match) {
      setArtisanContext(null);
      return;
    }
    const slug = match[1];
    const fetchArtisan = async () => {
      const { data } = await supabase
        .from("public_artisans")
        .select("business_name, city, is_audited, category:categories(name)")
        .eq("slug", slug)
        .maybeSingle();
      if (data) {
        setArtisanContext({
          business_name: data.business_name || "",
          city: data.city || "",
          is_audited: data.is_audited || false,
          category: (data.category as any)?.name || undefined,
        });
      }
    };
    fetchArtisan();
  }, [location.pathname]);

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

  // Track if user is interacting with call button (prevent Andrea from opening over it)
  const isInteractingWithCallRef = useRef(false);
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.('[data-call-button]') || target?.closest?.('a[href^="tel:"]')) {
        isInteractingWithCallRef.current = true;
        setTimeout(() => { isInteractingWithCallRef.current = false; }, 3000);
      }
    };
    document.addEventListener("pointerdown", handler, true);
    return () => document.removeEventListener("pointerdown", handler, true);
  }, []);

  // Auto-open on artisan pages after 7s OR on 50% scroll (only if not dismissed before)
  useEffect(() => {
    if (!artisanContext || isOpen || dismissedAutoOpen) return;
    const dismissKey = `andrea_dismissed_${location.pathname}`;
    if (sessionStorage.getItem(dismissKey)) {
      setDismissedAutoOpen(true);
      return;
    }

    let triggered = false;
    const triggerAutoOpen = () => {
      if (triggered || isInteractingWithCallRef.current) return;
      triggered = true;
      setShowPreviewBubble(false);
      handleOpen();
      setMessages(prev => {
        if (prev.length > 0) return prev;
        const greeting = `Je vois que tu regardes le profil de ${artisanContext.business_name}. J'ai validé son dossier à ${artisanContext.city}. ${artisanContext.is_audited ? "Tu veux que je te dise pourquoi il est audité ?" : "Tu veux que je te mette en relation directe avec lui ?"}`;
        return [{ role: "andrea", text: greeting, time: getTime() }];
      });
    };

    // Preview bubble appears after 5s (2s before the 7s auto-open)
    const previewTimer = setTimeout(() => setShowPreviewBubble(true), 5000);
    // Full auto-open after 7s
    const openTimer = setTimeout(triggerAutoOpen, 7000);

    // Scroll trigger: open immediately if user scrolls past 50% of page
    const scrollHandler = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent >= 0.5) {
        triggerAutoOpen();
      }
    };
    window.addEventListener("scroll", scrollHandler, { passive: true });

    return () => {
      clearTimeout(previewTimer);
      clearTimeout(openTimer);
      window.removeEventListener("scroll", scrollHandler);
    };
  }, [artisanContext, isOpen, dismissedAutoOpen, location.pathname]);

  const handleAsk = useCallback(async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    // Pad very short questions so the backend doesn't reject them
    const safeQuestion = trimmed.length < 5 ? trimmed + " (détails)" : trimmed;

    setMessages(prev => [...prev, { role: "user", text: trimmed, time: getTime() }]);
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
          body: JSON.stringify({ question: safeQuestion, artisanContext: artisanContext || undefined }),
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
        setMessages(prev => [...prev, { role: "andrea", text: fullText, time: getTime() }]);
      } else {
        setMessages(prev => [...prev, { role: "andrea", text: "Désolé, je n'ai pas pu formuler de réponse. Réessayez.", time: getTime() }]);
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
      setTextInput(finalTranscript + interim);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim()) {
        handleAsk(finalTranscript.trim());
        setTextInput("");
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

  const handleOpen = () => { setIsOpen(true); setHasNewResponse(false); setShowPreviewBubble(false); };

  const handleClose = () => {
    setIsOpen(false);
    // Remember that user dismissed, so don't auto-open again
    if (artisanContext) {
      setDismissedAutoOpen(true);
      sessionStorage.setItem(`andrea_dismissed_${location.pathname}`, "1");
    }
  };

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
            className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-[9999] flex items-center gap-3"
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

            {/* Preview Bubble — contextual teaser on artisan pages */}
            <AnimatePresence>
              {showPreviewBubble && artisanContext && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-20 right-0 w-60 sm:w-72 px-4 py-3 rounded-2xl rounded-br-sm text-[13px] text-white/90 leading-snug cursor-pointer"
                  style={{
                    background: "hsla(222, 30%, 10%, 0.92)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: "1px solid hsla(45, 90%, 50%, 0.25)",
                    boxShadow: "0 8px 32px hsla(0, 0%, 0%, 0.4)",
                  }}
                  onClick={handleOpen}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <AndreaAvatar />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "hsl(45, 93%, 60%)" }}>Andrea</span>
                  </div>
                  <p>Je connais bien <strong>{artisanContext.business_name}</strong>, on en parle ? 👇</p>
                  {/* Little triangle pointer */}
                  <div className="absolute -bottom-2 right-6 w-4 h-4 rotate-45" style={{ background: "hsla(222, 30%, 10%, 0.92)", borderRight: "1px solid hsla(45, 90%, 50%, 0.25)", borderBottom: "1px solid hsla(45, 90%, 50%, 0.25)" }} />
                </motion.div>
              )}
            </AnimatePresence>

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
              {/* Gold pulse ring + ping effect on artisan pages */}
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
                transition={{ duration: artisanContext ? 1.5 : 3, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Ping ring on artisan pages */}
              {artisanContext && !dismissedAutoOpen && (
                <motion.span
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ border: "2px solid hsla(45, 93%, 55%, 0.6)" }}
                  animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}
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
            initial={{ opacity: 0, y: 80, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.95 }}
            transition={{ type: "spring", damping: 28, stiffness: 200, mass: 0.8 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[9999] w-full sm:w-[440px] sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
            style={{
              maxHeight: artisanContext 
                ? "min(540px, calc(var(--vh, 1vh) * 80))"  /* Mobile: 80% height on artisan pages so user sees the profile behind */
                : "min(640px, calc(var(--vh, 1vh) * 100 - 2rem))",
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
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider"
                    style={{ background: "hsla(142, 71%, 45%, 0.15)", color: "hsl(142, 71%, 55%)", border: "1px solid hsla(142, 71%, 45%, 0.25)" }}>
                    <ShieldCheck className="w-2.5 h-2.5" /> Vérifiée
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(142, 71%, 45%)" }} />
                  <span className="text-[10px] text-white/40 tracking-wide">{ANDREA_HEADER_SUBTITLE}</span>
                </div>
              </div>
              <button onClick={handleClose} className="text-white/30 hover:text-white transition-colors">
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
                    <p className="text-white text-[13px] leading-relaxed mb-3">
                      {artisanContext ? ANDREA_ARTISAN_CONTEXT(artisanContext.business_name, artisanContext.city, artisanContext.is_audited) : ANDREA_WELCOME}
                    </p>
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

              {/* Messages — WhatsApp style bubbles */}
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className={`${msg.role === "user" ? "self-end max-w-[85%]" : "self-start max-w-[90%]"}`}
                >
                  {msg.role === "andrea" ? (
                    <div
                      className="relative px-3.5 py-2.5 rounded-2xl rounded-tl-sm"
                      style={{
                        background: "hsla(220, 15%, 12%, 0.92)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid hsla(45, 90%, 50%, 0.15)",
                      }}
                    >
                      <p className="text-[10px] font-bold mb-1 flex items-center gap-1" style={{ color: "hsl(45, 93%, 60%)" }}>
                        <ShieldCheck className="h-3 w-3" /> Andrea
                      </p>
                      <p className="text-white text-[13px] leading-relaxed">{msg.text}</p>
                      <span className="flex justify-end mt-1">
                        <span className="text-[10px] text-white/30">{msg.time}</span>
                      </span>
                    </div>
                  ) : (
                    <div
                      className="relative px-3.5 py-2.5 rounded-2xl rounded-tr-sm"
                      style={{
                        background: "linear-gradient(135deg, hsl(160, 55%, 32%), hsl(165, 50%, 28%))",
                        boxShadow: "0 2px 8px hsla(160, 55%, 30%, 0.3)",
                      }}
                    >
                      <p className="text-white text-[13px] leading-relaxed">{msg.text}</p>
                      <span className="flex items-center gap-1 justify-end mt-1">
                        <span className="text-[10px] text-white/50">{msg.time}</span>
                        <CheckCheck className="h-3 w-3 text-sky-300" />
                      </span>
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
                      500+ audits/mois · Seuls les meilleurs passent
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
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, hsl(25, 95%, 53%), hsl(35, 90%, 50%))",
                        border: "1px solid hsla(30, 90%, 55%, 0.4)",
                        color: "#ffffff",
                        boxShadow: "0 0 16px hsla(30, 95%, 53%, 0.3)",
                      }}
                    >
                      <HardHat className="w-3.5 h-3.5" />
                      Je veux être validé
                    </button>
                    <button
                      onClick={() => {
                        updateLead({ lead_type: "particulier" });
                        handleAsk("Je cherche un artisan vérifié pour mon projet");
                      }}
                      disabled={isLoading}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      style={{
                        background: "linear-gradient(135deg, hsl(142, 60%, 38%), hsl(152, 55%, 42%))",
                        border: "1px solid hsla(142, 60%, 45%, 0.4)",
                        color: "#ffffff",
                        boxShadow: "0 0 14px hsla(142, 60%, 38%, 0.25)",
                      }}
                    >
                      <Home className="w-3.5 h-3.5" />
                      Je dépose mon projet
                    </button>
                  </div>
                  <p className="text-[9px] text-center mb-2 tracking-wide" style={{ color: "hsla(45, 80%, 65%, 0.55)" }}>
                    🛡️ 500+ audits mensuels · 70% des artisans refusés · Zéro commission
                  </p>
                </>
              )}
              <form onSubmit={handleTextSubmit} className="relative flex items-center gap-2">
                {/* Mic button */}
                <button
                  type="button"
                  onClick={toggleListening}
                  onTouchStart={(e) => { e.preventDefault(); toggleListening(); }}
                  disabled={isLoading}
                  className={`shrink-0 h-11 w-11 rounded-full flex items-center justify-center transition-all ${
                    isListening
                      ? "animate-pulse"
                      : ""
                  }`}
                  style={isListening ? {
                    background: "hsl(0, 72%, 51%)",
                    boxShadow: "0 0 20px hsla(0, 72%, 51%, 0.5)",
                    color: "#ffffff",
                  } : {
                    background: "hsla(0, 0%, 100%, 0.08)",
                    border: "1px solid hsla(45, 90%, 50%, 0.12)",
                    color: "hsla(0, 0%, 100%, 0.5)",
                  }}
                  aria-label={isListening ? "Arrêter" : "Dicter"}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isListening ? "🎙️ Parlez maintenant..." : "Votre message..."}
                  className="w-full h-11 rounded-full text-[13px] pl-4 pr-12 focus:outline-none transition-all placeholder:text-white/25"
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
                  className="absolute right-1.5 h-9 w-9 rounded-full shrink-0 text-white hover:scale-105 transition-transform"
                  style={{
                    background: "linear-gradient(145deg, hsl(45, 93%, 47%), hsl(35, 85%, 42%))",
                    boxShadow: "0 0 12px hsla(45, 93%, 47%, 0.25)",
                  }}
                  disabled={isLoading || !textInput.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {isListening && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-center font-medium mt-1"
                  style={{ color: "hsl(0, 72%, 60%)" }}
                >
                  🔴 Enregistrement… Le message s'enverra automatiquement.
                </motion.p>
              )}
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
