import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MicPermission = "granted" | "denied" | "prompt" | "unknown";

// Global audio warmup — runs once on first user interaction anywhere
let audioWarmedUp = false;
const warmupAudio = () => {
  if (audioWarmedUp) return;
  audioWarmedUp = true;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.25), ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    src.onended = () => ctx.close().catch(() => {});
    console.log("[Andrea Voice] 🔊 Audio warmup done");
  } catch (e) {
    console.warn("[Andrea Voice] Warmup failed:", e);
  }
};

if (typeof window !== "undefined") {
  const handler = () => {
    warmupAudio();
    document.removeEventListener("click", handler, true);
    document.removeEventListener("touchstart", handler, true);
  };
  document.addEventListener("click", handler, true);
  document.addEventListener("touchstart", handler, true);
}

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
  const [micStatus, setMicStatus] = useState<string | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const keepAliveRef = useRef<AudioBufferSourceNode | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasSpokenRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoCommitSentRef = useRef(false);

  // useConversation MUST be called here — same position every render
  const conversation = useConversation({
    onConnect: () => {
      console.log("[Andrea Voice] ✅ Connected");
      setError(null);
      setAudioBlocked(false);
      setCallingIndicator(false);
      autoCommitSentRef.current = false;
    },
    onDisconnect: () => {
      console.log("[Andrea Voice] Disconnected");
      setMicActive(false);
      setMicLevel(0);
      setCallingIndicator(false);
      setMicStatus(null);
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
          // Force audio output on every agent message
          setTimeout(() => forceAudioOutputSafe(), 100);
          hasSpokenRef.current = false;
          clearResponseTimeoutSafe();
          startResponseTimeoutSafe();
          forceAudioOutputSafe();
        }
      }

      if (message?.type === "user_transcript" || (message?.source === "user" && message?.role === "user")) {
        setIsThinking(true);
        autoCommitSentRef.current = false;
      }
    },
    onError: (error: any) => {
      const errStr = String(error?.message || error);
      console.error("[Andrea Voice] ❌ Error:", errStr);
      setError(errStr);
      setCallingIndicator(false);
    },
  });

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

  // Force volume 100% on all audio elements
  useEffect(() => {
    const forceAllVolume = () => {
      document.querySelectorAll("audio, video").forEach((el) => {
        (el as HTMLMediaElement).volume = 1.0;
        (el as HTMLMediaElement).muted = false;
      });
    };
    forceAllVolume();
    const observer = new MutationObserver(() => forceAllVolume());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  // Safe helper functions (no deps on conversation to avoid hook issues)
  const clearResponseTimeoutSafe = () => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  };

  const startResponseTimeoutSafe = () => {
    responseTimeoutRef.current = setTimeout(() => {
      if (!hasSpokenRef.current) {
        setShowTextFallback(true);
        setAudioBlocked(true);
      }
    }, 4000);
  };

  const forceAudioOutputSafe = () => {
    document.querySelectorAll("audio").forEach((el) => {
      el.volume = 1.0;
      el.muted = false;
      el.setAttribute("playsinline", "");
      if (el.paused && el.src) el.play().catch(() => {});
    });
  };

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
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
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.1), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() - 0.5) * 0.0005;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(ctx.destination);
      source.start(0);
      keepAliveRef.current = source;
    } catch (e) {
      console.warn("[Andrea Voice] Keep-alive failed:", e);
    }
  }, [stopKeepAlive]);

  const stopMicMonitor = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    setMicLevel(0);
    setMicStatus(null);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    clearSilenceTimer();
  }, [clearSilenceTimer]);

  // Auto-trigger after silence
  const triggerAutoCommit = useCallback(() => {
    if (conversation.status === "connected" && !autoCommitSentRef.current && !conversation.isSpeaking) {
      autoCommitSentRef.current = true;
      try {
        conversation.sendUserMessage("...");
        setIsThinking(true);
      } catch {}
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
          setMicStatus("Je t'écoute... 🎤");
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
          if (silentFrames > 60) setMicStatus(null);
          if (silentFrames > 300) { setMicActive(false); wasActive = false; }
        }
        rafRef.current = requestAnimationFrame(check);
      };
      check();
      console.log("[Andrea Voice] ✅ Mic monitor started");
    } catch (e) {
      console.warn("[Andrea Voice] Mic monitor error:", e);
    }
  }, [clearSilenceTimer, triggerAutoCommit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicMonitor();
      stopKeepAlive();
      clearResponseTimeoutSafe();
      clearSilenceTimer();
    };
  }, [stopMicMonitor, stopKeepAlive, clearSilenceTimer]);

  // Track when agent speaks → audio works
  useEffect(() => {
    if (conversation.isSpeaking) {
      hasSpokenRef.current = true;
      setAudioBlocked(false);
      setIsThinking(false);
      clearResponseTimeoutSafe();
      forceAudioOutputSafe();
      try { conversation.setVolume({ volume: 1.0 }); } catch {}
    }
  }, [conversation.isSpeaking, conversation]);

  // onConnect side-effect: start mic monitor after connection
  useEffect(() => {
    if (conversation.status === "connected") {
      const timer = setTimeout(() => {
        startMicMonitorFromNewStream();
        forceAudioOutputSafe();
        try { conversation.setVolume({ volume: 1.0 }); } catch {}
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [conversation.status, startMicMonitorFromNewStream, conversation]);

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

  // Soft reset — just end session, no destruction
  const hardReset = useCallback(async () => {
    console.log("[Andrea Voice] 🔄 Soft reset");
    stopMicMonitor();
    stopKeepAlive();
    clearResponseTimeoutSafe();
    clearSilenceTimer();
    try { await conversation.endSession(); } catch {}
    setMicActive(false);
    setMicLevel(0);
    setLastAgentText(null);
    setShowTextFallback(false);
    setIsThinking(false);
    setAudioBlocked(false);
    setCallingIndicator(false);
    setMicStatus(null);
    setError(null);
    autoCommitSentRef.current = false;
  }, [conversation, stopMicMonitor, stopKeepAlive, clearSilenceTimer]);

  // Stop conversation — gentle approach, no AudioContext destruction
  const stopConversation = useCallback(async () => {
    console.log("[Andrea Voice] ⏹️ Stopping...");
    stopMicMonitor();
    stopKeepAlive();
    clearResponseTimeoutSafe();
    clearSilenceTimer();
    setCallingIndicator(false);
    setMicStatus(null);
    if (lastAgentText) setShowTextFallback(true);
    try { await conversation.endSession(); } catch (err) {
      console.warn("[Andrea Voice] endSession error (ignored):", err);
    }
    setMicActive(false);
    setMicLevel(0);
    setIsThinking(false);
  }, [conversation, stopMicMonitor, stopKeepAlive, clearSilenceTimer, lastAgentText]);

  // Start conversation
  const startConversation = useCallback(async () => {
    if (conversation.status === "connected") {
      try { await conversation.endSession(); } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }

    warmupAudio();

    setIsConnecting(true);
    setCallingIndicator(true);
    setError(null);
    setMicActive(false);
    setMicLevel(0);
    setLastAgentText(null);
    setShowTextFallback(false);
    setAudioBlocked(false);
    setMicStatus(null);
    autoCommitSentRef.current = false;
    stopMicMonitor();
    stopKeepAlive();

    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }

    try {
      // Double mic trigger for Safari stability
      const stream1 = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream1.getTracks().forEach((t) => t.stop());
      const stream2 = await navigator.mediaDevices.getUserMedia({ audio: true });
      setTimeout(() => stream2.getTracks().forEach((t) => t.stop()), 2000);
      setMicPermission("granted");

      // Fresh AudioContext
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") await audioCtx.resume();

      // Silent buffer to unlock speakers
      const buffer = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * 0.1), audioCtx.sampleRate);
      const ch = buffer.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() - 0.5) * 0.001;
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      src.connect(audioCtx.destination);
      src.start(0);

      startKeepAlive(audioCtx);

      console.log("[Andrea Voice] Audio unlocked, state:", audioCtx.state);

      // Get signed URL
      const { data, error: fnError } = await supabase.functions.invoke("elevenlabs-conversation-token");
      if (fnError) throw new Error(`Token error: ${fnError.message}`);
      if (!data?.signed_url) throw new Error("Pas de signed_url reçue.");

      console.log("[Andrea Voice] ✅ Signed URL obtained");

      await conversation.startSession({
        signedUrl: data.signed_url,
        overrides: { agent: { language: "fr" } },
      });

      console.log("[Andrea Voice] ✅ Session started");
    } catch (err: any) {
      console.error("[Andrea Voice] ❌ Failed:", err);
      setError(err?.message || "Erreur inconnue");
      setCallingIndicator(false);
      stopMicMonitor();
      stopKeepAlive();

      if (String(err?.message).includes("Permission") || String(err?.message).includes("NotAllowed")) {
        setMicPermission("denied");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, stopMicMonitor, stopKeepAlive, startKeepAlive]);

  const sendTextMessage = useCallback((text: string) => {
    if (conversation.status === "connected" && text.trim()) {
      try {
        conversation.sendUserMessage(text.trim());
        setIsThinking(true);
      } catch (e) {
        console.warn("[Andrea Voice] sendUserMessage failed:", e);
      }
    }
  }, [conversation]);

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
    error,
    lastAgentText,
    showTextFallback,
    audioBlocked,
    callingIndicator,
    micStatus,
    sendTextMessage,
  };
};
