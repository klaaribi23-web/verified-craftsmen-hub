import { useConversation } from "@elevenlabs/react";
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAndreaVoiceAgent = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => {
      console.log("[Andrea Voice] ✅ Connected to ElevenLabs agent");
      setError(null);
    },
    onDisconnect: () => {
      console.log("[Andrea Voice] Disconnected from agent");
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

  const startConversation = useCallback(async () => {
    if (conversation.status === "connected") {
      console.log("[Andrea Voice] Already connected, ending session");
      await conversation.endSession();
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Force AudioContext activation on mobile (user gesture required)
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioCtx.state === "suspended") {
          await audioCtx.resume();
        }
        console.log("[Andrea Voice] AudioContext state:", audioCtx.state);
      } catch (audioErr) {
        console.warn("[Andrea Voice] AudioContext init warning:", audioErr);
      }

      // Request microphone permission
      console.log("[Andrea Voice] Requesting microphone access...");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[Andrea Voice] ✅ Microphone access granted");

      // Get signed URL from edge function
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

      // Start the conversation via WebSocket
      await conversation.startSession({
        signedUrl: data.signed_url,
      });

      console.log("[Andrea Voice] ✅ Session started successfully");
    } catch (err: any) {
      console.error("[Andrea Voice] ❌ Failed to start conversation:", err);
      const msg = err?.message || "Erreur inconnue";
      setError(msg);

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
  }, [conversation]);

  const endConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return {
    startConversation,
    endConversation,
    isConnecting,
    isConnected: conversation.status === "connected",
    isSpeaking: conversation.isSpeaking,
    status: conversation.status,
    error,
  };
};
