import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Send, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, duration: number) => Promise<void>;
  disabled?: boolean;
}

export const VoiceRecorder = ({ onSend, disabled }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_DURATION = 60; // 60 seconds max

  useEffect(() => {
    return () => {
      stopRecording();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/webm'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      
      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= MAX_DURATION - 1) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setDuration(0);
    chunksRef.current = [];
  };

  const handleSend = async () => {
    if (!audioBlob) return;
    
    setIsSending(true);
    try {
      await onSend(audioBlob, duration);
      setAudioBlob(null);
      setDuration(0);
      chunksRef.current = [];
    } catch (error) {
      console.error("Error sending voice message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording in progress UI
  if (isRecording) {
    return (
      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
        <div className="relative flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-500">
            {formatDuration(duration)}
          </span>
          <span className="text-xs text-muted-foreground">/ {formatDuration(MAX_DURATION)}</span>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={cancelRecording}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={stopRecording}
          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          <Square className="h-4 w-4 fill-current" />
        </Button>
      </div>
    );
  }

  // Audio ready to send UI
  if (audioBlob) {
    return (
      <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            Message vocal • {formatDuration(duration)}
          </span>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          onClick={cancelRecording}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          disabled={isSending}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          size="icon"
          onClick={handleSend}
          className="h-8 w-8"
          disabled={isSending}
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  // Default button
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={startRecording}
      disabled={disabled}
      className={cn(
        "h-9 w-9 shrink-0",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      title="Enregistrer un message vocal"
    >
      <Mic className="h-5 w-5" />
    </Button>
  );
};
