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
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

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
      setIsGeneratingAudio(false);
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
          setIsGeneratingAudio(true); // Agent text received → audio being generated
          hasSpokenRef.current = false;
          clearResponseTimeoutSafe();
          startResponseTimeoutSafe();
        }
      }

      // Agent response event (typed)
      if (message?.type === "agent_response") {
        const text = message?.agent_response_event?.agent_response;
        if (text) {
          setLastAgentText(text);
          setShowTextFallback(true);
          setIsThinking(false);
          setIsGeneratingAudio(true);
        }
      }

      if (message?.type === "user_transcript" || (message?.source === "user" && message?.role === "user")) {
        setIsThinking(true);
        setIsGeneratingAudio(false);
        autoCommitSentRef.current = false;
      }
    },
    onError: (error: any) => {
      const errStr = String(error?.message || error);
      console.error("[Andrea Voice] ❌ Error:", errStr);
      setError(errStr);
      setCallingIndicator(false);
      setIsGeneratingAudio(false);
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

  // Force volume 100% on all audio elements + detect stuck audio
  useEffect(() => {
    const forceAllVolume = () => {
      document.querySelectorAll("audio, video").forEach((el) => {
        const media = el as HTMLMediaElement;
        media.volume = 1.0;
        media.muted = false;
        // Force play if paused and has data (browser blocked autoplay)
        if (media.paused && media.readyState >= 2 && media.src) {
          media.play().catch(() => {
            console.warn("[Andrea Voice] Browser blocked audio autoplay");
            setAudioBlocked(true);
          });
        }
      });
    };
    forceAllVolume();
    const interval = setInterval(forceAllVolume, 500);
    const observer = new MutationObserver(() => forceAllVolume());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, []);

  // Safe helper functions
  const clearResponseTimeoutSafe = () => {
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
      responseTimeoutRef.current = null;
    }
  };

  const startResponseTimeoutSafe = () => {
    responseTimeoutRef.current = setTimeout(() => {
      if (!hasSpokenRef.current) {
        console.warn("[Andrea Voice] ⚠️ Audio timeout — no sound detected after 8s");
        setShowTextFallback(true);
        setAudioBlocked(true);
        setIsGeneratingAudio(false);
        // Try to force-play any existing audio elements one last time
        document.querySelectorAll("audio").forEach((el) => {
          const media = el as HTMLMediaElement;
          if (media.paused && media.src) {
            media.play().catch(() => {});
          }
        });
      }
    }, 10000); // 10s timeout for WebRTC audio setup
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
      // Higher threshold to ignore background noise on mobile (was 1)
      const VOICE_THRESHOLD = 25;
      // Silence frames before auto-commit (~1.5s at 60fps)
      const SILENCE_COMMIT_FRAMES = 90;
      // Silence frames before mic deactivates (~2.5s)
      const SILENCE_DEACTIVATE_FRAMES = 150;

      const check = () => {
        analyser.getByteFrequencyData(dataArray);
        // Use RMS instead of max for more stable voice detection
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / dataArray.length);
        frameCount++;
        if (frameCount % 3 === 0) setMicLevel(Math.min(1, rms / 128));

        if (rms > VOICE_THRESHOLD) {
          setMicActive(true);
          setMicStatus("Je t'écoute... 🎤");
          wasActive = true;
          silentFrames = 0;
          autoCommitSentRef.current = false;
          clearSilenceTimer();
        } else {
          silentFrames++;
          if (silentFrames > SILENCE_COMMIT_FRAMES && wasActive && !autoCommitSentRef.current) {
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                triggerAutoCommit();
                silenceTimerRef.current = null;
              }, 300);
            }
          }
          if (silentFrames > 60) setMicStatus(null);
          if (silentFrames > SILENCE_DEACTIVATE_FRAMES) { setMicActive(false); wasActive = false; }
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
      setIsGeneratingAudio(false);
      clearResponseTimeoutSafe();
      // Force max volume on SDK + all audio elements
      try { conversation.setVolume({ volume: 1.0 }); } catch {}
      document.querySelectorAll("audio, video").forEach((el) => {
        (el as HTMLMediaElement).volume = 1.0;
        (el as HTMLMediaElement).muted = false;
      });
    }
  }, [conversation.isSpeaking, conversation]);

  // Detect stuck "generating" state — if isGeneratingAudio stays true for 10s without isSpeaking, force fallback
  useEffect(() => {
    if (isGeneratingAudio && !conversation.isSpeaking) {
      const stuckTimer = setTimeout(() => {
        if (isGeneratingAudio && !conversation.isSpeaking) {
          console.warn("[Andrea Voice] ⚠️ Stuck in generating state — forcing text fallback");
          setIsGeneratingAudio(false);
          setShowTextFallback(true);
          setAudioBlocked(true);
          // Last-chance: force-play any audio elements and re-unlock audio context
          document.querySelectorAll("audio").forEach((el) => {
            const media = el as HTMLMediaElement;
            media.volume = 1.0;
            media.muted = false;
            if (media.paused && media.src) media.play().catch(() => {});
          });
        }
      }, 12000); // 12s watchdog (longer than 10s response timeout)
      return () => clearTimeout(stuckTimer);
    }
  }, [isGeneratingAudio, conversation.isSpeaking]);

  // onConnect side-effect: start mic monitor after connection
  useEffect(() => {
    if (conversation.status === "connected") {
      const timer = setTimeout(() => {
        startMicMonitorFromNewStream();
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

  // Soft reset
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
    setIsGeneratingAudio(false);
    autoCommitSentRef.current = false;
  }, [conversation, stopMicMonitor, stopKeepAlive, clearSilenceTimer]);

  // Stop conversation — force Andrea to respond with what she heard
  const stopConversation = useCallback(async () => {
    console.log("[Andrea Voice] ⏹️ Stopping — forcing final response...");
    stopMicMonitor();
    stopKeepAlive();
    clearResponseTimeoutSafe();
    clearSilenceTimer();
    setCallingIndicator(false);
    setMicStatus(null);
    setIsGeneratingAudio(false);

    // Force a commit so Andrea responds with whatever she heard
    if (conversation.status === "connected" && !autoCommitSentRef.current) {
      try {
        conversation.sendUserMessage("...");
        autoCommitSentRef.current = true;
        setIsThinking(true);
        // Give Andrea time to respond before ending
        await new Promise((r) => setTimeout(r, 3000));
      } catch {}
    }

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
    setIsGeneratingAudio(false);
    autoCommitSentRef.current = false;
    stopMicMonitor();
    stopKeepAlive();

    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }

    try {
      // Request mic permission (double trigger for Safari)
      const stream1 = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream1.getTracks().forEach((t) => t.stop());
      const stream2 = await navigator.mediaDevices.getUserMedia({ audio: true });
      setTimeout(() => stream2.getTracks().forEach((t) => t.stop()), 2000);
      setMicPermission("granted");

      // Fresh AudioContext to unlock audio playback on mobile
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") await audioCtx.resume();

      // Audible micro-beep to force-unlock speakers (browser auto-play policy)
      const buffer = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * 0.15), audioCtx.sampleRate);
      const ch = buffer.getChannelData(0);
      // Short 440Hz tone at low volume — just enough to unlock audio pipeline
      for (let i = 0; i < ch.length; i++) {
        ch[i] = Math.sin(2 * Math.PI * 440 * i / audioCtx.sampleRate) * 0.02;
      }
      const src = audioCtx.createBufferSource();
      src.buffer = buffer;
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = 0.05; // Very low volume unlock beep
      src.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      src.start(0);

      startKeepAlive(audioCtx);

      console.log("[Andrea Voice] Audio unlocked with beep, state:", audioCtx.state);

      // Get token from edge function
      const { data, error: fnError } = await supabase.functions.invoke("elevenlabs-conversation-token");
      if (fnError) throw new Error(`Token error: ${fnError.message}`);

      console.log("[Andrea Voice] Token response mode:", data?.mode);

      // Start session — prefer WebRTC (token), fallback to WebSocket (signed_url)
      // Use explicit STUN/TURN for mobile 4G/5G NAT traversal
      if (data?.token && data?.mode === "webrtc") {
        console.log("[Andrea Voice] 🚀 Starting WebRTC session");
        await conversation.startSession({
          conversationToken: data.token,
          connectionType: "webrtc",
          overrides: { agent: { language: "fr" } },
        });
      } else if (data?.signed_url) {
        console.log("[Andrea Voice] 🔌 Falling back to WebSocket session");
        await conversation.startSession({
          signedUrl: data.signed_url,
          overrides: { agent: { language: "fr" } },
        });
      } else {
        throw new Error("Ni token ni signed_url reçus.");
      }

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
        warmupAudio();
        conversation.sendUserMessage(text.trim());
        setIsThinking(true);
        setIsGeneratingAudio(false);
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
    isGeneratingAudio,
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
