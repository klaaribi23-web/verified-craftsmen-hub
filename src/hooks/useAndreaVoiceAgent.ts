import { useConversation } from "@elevenlabs/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAndreaVoiceAgent = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[Andrea Voice] ✅ Connected to ElevenLabs agent");
      setError(null);
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
      toast.error("Erreur de connexion vocale. Réessayez.");
    },
  });

  // Monitor mic input volume to detect if mic is actually capturing
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
          // After ~3 seconds of silence, flag mic as inactive
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

  const startConversation = useCallback(async () => {
    // Always end any existing session first (avoid ghost connections)
    if (conversation.status === "connected") {
      console.log("[Andrea Voice] Ending existing session before restart");
      try { await conversation.endSession(); } catch {}
      // Small delay to let WebSocket close cleanly
      await new Promise((r) => setTimeout(r, 300));
    }

    setIsConnecting(true);
    setError(null);
    setMicActive(false);
    stopMicMonitor();

    try {
      // 1. Force AudioContext activation (required for iOS/Android output audio)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      if (audioCtx.state === "suspended") {
        await audioCtx.resume();
      }
      // Play a silent buffer to unlock audio output on mobile
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
      console.log("[Andrea Voice] AudioContext state:", audioCtx.state);

      // 2. Request microphone permission
      console.log("[Andrea Voice] Requesting microphone access...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      console.log("[Andrea Voice] ✅ Microphone access granted");

      // 3. Start mic activity monitor
      startMicMonitor(stream);

      // 4. Get signed URL from edge function
      console.log("[Andrea Voice] Fetching signed URL from edge function...");
      const { data, error: fnError } = await supabase.functions.invoke(
        "elevenlabs-conversation-token"
      );

      if (fnError) {
        console.error("[Andrea Voice] ❌ Edge function error:", fnError);
        throw new Error(`Token error: ${fnError.message}`);
      }

      if (!data?.signed_url) {
        console.error("[Andrea Voice] ❌ No signed_url received. Response:", data);
        throw new Error("Pas de signed_url reçue. Vérifiez la clé API et l'Agent ID.");
      }

      console.log("[Andrea Voice] ✅ Signed URL obtained, starting session...");

      // 5. Start conversation with language forced to French
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
        toast.error("Micro bloqué. Autorisez l'accès au microphone.", { duration: 5000 });
      } else if (msg.includes("API") || msg.includes("Token")) {
        toast.error("Clé API ou Agent ID invalide. Contactez le support.");
      } else {
        toast.error("Impossible de démarrer la conversation vocale.");
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
    status: conversation.status,
    error,
  };
};
