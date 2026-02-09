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
  const [showMuteAlert, setShowMuteAlert] = useState(false);
  const [lastRawMessage, setLastRawMessage] = useState<string | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const keepAliveRef = useRef<AudioBufferSourceNode | null>(null);
  const [audioCtxState, setAudioCtxState] = useState<string>("suspended");
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const muteAlertTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  // Create a GainNode for volume boosting (2.0x)
  const ensureGainNode = useCallback((ctx: AudioContext): GainNode => {
    if (!gainNodeRef.current) {
      const gain = ctx.createGain();
      gain.gain.value = 2.0; // 200% volume boost
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;
      console.log("[Andrea Voice] 🔊 GainNode created at 2.0x");
    }
    return gainNodeRef.current;
  }, []);

  // Track AudioContext state changes
  const trackAudioCtxState = useCallback((ctx: AudioContext) => {
    setAudioCtxState(ctx.state);
    ctx.onstatechange = () => {
      setAudioCtxState(ctx.state);
      console.log("[Andrea Voice] AudioContext state:", ctx.state);
    };
  }, []);

  // Start a looping silent tone to keep the audio session alive on mobile
  const startKeepAlive = useCallback((ctx: AudioContext) => {
    try {
      stopKeepAlive();
      const gain = ensureGainNode(ctx);
      const sampleRate = ctx.sampleRate;
      const duration = 0.1;
      const buffer = ctx.createBuffer(1, Math.ceil(sampleRate * duration), sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() - 0.5) * 0.0005;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain); // Route through gain node
      source.start(0);
      keepAliveRef.current = source;
      console.log("[Andrea Voice] 🔁 Keep-alive started through GainNode");
    } catch (e) {
      console.warn("[Andrea Voice] Keep-alive failed:", e);
    }
  }, [ensureGainNode]);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      try { keepAliveRef.current.stop(); } catch {}
      keepAliveRef.current = null;
    }
  }, []);

  const startResponseTimeout = useCallback(() => {
    clearResponseTimeout();
    responseTimeoutRef.current = setTimeout(() => {
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
      setAudioBlocked(false);
      setShowMuteAlert(false);
      autoCommitSentRef.current = false;
      toast.success("Connexion établie ✅", { duration: 3000 });

      setTimeout(() => {
        startMicMonitorFromNewStream();
        forceAudioOutput();
        // Force volume via SDK
        try { conversation.setVolume({ volume: 1.0 }); } catch {}
      }, 500);
    },
    onDisconnect: () => {
      console.log("[Andrea Voice] ⚠️ Disconnected from agent");
      setMicActive(false);
      setMicLevel(0);
      clearSilenceTimer();
      stopMicMonitor();
      stopKeepAlive();
      clearResponseTimeout();
      toast("Andrea déconnectée", { duration: 3000 });
    },
    onMessage: (message: any) => {
      const raw = JSON.stringify(message);
      console.log("[Andrea Voice] Message:", raw);
      setLastRawMessage(raw.slice(0, 200));

      // Capture agent text — ALWAYS show it
      if (message?.source === "ai" || message?.role === "agent") {
        const text = message?.message || message?.agent_response_event?.agent_response || message?.text;
        if (text) {
          const cleanText = typeof text === "string" ? text.replace(/^"|"$/g, "") : String(text);
          setLastAgentText(cleanText);
          setShowTextFallback(true);
          setIsThinking(false);
          console.log("[Andrea Voice] 💬 Agent text:", cleanText);
          hasSpokenRef.current = false;
          startResponseTimeout();

          // Force SDK volume after every response
          try { conversation.setVolume({ volume: 1.0 }); } catch {}
          forceAudioOutput();
        }
      }

      // Detect user speech end
      if (message?.type === "user_transcript" || (message?.source === "user" && message?.role === "user")) {
        setIsThinking(true);
        autoCommitSentRef.current = false;
        console.log("[Andrea Voice] 🧠 User finished speaking, agent thinking...");
      }

      // Surface errors
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
      console.error("[Andrea Voice] ❌ Agent error:", errStr);
      setError(errStr);
      if (/quota/i.test(errStr) || /exceeded/i.test(errStr)) {
        toast.error("⚠️ Crédits ElevenLabs épuisés", { duration: 8000 });
      } else if (/key/i.test(errStr) || /unauthorized/i.test(errStr)) {
        toast.error("⚠️ Erreur clé API ElevenLabs", { duration: 8000 });
      } else {
        toast.error(`Erreur: ${errStr.slice(0, 80)}`, { duration: 5000 });
      }
    },
  });

  // Reroute an audio element through our boosted AudioContext
  const rerouteAudioElement = useCallback((el: HTMLAudioElement) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    try {
      // Only reroute if not already connected
      if ((el as any).__andrea_rerouted) return;
      (el as any).__andrea_rerouted = true;
      
      const source = ctx.createMediaElementSource(el);
      const gain = ensureGainNode(ctx);
      source.connect(gain);
      
      el.volume = 1.0;
      el.muted = false;
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      
      if (el.paused && el.src) {
        el.play().catch(() => {});
      }
      console.log("[Andrea Voice] 🔊 Audio element rerouted through GainNode");
    } catch (e) {
      // Fallback: just set volume high
      el.volume = 1.0;
      el.muted = false;
      el.setAttribute("playsinline", "");
      el.setAttribute("webkit-playsinline", "");
      if ((el as any).setSinkId) {
        (el as any).setSinkId("default").catch(() => {});
      }
      if (el.paused && el.src) {
        el.play().catch(() => {});
      }
    }
  }, [ensureGainNode]);

  // Force audio output to default device + reroute through gain
  const forceAudioOutput = useCallback(() => {
    try {
      document.querySelectorAll("audio").forEach(rerouteAudioElement);

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLAudioElement) {
              rerouteAudioElement(node);
            }
            // Also check children
            if (node instanceof HTMLElement) {
              node.querySelectorAll?.("audio")?.forEach(rerouteAudioElement);
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 60000);
    } catch (e) {
      console.warn("[Andrea Voice] forceAudioOutput error:", e);
    }
  }, [rerouteAudioElement]);

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

  // Start mic monitor with silence detection
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
        const normalizedLevel = max / 255;
        frameCount++;
        if (frameCount % 3 === 0) setMicLevel(normalizedLevel);

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
      if (muteAlertTimeoutRef.current) clearTimeout(muteAlertTimeoutRef.current);
    };
  }, [stopMicMonitor, stopKeepAlive, clearResponseTimeout, clearSilenceTimer]);

  // Track when agent starts speaking
  useEffect(() => {
    if (conversation.isSpeaking) {
      hasSpokenRef.current = true;
      setAudioBlocked(false);
      setShowMuteAlert(false);
      setIsThinking(false);
      clearResponseTimeout();
      if (muteAlertTimeoutRef.current) {
        clearTimeout(muteAlertTimeoutRef.current);
        muteAlertTimeoutRef.current = null;
      }
      forceAudioOutput();
      try { conversation.setVolume({ volume: 1.0 }); } catch {}
    }
  }, [conversation.isSpeaking, clearResponseTimeout, forceAudioOutput, conversation]);

  // Detect audio blocked → show mute alert after 6s
  useEffect(() => {
    if (showTextFallback && lastAgentText && !conversation.isSpeaking && !hasSpokenRef.current) {
      setAudioBlocked(true);
      // After 6s of text but no audio, show full-screen mute alert
      if (!muteAlertTimeoutRef.current) {
        muteAlertTimeoutRef.current = setTimeout(() => {
          if (!hasSpokenRef.current) {
            setShowMuteAlert(true);
          }
          muteAlertTimeoutRef.current = null;
        }, 6000);
      }
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
    document.querySelectorAll("audio").forEach((el) => {
      el.pause();
      el.src = "";
      el.remove();
    });
    clearResponseTimeout();
    clearSilenceTimer();
    setMicActive(false);
    setMicLevel(0);
    setLastAgentText(null);
    setShowTextFallback(false);
    setIsThinking(false);
    setAudioBlocked(false);
    setShowMuteAlert(false);
    setLastRawMessage(null);
    setError(null);
    autoCommitSentRef.current = false;
    toast.success("Session réinitialisée 🔄", { duration: 2000 });
  }, [conversation, stopMicMonitor, stopKeepAlive, clearResponseTimeout, clearSilenceTimer]);

  // Unified start: unlock audio + mic + session in one click
  const startConversation = useCallback(async () => {
    if (conversation.status === "connected") {
      try { await conversation.endSession(); } catch {}
      await new Promise((r) => setTimeout(r, 300));
    }

    setIsConnecting(true);
    setError(null);
    setMicActive(false);
    setMicLevel(0);
    setLastAgentText(null);
    setShowTextFallback(false);
    setShowMuteAlert(false);
    setLastRawMessage(null);
    autoCommitSentRef.current = false;
    stopMicMonitor();
    stopKeepAlive();

    try {
      // 1. Create AudioContext and GainNode in user gesture (CRITICAL for mobile)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      trackAudioCtxState(audioCtx);
      if (audioCtx.state === "suspended") await audioCtx.resume();
      ensureGainNode(audioCtx);

      // 2. Play a one-shot silent buffer through gain to unlock speakers
      const sampleRate = audioCtx.sampleRate;
      const buffer = audioCtx.createBuffer(1, Math.ceil(sampleRate * 0.1), sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() - 0.5) * 0.001;
      }
      const silentSource = audioCtx.createBufferSource();
      silentSource.buffer = buffer;
      const gain = gainNodeRef.current!;
      silentSource.connect(gain);
      silentSource.start(0);

      // 3. Start keep-alive loop through gain to prevent mobile speaker sleep
      startKeepAlive(audioCtx);

      console.log("[Andrea Voice] AudioContext unlocked + GainNode 2.0x + keep-alive, state:", audioCtx.state);

      // 4. Get signed URL
      const { data, error: fnError } = await supabase.functions.invoke("elevenlabs-conversation-token");
      if (fnError) throw new Error(`Token error: ${fnError.message}`);
      if (!data?.signed_url) throw new Error("Pas de signed_url reçue.");

      console.log("[Andrea Voice] ✅ Signed URL obtained, starting session...");

      // 5. Start session
      await conversation.startSession({
        signedUrl: data.signed_url,
        overrides: {
          agent: {
            language: "fr",
          },
        },
      });

      console.log("[Andrea Voice] ✅ Session started successfully");
    } catch (err: any) {
      console.error("[Andrea Voice] ❌ Failed to start:", err);
      const msg = err?.message || "Erreur inconnue";
      setError(msg);
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

  // Stop: end session but keep last text visible
  const stopConversation = useCallback(async () => {
    stopMicMonitor();
    stopKeepAlive();
    clearResponseTimeout();
    clearSilenceTimer();
    if (lastAgentText) setShowTextFallback(true);
    try { await conversation.endSession(); } catch {}
  }, [conversation, stopMicMonitor, stopKeepAlive, clearResponseTimeout, clearSilenceTimer, lastAgentText]);

  // Dismiss mute alert and retry audio
  const dismissMuteAlert = useCallback(() => {
    setShowMuteAlert(false);
    // Try to unlock audio again
    const audioCtx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    const buf = audioCtx.createBuffer(1, Math.ceil(audioCtx.sampleRate * 0.1), audioCtx.sampleRate);
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start(0);
    forceAudioOutput();
    setAudioBlocked(false);
    toast.success("Son activé 🔊");
  }, [forceAudioOutput]);

  return {
    startConversation,
    stopConversation,
    hardReset,
    dismissMuteAlert,
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
    lastRawMessage,
    showTextFallback,
    audioBlocked,
    showMuteAlert,
    audioCtxState,
  };
};
