import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MicPermission = "granted" | "denied" | "prompt" | "unknown";

export const useAndreaVoiceAgent = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");
  const [micLevel, setMicLevel] = useState(0);
  const [lastAgentText, setLastAgentText] = useState<string | null>(null);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpokenRef = useRef(false);

  // Check mic permission on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        if (navigator.permissions?.query) {
          const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
          setMicPermission(result.state as MicPermission);
          result.onchange = () => setMicPermission(result.state as MicPermission);
        }
      } catch {
        setMicPermission("unknown");
      }
    };
    checkPermission();
  }, []);

  const clearResponseTimeout = useCallback(() => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  }, []);

  const startResponseTimeout = useCallback(() => {
    clearResponseTimeout();
    responseTimeoutRef.current = setTimeout(() => {
      // If agent hasn't started speaking after 4s, show text fallback
      if (!hasSpokenRef.current) {
        console.warn("[Andrea Voice] ⚠️ No audio response after 4s, showing text fallback");
        setShowTextFallback(true);
      }
    }, 4000);
  }, [clearResponseTimeout]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[Andrea Voice] ✅ Connected to ElevenLabs agent");
      setError(null);
      toast.success("Connexion ElevenLabs établie ✅", { duration: 3000 });

      // Start mic monitor AFTER SDK has connected (avoid mic conflict)
      setTimeout(() => {
        startMicMonitorFromNewStream();
        forceAudioOutput();
      }, 500);
    },
    onDisconnect: () => {
      console.log("[Andrea Voice] ⚠️ Disconnected from agent");
      setMicActive(false);
      setMicLevel(0);
      setShowTextFallback(false);
      setLastAgentText(null);
      stopMicMonitor();
      clearResponseTimeout();
      toast("Andrea déconnectée", { duration: 3000 });
    },
    onMessage: (message: any) => {
      console.log("[Andrea Voice] Message:", JSON.stringify(message));
      const msgStr = typeof message === "string" ? message : JSON.stringify(message);

      // Capture agent text responses for fallback display
      if (message?.source === "ai" || message?.role === "agent") {
        const text = message?.message || message?.agent_response_event?.agent_response || message?.text;
        if (text) {
          // Clean quotes from the text
          const cleanText = typeof text === "string" ? text.replace(/^"|"$/g, "") : String(text);
          setLastAgentText(cleanText);
          console.log("[Andrea Voice] 💬 Agent text:", cleanText);
          // Start timeout: if no audio plays within 4s, show text
          hasSpokenRef.current = false;
          startResponseTimeout();
        }
      }

      // Surface quota/API errors as toasts
      if (/quota/i.test(msgStr) || /exceeded/i.test(msgStr)) {
        toast.error("⚠️ Crédits ElevenLabs épuisés (Quota Exceeded)", { duration: 8000 });
        setError("Quota exceeded");
      }
      if (/api.key/i.test(msgStr) || /unauthorized/i.test(msgStr) || /invalid.*key/i.test(msgStr)) {
        toast.error("⚠️ Erreur clé API ElevenLabs", { duration: 8000 });
        setError("API Key error");
      }
    },
    onError: (error: any) => {
      const errStr = String(error?.message || error);
      console.error("[Andrea Voice] ❌ Agent error:", errStr);
      setError(errStr);
      if (/quota/i.test(errStr) || /exceeded/i.test(errStr)) {
        toast.error("⚠️ Crédits ElevenLabs épuisés", { duration: 8000 });
      } else if (/key/i.test(errStr) || /unauthorized/i.test(errStr)) {
        toast.error("⚠️ Erreur clé API ElevenLabs", { duration: 8000 });
      } else {
        toast.error(`Erreur ElevenLabs: ${errStr.slice(0, 80)}`, { duration: 5000 });
      }
    },
  });

  // Force audio output to default device
  const forceAudioOutput = useCallback(() => {
    try {
      const audioElements = document.querySelectorAll("audio");
      audioElements.forEach((el) => {
        el.volume = 1.0;
        el.muted = false;
        if ((el as any).setSinkId) {
          (el as any).setSinkId("default").catch(() => {});
        }
      });
      console.log("[Andrea Voice] 🔊 Audio output forced, found", audioElements.length, "audio elements");

      // Also observe for new audio elements added by the SDK
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLAudioElement) {
              node.volume = 1.0;
              node.muted = false;
              if ((node as any).setSinkId) {
                (node as any).setSinkId("default").catch(() => {});
              }
              console.log("[Andrea Voice] 🔊 New audio element detected and configured");
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      // Stop observing after 30s
      setTimeout(() => observer.disconnect(), 30000);
    } catch (e) {
      console.warn("[Andrea Voice] setSinkId not supported:", e);
    }
  }, []);

  // Start mic monitor from a NEW stream (separate from SDK's stream)
  const startMicMonitorFromNewStream = useCallback(async () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      micStreamRef.current = stream;
      setMicPermission("granted");

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silentFrames = 0;
      let frameCount = 0;

      const check = () => {
        analyser.getByteFrequencyData(dataArray);
        let max = 0;
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > max) max = dataArray[i];
        }
        const normalizedLevel = max / 255;
        frameCount++;
        if (frameCount % 3 === 0) setMicLevel(normalizedLevel);

        if (max > 1) {
          setMicActive(true);
          silentFrames = 0;
        } else {
          silentFrames++;
          if (silentFrames > 300) setMicActive(false);
        }
        rafRef.current = requestAnimationFrame(check);
      };
      check();
      console.log("[Andrea Voice] ✅ Mic monitor started (post-connect)");
    } catch (e) {
      console.warn("[Andrea Voice] Mic monitor error:", e);
    }
  }, []);

  const stopMicMonitor = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    setMicLevel(0);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMicMonitor();
      clearResponseTimeout();
    };
  }, [stopMicMonitor, clearResponseTimeout]);

  // Track when agent starts speaking to cancel text fallback
  useEffect(() => {
    if (conversation.isSpeaking) {
      hasSpokenRef.current = true;
      setShowTextFallback(false);
      clearResponseTimeout();
    }
  }, [conversation.isSpeaking, clearResponseTimeout]);

  const requestMicPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
      toast.success("Micro activé ✅");
    } catch {
      setMicPermission("denied");
      toast.error("Micro bloqué. Autorisez l'accès dans les paramètres.", { duration: 5000 });
    }
  }, []);

  const resetMic = useCallback(async () => {
    console.log("[Andrea Voice] 🔄 Resetting microphone...");
    stopMicMonitor();
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    await startMicMonitorFromNewStream();
    toast.success("Micro réinitialisé ✅");
  }, [stopMicMonitor, startMicMonitorFromNewStream]);

  const startConversation = useCallback(async () => {
    // End existing session first
    if (conversation.status === "connected") {
      console.log("[Andrea Voice] Ending existing session before restart");
      try { await conversation.endSession(); } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }

    setIsConnecting(true);
    setError(null);
    setMicActive(false);
    setMicLevel(0);
    setLastAgentText(null);
    setShowTextFallback(false);
    stopMicMonitor();

    try {
      // 1. Force AudioContext activation (mobile audio unlock)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") await audioCtx.resume();
      // Play silent buffer to unlock audio output on iOS/Android
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const silentSource = audioCtx.createBufferSource();
      silentSource.buffer = buffer;
      silentSource.connect(audioCtx.destination);
      silentSource.start(0);
      console.log("[Andrea Voice] AudioContext state:", audioCtx.state);

      // 2. Get signed URL FIRST (don't grab mic yet — let SDK do it)
      console.log("[Andrea Voice] Fetching signed URL...");
      const { data, error: fnError } = await supabase.functions.invoke("elevenlabs-conversation-token");

      if (fnError) {
        console.error("[Andrea Voice] ❌ Edge function error:", fnError);
        throw new Error(`Token error: ${fnError.message}`);
      }
      if (!data?.signed_url) {
        console.error("[Andrea Voice] ❌ No signed_url received. Response:", data);
        throw new Error("Pas de signed_url reçue.");
      }

      console.log("[Andrea Voice] ✅ Signed URL obtained, starting session...");

      // 3. Start conversation — SDK handles mic internally
      await conversation.startSession({
        signedUrl: data.signed_url,
        overrides: {
          agent: {
            language: "fr",
          },
        },
      });

      console.log("[Andrea Voice] ✅ Session started successfully");
      // Mic monitor + audio output fix happen in onConnect callback
    } catch (err: any) {
      console.error("[Andrea Voice] ❌ Failed to start conversation:", err);
      const msg = err?.message || "Erreur inconnue";
      setError(msg);
      stopMicMonitor();

      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setMicPermission("denied");
        toast.error("Micro bloqué. Autorisez l'accès au microphone.", { duration: 5000 });
      } else {
        toast.error("Erreur de connexion ElevenLabs ❌");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, stopMicMonitor]);

  const endConversation = useCallback(async () => {
    stopMicMonitor();
    clearResponseTimeout();
    setLastAgentText(null);
    setShowTextFallback(false);
    try { await conversation.endSession(); } catch {}
  }, [conversation, stopMicMonitor, clearResponseTimeout]);

  return {
    startConversation,
    endConversation,
    resetMic,
    isConnecting,
    isConnected: conversation.status === "connected",
    isSpeaking: conversation.isSpeaking,
    micActive,
    micLevel,
    micPermission,
    requestMicPermission,
    status: conversation.status,
    error,
    lastAgentText,
    showTextFallback,
  };
};
