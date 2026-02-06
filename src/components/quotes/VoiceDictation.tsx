import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceDictationProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}

export const VoiceDictation = ({ onTranscript, disabled }: VoiceDictationProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("La reconnaissance vocale n'est pas supportée par votre navigateur");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        toast.error("Accès au microphone refusé. Vérifiez vos permissions.");
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    toast.info("🎙️ Dictez votre devis...");
  }, [onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  if (!isSupported) return null;

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "default"}
      onClick={isListening ? stopListening : startListening}
      disabled={disabled}
      className={isListening 
        ? "gap-2 animate-pulse" 
        : "gap-2 bg-orange-500 hover:bg-orange-600 text-white"
      }
    >
      {isListening ? (
        <>
          <MicOff className="w-4 h-4" />
          Arrêter la dictée
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
