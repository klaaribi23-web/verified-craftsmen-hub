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
  const [isThinking, setIsThinking] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [callingIndicator, setCallingIndicator] = useState(false);
  const [audioCtxState, setAudioCtxState] = useState<string>("suspended");

  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const keepAliveRef = useRef<AudioBufferSourceNode | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpokenRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCommitSentRef = useRef(false);

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

  const clearAutoResetTimeout = useCallback(() => {
    if (autoResetTimeoutRef.current) {
      clearTimeout(autoResetTimeoutRef.current);
      autoResetTimeoutRef.current = null;
    }
  }, []);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // GainNode for 2.0x volume boost
  const ensureGainNode = useCallback((ctx: AudioContext): GainNode => {
    if (!gainNodeRef.current) {
      const gain = ctx.createGain();
      gain.gain.value = 2.0;
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;
    }
    return gainNodeRef.current;
  }, []);

  const trackAudioCtxState = useCallback((ctx: AudioContext) => {
    setAudioCtxState(ctx.state);
    ctx.onstatechange = () => {
      setAudioCtxState(ctx.state);
      console.log("[Andrea Voice] AudioContext state:", ctx.state);
    };
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      try { keepAliveRef.current.stop(); } catch {}
      keepAliveRef.current = null;
    }
  }, []);

  const startKeepAlive = useCallback((ctx: AudioContext) => {
    try {
      stopKeepAlive();
      const gain = ensureGainNode(ctx);
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.1), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() - 0.5) * 0.0005;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start(0);
      keepAliveRef.current = source;
    } catch (e) {
      console.warn("[Andrea Voice] Keep-alive failed:", e);
    }
  }, [ensureGainNode, stopKeepAlive]);

  // Auto-reset: if text received but no audio after 4s, soft reset session
  const startAutoResetTimer = useCallback(() => {
    clearAutoResetTimeout();
    autoResetTimeoutRef.current = setTimeout(async () => {
      if (!hasSpokenRef.current) {
        console.warn("[Andrea Voice] ⚠️ No audio after 4s, auto-resetting session...");
        setAudioBlocked(true);
        toast("🔄 Reconnexion automatique...", { duration: 2000 });
        // Soft reset: end and restart without page reload
        try { await conversation.endSession(); } catch {}
        // Will be restarted by the user or we just show text fallback
        setShowTextFallback(true);
      }
    }, 4000);
  }, [clearAutoResetTimeout]);

  // Force audio output: set attributes on all audio elements
  const forceAudioOutput = useCallback(() => {
    try {
      document.querySelectorAll("audio").forEach((el) => {
        el.volume = 1.0;
        el.muted = false;
        el.setAttribute("playsinline", "");
        el.setAttribute("webkit-playsinline", "");
        if ((el as any).setSinkId) (el as any).setSinkId("default").catch(() => {});
        if (el.paused && el.src) el.play().catch(() => {});
      });

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLAudioElement) {
              node.volume = 1.0;
              node.muted = false;
              node.setAttribute("playsinline", "");
              node.setAttribute("webkit-playsinline", "");
              if (node.paused && node.src) node.play().catch(() => {});
            }
            if (node instanceof HTMLElement) {
              node.querySelectorAll?.("audio")?.forEach((a) => {
                a.volume = 1.0;
                a.muted = false;
                a.setAttribute("playsinline", "");
                if (a.paused && a.src) a.play().catch(() => {});
              });
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 60000);
    } catch (e) {
      console.warn("[Andrea Voice] forceAudioOutput error:", e);
    }
  }, []);

  const startResponseTimeout = useCallback(() => {
    clearResponseTimeout();
    responseTimeoutRef.current = setTimeout(() => {
      if (!hasSpokenRef.current) {
        setShowTextFallback(true);
      }
    }, 4000);
  }, [clearResponseTimeout]);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[Andrea Voice] ✅ Connected via WebRTC");
      setError(null);
      setAudioBlocked(false);
      setCallingIndicator(false);
      autoCommitSentRef.current = false;
      toast.success("Connexion établie ✅", { duration: 3000 });

      setTimeout(() => {
        startMicMonitorFromNewStream();
        forceAudioOutput();
        try { conversation.setVolume({ volume: 1.0 }); } catch {}
      }, 500);
    },
    onDisconnect: () => {
      console.log("[Andrea Voice] ⚠️ Disconnected");
      setMicActive(false);
      setMicLevel(0);
      setCallingIndicator(false);
      clearSilenceTimer();
      stopMicMonitor();
      stopKeepAlive();
      clearResponseTimeout();
      clearAutoResetTimeout();
    },
    onMessage: (message: any) => {
      const raw = JSON.stringify(message);
      console.log("[Andrea Voice] Message:", raw.slice(0, 300));

      if (message?.source === "ai" || message?.role === "agent") {
        const text = message?.message || message?.agent_response_event?.agent_response || message?.text;
        if (text) {
          const cleanText = typeof text === "string" ? text.replace(/^"|"$/g, "") : String(text);
          setLastAgentText(cleanText);
          setShowTextFallback(true);
          setIsThinking(false);
          hasSpokenRef.current = false;
          startResponseTimeout();
          startAutoResetTimer();
          try { conversation.setVolume({ volume: 1.0 }); } catch {}
          forceAudioOutput();
        }
      }

      if (message?.type === "user_transcript" || (message?.source === "user" && message?.role === "user")) {
        setIsThinking(true);
        autoCommitSentRef.current = false;
      }

      if (/quota/i.test(raw) || /exceeded/i.test(raw)) {
        toast.error("⚠️ Crédits ElevenLabs épuisés", { duration: 8000 });
        setError("Quota exceeded");
      }
      if (/api.key/i.test(raw) || /unauthorized/i.test(raw) || /invalid.*key/i.test(raw)) {
        toast.error("⚠️ Erreur clé API ElevenLabs", { duration: 8000 });
        setError("API Key error");
      }
    },
    onError: (error: any) => {
      const errStr = String(error?.message || error);
      console.error("[Andrea Voice] ❌ Error:", errStr);
      setError(errStr);
      setCallingIndicator(false);
      if (/quota/i.test(errStr) || /exceeded/i.test(errStr)) {
        toast.error("⚠️ Crédits ElevenLabs épuisés", { duration: 8000 });
      } else if (/key/i.test(errStr) || /unauthorized/i.test(errStr)) {
        toast.error("⚠️ Erreur clé API ElevenLabs", { duration: 8000 });
      } else {
        toast.error(`Erreur: ${errStr.slice(0, 80)}`, { duration: 5000 });
      }
    },
  });

  // Auto-trigger after silence
  const triggerAutoCommit = useCallback(() => {
    if (conversation.status === "connected" && !autoCommitSentRef.current && !conversation.isSpeaking) {
      autoCommitSentRef.current = true;
      console.log("[Andrea Voice] 🤖 Auto-commit: silence >1.5s");
      try {
        conversation.sendUserMessage("...");
        setIsThinking(true);
      } catch (e) {
        console.error("[Andrea Voice] Auto-commit failed:", e);
      }
    }
  }, [conversation]);

  const startMicMonitorFromNewStream = useCallback(async () => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
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
      let wasActive = false;
      let frameCount = 0;

      const check = () => {
        analyser.getByteFrequencyData(dataArray);
        let max = 0;
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > max) max = dataArray[i];
        }
        frameCount++;
        if (frameCount % 3 === 0) setMicLevel(max / 255);

        if (max > 1) {
          setMicActive(true);
          wasActive = true;
          silentFrames = 0;
          autoCommitSentRef.current = false;
          clearSilenceTimer();
        } else {
          silentFrames++;
          if (silentFrames > 90 && wasActive && !autoCommitSentRef.current) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                triggerAutoCommit();
                silenceTimerRef.current = null;
              }, 200);
            }
          }
          if (silentFrames > 300) {
            setMicActive(false);
            wasActive = false;
          }
        }
        rafRef.current = requestAnimationFrame(check);
      };
      check();
      console.log("[Andrea Voice] ✅ Mic monitor started");
    } catch (e) {
      console.warn("[Andrea Voice] Mic monitor error:", e);
    }
  }, [clearSilenceTimer, triggerAutoCommit]);

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
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  useEffect(() => {
    return () => {
      stopMicMonitor();
      stopKeepAlive();
      clearResponseTimeout();
      clearSilenceTimer();
      clearAutoResetTimeout();
    };
  }, [stopMicMonitor, stopKeepAlive, clearResponseTimeout, clearSilenceTimer, clearAutoResetTimeout]);

  // Track when agent starts speaking → audio is working
  useEffect(() => {
    if (conversation.isSpeaking) {
      hasSpokenRef.current = true;
      setAudioBlocked(false);
      setIsThinking(false);
      clearResponseTimeout();
      clearAutoResetTimeout();
      forceAudioOutput();
      try { conversation.setVolume({ volume: 1.0 }); } catch {}
    }
  }, [conversation.isSpeaking, clearResponseTimeout, clearAutoResetTimeout, forceAudioOutput, conversation]);

  // Detect audio blocked (text but no speech after 4s)
  useEffect(() => {
    if (showTextFallback && lastAgentText && !conversation.isSpeaking && !hasSpokenRef.current) {
      setAudioBlocked(true);
    }
  }, [showTextFallback, lastAgentText, conversation.isSpeaking]);

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

  // Hard reset
  const hardReset = useCallback(async () => {
    console.log("[Andrea Voice] 💥 Hard reset");
    try { await conversation.endSession(); } catch {}
    stopMicMonitor();
    stopKeepAlive();
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    gainNodeRef.current = null;
    document.querySelectorAll("audio").forEach((el) => {
      el.pause(); el.src = ""; el.remove();
    });
    clearResponseTimeout();
    clearSilenceTimer();
    clearAutoResetTimeout();
    setMicActive(false);
    setMicLevel(0);
    setLastAgentText(null);
    setShowTextFallback(false);
    setIsThinking(false);
    setAudioBlocked(false);
    setCallingIndicator(false);
    setError(null);
    autoCommitSentRef.current = false;
    toast.success("Session réinitialisée 🔄", { duration: 2000 });
  }, [conversation, stopMicMonitor, stopKeepAlive, clearResponseTimeout, clearSilenceTimer, clearAutoResetTimeout]);

  // Unified start: hardware wake + audio unlock + WebRTC session
  const startConversation = useCallback(async () => {
    if (conversation.status === "connected") {
      try { await conversation.endSession(); } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }

    setIsConnecting(true);
    setCallingIndicator(true);
    setError(null);
    setMicActive(false);
    setMicLevel(0);
    setLastAgentText(null);
    setShowTextFallback(false);
    setAudioBlocked(false);
    autoCommitSentRef.current = false;
    stopMicMonitor();
    stopKeepAlive();

    try {
      // 1. Hardware wake: getUserMedia forces speaker activation on mobile
      const hwStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
      // Keep stream alive briefly to force hardware wake, then stop
      setTimeout(() => hwStream.getTracks().forEach((t) => t.stop()), 2000);

      // 2. Create AudioContext + GainNode in user gesture
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      trackAudioCtxState(audioCtx);
      if (audioCtx.state === "suspended") await audioCtx.resume();
      ensureGainNode(audioCtx);

      // 3. Silent buffer through gain to unlock speakers
      const buffer = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * 0.1), audioCtx.sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) channelData[i] = (Math.random() - 0.5) * 0.001;
      const silentSource = audioCtx.createBufferSource();
      silentSource.buffer = buffer;
      silentSource.connect(gainNodeRef.current!);
      silentSource.start(0);

      // 4. Start keep-alive
      startKeepAlive(audioCtx);

      console.log("[Andrea Voice] AudioContext unlocked + hardware wake, state:", audioCtx.state);

      // 5. Get WebRTC conversation token
      const { data, error: fnError } = await supabase.functions.invoke("elevenlabs-conversation-token");
      if (fnError) throw new Error(`Token error: ${fnError.message}`);
      if (!data?.token) throw new Error("Pas de token WebRTC reçu.");

      console.log("[Andrea Voice] ✅ WebRTC token obtained, starting session...");

      // 6. Start WebRTC session
      await conversation.startSession({
        conversationToken: data.token,
        connectionType: "webrtc",
        overrides: {
          agent: {
            language: "fr",
          },
        },
      });

      console.log("[Andrea Voice] ✅ WebRTC session started");
    } catch (err: any) {
      console.error("[Andrea Voice] ❌ Failed to start:", err);
      const msg = err?.message || "Erreur inconnue";
      setError(msg);
      setCallingIndicator(false);
      stopMicMonitor();
      stopKeepAlive();

      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setMicPermission("denied");
        toast.error("Micro bloqué. Autorisez l'accès au microphone.", { duration: 5000 });
      } else {
        toast.error("Erreur de connexion ❌");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, stopMicMonitor, stopKeepAlive, startKeepAlive, ensureGainNode, trackAudioCtxState]);

  const stopConversation = useCallback(async () => {
    stopMicMonitor();
    stopKeepAlive();
    clearResponseTimeout();
    clearSilenceTimer();
    clearAutoResetTimeout();
    setCallingIndicator(false);
    if (lastAgentText) setShowTextFallback(true);
    try { await conversation.endSession(); } catch {}
  }, [conversation, stopMicMonitor, stopKeepAlive, clearResponseTimeout, clearSilenceTimer, clearAutoResetTimeout, lastAgentText]);

  return {
    startConversation,
    stopConversation,
    hardReset,
    isConnecting,
    isConnected: conversation.status === "connected",
    isSpeaking: conversation.isSpeaking,
    isThinking,
    micActive,
    micLevel,
    micPermission,
    requestMicPermission,
    status: conversation.status,
    error,
    lastAgentText,
    showTextFallback,
    audioBlocked,
    audioCtxState,
    callingIndicator,
  };
};
