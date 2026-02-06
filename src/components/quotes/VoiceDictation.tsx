import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

interface VoiceDictationProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceDictation = ({ onTranscript, disabled }: VoiceDictationProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const accumulatedRef = useRef<string>("");

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) setIsSupported(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error("La reconnaissance vocale n'est pas supportée par votre navigateur");
      return;
    }

    // Reset accumulated text
    accumulatedRef.current = "";

    const recognition = new SR();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = false; // Only final results for reliability

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          accumulatedRef.current += event.results[i][0].transcript + " ";
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;

      if (event.error === "not-allowed" || event.error === "denied") {
        toast.error("Micro bloqué. Veuillez autoriser l'accès dans les réglages de votre navigateur.", { duration: 6000 });
      } else if (event.error === "no-speech") {
        toast.warning("Aucune parole détectée. Réessayez.");
      } else {
        toast.error("Erreur de reconnaissance vocale. Réessayez.");
      }
    };

    recognition.onend = () => {
      // Flush accumulated text on end (triggered by stop() or timeout)
      const text = accumulatedRef.current.trim();
      if (text) {
        onTranscript(text);
        toast.success("✅ Texte ajouté au devis");
      }
      accumulatedRef.current = "";
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      toast.info("🎙️ Écoute en cours...");
    } catch (err) {
      console.error("Failed to start recognition:", err);
      toast.error("Micro bloqué. Veuillez autoriser l'accès dans les réglages de votre navigateur.", { duration: 6000 });
    }
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // triggers onend which flushes text
    }
  }, []);

  if (!isSupported) return null;

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "default"}
      size="sm"
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={isListening 
        ? "gap-2 animate-pulse bg-red-600 hover:bg-red-700 text-white" 
        : "gap-2 bg-orange-500 hover:bg-orange-600 text-white"
      }
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4" />
          Écoute en cours...
        </>
      ) : (
        <>
          <Mic className="w-4 h-4" />
          Dictée vocale
        </>
      )}
    </Button>
  );
};
