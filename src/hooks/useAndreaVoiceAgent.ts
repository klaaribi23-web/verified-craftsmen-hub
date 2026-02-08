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
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

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
        // permissions.query not supported for microphone on some browsers
        setMicPermission("unknown");
      }
    };
    checkPermission();
  }, []);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[Andrea Voice] ✅ Connected to ElevenLabs agent");
      setError(null);
      toast.success("Connexion ElevenLabs établie ✅", { duration: 3000 });
    },
    onDisconnect: () => {
      console.log("[Andrea Voice] Disconnected from agent");
      setMicActive(false);
      stopMicMonitor();
    },
    onMessage: (message) => {
      console.log("[Andrea Voice] Message:", message);
    },
    onError: (error) => {
      console.error("[Andrea Voice] ❌ Agent error:", error);
      setError(String(error));
      toast.error("Erreur de connexion ElevenLabs ❌", { duration: 5000 });
    },
  });

  // Boost output volume to 150%
  const boostOutputVolume = useCallback(() => {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      // Find all audio/video elements and boost via GainNode
      const audioElements = document.querySelectorAll("audio, video");
      audioElements.forEach((el) => {
        const mediaEl = el as HTMLMediaElement;
        if (!(mediaEl as any).__boosted) {
          try {
            const source = ctx.createMediaElementSource(mediaEl);
            const gain = ctx.createGain();
            gain.gain.value = 1.5; // 150%
            source.connect(gain);
            gain.connect(ctx.destination);
            (mediaEl as any).__boosted = true;
          } catch {}
        }
      });
    } catch (e) {
      console.warn("[Andrea Voice] Volume boost error:", e);
    }
  }, []);

  // Set ElevenLabs SDK volume to max
  useEffect(() => {
    if (conversation.status === "connected") {
      try {
        conversation.setVolume({ volume: 1 });
      } catch {}
      // Also try boosting any audio elements
      const timer = setInterval(boostOutputVolume, 1000);
      return () => clearInterval(timer);
    }
  }, [conversation.status, boostOutputVolume, conversation]);

  // Monitor mic input volume
  const startMicMonitor = useCallback((stream: MediaStream) => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let silentFrames = 0;

      const check = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        if (avg > 2) {
          setMicActive(true);
          silentFrames = 0;
        } else {
          silentFrames++;
          if (silentFrames > 150) {
            setMicActive(false);
          }
        }
        rafRef.current = requestAnimationFrame(check);
      };
      check();
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
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMicMonitor();
    };
  }, [stopMicMonitor]);

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
    stopMicMonitor();

    try {
      // 1. Force AudioContext activation
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
      console.log("[Andrea Voice] AudioContext state:", audioCtx.state);

      // 2. Request microphone — FORCE MONO
      console.log("[Andrea Voice] Requesting MONO microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;
      setMicPermission("granted");
      console.log("[Andrea Voice] ✅ Mono mic access granted, tracks:", stream.getAudioTracks().map(t => t.getSettings()));

      // 3. Start mic activity monitor
      startMicMonitor(stream);

      // 4. Get signed URL
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

      // 5. Start conversation — French forced
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
      console.error("[Andrea Voice] ❌ Failed to start conversation:", err);
      const msg = err?.message || "Erreur inconnue";
      setError(msg);
      stopMicMonitor();

      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setMicPermission("denied");
        toast.error("Micro bloqué. Autorisez l'accès au microphone.", { duration: 5000 });
      } else if (msg.includes("API") || msg.includes("Token")) {
        toast.error("Erreur de connexion ElevenLabs ❌");
      } else {
        toast.error("Erreur de connexion ElevenLabs ❌");
      }
    } finally {
      setIsConnecting(false);
    }
  }, [conversation, startMicMonitor, stopMicMonitor]);

  const endConversation = useCallback(async () => {
    stopMicMonitor();
    try { await conversation.endSession(); } catch {}
  }, [conversation, stopMicMonitor]);

  return {
    startConversation,
    endConversation,
    isConnecting,
    isConnected: conversation.status === "connected",
    isSpeaking: conversation.isSpeaking,
    micActive,
    micPermission,
    requestMicPermission,
    status: conversation.status,
    error,
  };
};