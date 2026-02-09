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
  const [lastRawMessage, setLastRawMessage] = useState<string | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      autoCommitSentRef.current = false;
      toast.success("Connexion établie ✅", { duration: 3000 });

      setTimeout(() => {
        startMicMonitorFromNewStream();
        forceAudioOutput();
      }, 500);
    },
    onDisconnect: () => {
      console.log("[Andrea Voice] ⚠️ Disconnected from agent");
      setMicActive(false);
      setMicLevel(0);
      clearSilenceTimer();
      stopMicMonitor();
      clearResponseTimeout();
      toast("Andrea déconnectée", { duration: 3000 });
    },
    onMessage: (message: any) => {
      const raw = JSON.stringify(message);
      console.log("[Andrea Voice] Message:", raw);
      setLastRawMessage(raw.slice(0, 200));

      // Capture agent text — ALWAYS show it (diagnostic mode)
      if (message?.source === "ai" || message?.role === "agent") {
        const text = message?.message || message?.agent_response_event?.agent_response || message?.text;
        if (text) {
          const cleanText = typeof text === "string" ? text.replace(/^"|"$/g, "") : String(text);
          setLastAgentText(cleanText);
          setShowTextFallback(true); // Always show text for diagnostic
          setIsThinking(false);
          console.log("[Andrea Voice] 💬 Agent text:", cleanText);
          hasSpokenRef.current = false;
          startResponseTimeout();
        }
      }

      // Detect user speech end → agent is now "thinking"
      if (message?.type === "user_transcript" || (message?.source === "user" && message?.role === "user")) {
        setIsThinking(true);
        autoCommitSentRef.current = false; // Reset for next silence cycle
        console.log("[Andrea Voice] 🧠 User finished speaking, agent thinking...");
      }

      // Surface errors
      const msgStr = raw;
      if (/quota/i.test(msgStr) || /exceeded/i.test(msgStr)) {
        toast.error("⚠️ Crédits ElevenLabs épuisés", { duration: 8000 });
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
        toast.error(`Erreur: ${errStr.slice(0, 80)}`, { duration: 5000 });
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

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((m) => {
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLAudioElement) {
              node.volume = 1.0;
              node.muted = false;
              if ((node as any).setSinkId) {
                (node as any).setSinkId("default").catch(() => {});
              }
            }
          });
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => observer.disconnect(), 30000);
    } catch (e) {
      console.warn("[Andrea Voice] setSinkId not supported:", e);
    }
  }, []);

  // Auto-trigger: send invisible message after 1.5s of silence
  const triggerAutoCommit = useCallback(() => {
    if (conversation.status === "connected" && !autoCommitSentRef.current && !conversation.isSpeaking) {
      autoCommitSentRef.current = true;
      console.log("[Andrea Voice] 🤖 Auto-commit: silence >1.5s, sending trigger message");
      try {
        conversation.sendUserMessage("...");
        setIsThinking(true);
      } catch (e) {
        console.error("[Andrea Voice] Auto-commit failed:", e);
      }
    }
  }, [conversation]);

  // Start mic monitor with auto-silence detection
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
          // User started talking again, reset auto-commit
          autoCommitSentRef.current = false;
          clearSilenceTimer();
        } else {
          silentFrames++;
          // ~90 frames ≈ 1.5s at 60fps
          if (silentFrames > 90 && wasActive && !autoCommitSentRef.current) {
            // Silence detected after speech → auto-trigger
            if (!silenceTimerRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                triggerAutoCommit();
                silenceTimerRef.current = null;
              }, 200); // Small debounce
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
      console.log("[Andrea Voice] ✅ Mic monitor started (post-connect)");
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
      clearResponseTimeout();
      clearSilenceTimer();
    };
  }, [stopMicMonitor, clearResponseTimeout, clearSilenceTimer]);

  // Track when agent starts speaking
  useEffect(() => {
    if (conversation.isSpeaking) {
      hasSpokenRef.current = true;
      setAudioBlocked(false);
      setIsThinking(false);
      clearResponseTimeout();
      forceAudioOutput();
    }
  }, [conversation.isSpeaking, clearResponseTimeout, forceAudioOutput]);

  // Detect audio blocked: text arrived but no audio after timeout
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

  // Hard reset: close everything, clear all caches
  const hardReset = useCallback(async () => {
    console.log("[Andrea Voice] 💥 Hard reset requested");
    // 1. End session
    try { await conversation.endSession(); } catch {}
    // 2. Stop mic monitor
    stopMicMonitor();
    // 3. Close audio context
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
    // 4. Kill all audio elements created by SDK
    document.querySelectorAll("audio").forEach((el) => {
      el.pause();
      el.src = "";
      el.remove();
    });
    // 5. Reset all state
    clearResponseTimeout();
    clearSilenceTimer();
    setMicActive(false);
    setMicLevel(0);
    setLastAgentText(null);
    setShowTextFallback(false);
    setIsThinking(false);
    setAudioBlocked(false);
    setLastRawMessage(null);
    setError(null);
    autoCommitSentRef.current = false;
    toast.success("Session réinitialisée 🔄", { duration: 2000 });
  }, [conversation, stopMicMonitor, clearResponseTimeout, clearSilenceTimer]);

  const startConversation = useCallback(async () => {
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
    setLastRawMessage(null);
    autoCommitSentRef.current = false;
    stopMicMonitor();

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") await audioCtx.resume();
      const sampleRate = audioCtx.sampleRate;
      const buffer = audioCtx.createBuffer(1, Math.ceil(sampleRate * 0.1), sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() - 0.5) * 0.001;
      }
      const silentSource = audioCtx.createBufferSource();
      silentSource.buffer = buffer;
      silentSource.connect(audioCtx.destination);
      silentSource.start(0);
      console.log("[Andrea Voice] AudioContext unlocked, sampleRate:", sampleRate);

      console.log("[Andrea Voice] Fetching signed URL...");
      const { data, error: fnError } = await supabase.functions.invoke("elevenlabs-conversation-token");

      if (fnError) throw new Error(`Token error: ${fnError.message}`);
      if (!data?.signed_url) throw new Error("Pas de signed_url reçue.");

      console.log("[Andrea Voice] ✅ Signed URL obtained, starting session...");

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

      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setMicPermission("denied");
        toast.error("Micro bloqué. Autorisez l'accès au microphone.", { duration: 5000 });
      } else {
        toast.error("Erreur de connexion ❌");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, stopMicMonitor]);

  // Stop: end session but keep last text visible
  const stopConversation = useCallback(async () => {
    stopMicMonitor();
    clearResponseTimeout();
    clearSilenceTimer();
    // Keep lastAgentText visible, force show it
    if (lastAgentText) {
      setShowTextFallback(true);
    }
    try { await conversation.endSession(); } catch {}
  }, [conversation, stopMicMonitor, clearResponseTimeout, clearSilenceTimer, lastAgentText]);

  const unlockAudio = useCallback(() => {
    console.log("[Andrea Voice] 🔓 Manual audio unlock requested");
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    unlockAudio,
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
  };
};
