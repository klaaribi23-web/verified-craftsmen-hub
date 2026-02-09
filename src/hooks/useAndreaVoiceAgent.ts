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
  const [micLevel, setMicLevel] = useState(0); // 0-1 for waveform visualization
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  const conversation = useConversation({
    onConnect: () => {
      console.log("[Andrea Voice] ✅ Connected to ElevenLabs agent");
      setError(null);
      toast.success("Connexion ElevenLabs établie ✅", { duration: 3000 });
    },
    onDisconnect: () => {
      console.log("[Andrea Voice] ⚠️ Disconnected from agent");
      setMicActive(false);
      setMicLevel(0);
      stopMicMonitor();
      toast("Andrea déconnectée", { duration: 3000 });
    },
    onMessage: (message: any) => {
      console.log("[Andrea Voice] Message:", JSON.stringify(message));
      // Surface quota/API errors as toasts
      const msgStr = typeof message === "string" ? message : JSON.stringify(message);
      if (/quota/i.test(msgStr) || /exceeded/i.test(msgStr)) {
        toast.error("⚠️ Crédits ElevenLabs épuisés (Quota Exceeded)", { duration: 8000 });
        setError("Quota exceeded");
      }
      if (/api.key/i.test(msgStr) || /unauthorized/i.test(msgStr) || /invalid.*key/i.test(msgStr)) {
        toast.error("⚠️ Erreur clé API ElevenLabs", { duration: 8000 });
        setError("API Key error");
      }
      if (/error/i.test(msgStr) && !/no error/i.test(msgStr)) {
        console.warn("[Andrea Voice] Possible error in message:", msgStr);
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

  // Monitor mic input volume with low threshold
  const startMicMonitor = useCallback((stream: MediaStream) => {
    try {
      const ctx = audioCtxRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
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
        // Use max instead of avg for better sensitivity
        let max = 0;
        for (let i = 0; i < dataArray.length; i++) {
          if (dataArray[i] > max) max = dataArray[i];
        }
        const normalizedLevel = max / 255;

        // Update level every 3 frames for smooth animation
        frameCount++;
        if (frameCount % 3 === 0) {
          setMicLevel(normalizedLevel);
        }

        // Very low threshold: any sound > 0.5% triggers active
        if (max > 1) {
          setMicActive(true);
          silentFrames = 0;
        } else {
          silentFrames++;
          // After ~5 seconds of total silence
          if (silentFrames > 300) {
            setMicActive(false);
          }
        }
        rafRef.current = requestAnimationFrame(check);
      };
      check();
      console.log("[Andrea Voice] ✅ Mic monitor started, analyser fftSize:", analyser.fftSize);
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

  const resetMic = useCallback(async () => {
    console.log("[Andrea Voice] 🔄 Resetting microphone...");
    stopMicMonitor();

    // Close old AudioContext
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;
      startMicMonitor(stream);
      setMicPermission("granted");
      toast.success("Micro réinitialisé ✅");
      console.log("[Andrea Voice] ✅ Mic reset complete, tracks:", stream.getAudioTracks().map(t => t.getSettings()));
    } catch (err) {
      console.error("[Andrea Voice] ❌ Mic reset failed:", err);
      toast.error("Impossible de réinitialiser le micro.");
    }
  }, [stopMicMonitor, startMicMonitor]);

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
    stopMicMonitor();

    try {
      // 1. Force AudioContext activation (mobile audio unlock)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      // Play silent buffer to unlock audio output on iOS/Android
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const silentSource = audioCtx.createBufferSource();
      silentSource.buffer = buffer;
      silentSource.connect(audioCtx.destination);
      silentSource.start(0);
      console.log("[Andrea Voice] AudioContext state:", audioCtx.state);

      // 2. Request MONO microphone at 16kHz
      console.log("[Andrea Voice] Requesting MONO 16kHz microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      micStreamRef.current = stream;
      setMicPermission("granted");
      const settings = stream.getAudioTracks()[0]?.getSettings();
      console.log("[Andrea Voice] ✅ Mic granted — sampleRate:", settings?.sampleRate, "channelCount:", settings?.channelCount);

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

      // 5. Start conversation — French forced, WebRTC for low latency
      await conversation.startSession({
        signedUrl: data.signed_url,
        overrides: {
          agent: {
            language: "fr",
          },
        },
      });

      console.log("[Andrea Voice] ✅ Session started successfully");

      // 6. Force audio output to default device (mobile fix)
      try {
        const audioElements = document.querySelectorAll("audio");
        audioElements.forEach((el) => {
          el.volume = 1.0;
          if ((el as any).setSinkId) {
            (el as any).setSinkId("default").catch(() => {});
          }
        });
        console.log("[Andrea Voice] Audio output forced to default device, found", audioElements.length, "audio elements");
      } catch (e) {
        console.warn("[Andrea Voice] setSinkId not supported:", e);
      }
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
  }, [conversation, startMicMonitor, stopMicMonitor]);

  const endConversation = useCallback(async () => {
    stopMicMonitor();
    try { await conversation.endSession(); } catch {}
  }, [conversation, stopMicMonitor]);

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
  };
};
