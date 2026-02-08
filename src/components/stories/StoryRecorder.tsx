import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  X, 
  Camera, 
  SwitchCamera, 
  Loader2,
  RotateCcw,
  Send,
  Square,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface StoryRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (blob: Blob, mediaType: "image" | "video", caption?: string) => Promise<void>;
  isUploading?: boolean;
  artisanContext?: {
    businessName: string;
    city: string;
    category?: string;
    department?: string;
  };
}

const MAX_VIDEO_DURATION = 20;

// Detect mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

// Get best supported mime type (MP4 first for Safari/iOS)
const getSupportedMimeType = (): string => {
  const types = [
    "video/mp4",
    "video/mp4;codecs=h264,aac",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=h264,opus",
    "video/webm"
  ];
  
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      console.log("Using codec:", type);
      return type;
    }
  }
  return "";
};

const StoryRecorder = ({ isOpen, onClose, onPublish, isUploading, artisanContext }: StoryRecorderProps) => {
  const isMobile = isMobileDevice();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<{ blob: Blob; type: "image" | "video"; url: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  const handleGenerateCaption = async () => {
    if (!artisanContext) return;
    setIsGeneratingCaption(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-portfolio-caption", {
        body: {
          businessName: artisanContext.businessName,
          metier: artisanContext.category,
          city: artisanContext.city,
          department: artisanContext.department,
        },
      });
      if (error) throw error;
      if (data?.caption) {
        setCaption(data.caption);
      }
    } catch (err) {
      console.error("Erreur g\u00e9n\u00e9ration l\u00e9gende:", err);
    } finally {
      setIsGeneratingCaption(false);
    }
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start camera stream with adaptive constraints for portrait mode
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Detect portrait orientation
      const isPortrait = window.innerHeight > window.innerWidth;
      console.log("Portrait mode:", isPortrait);

      // Adaptive constraints for portrait/landscape
      const videoConstraints: MediaTrackConstraints = {
        facingMode,
        width: { ideal: isPortrait ? 1080 : 1920, min: 640 },
        height: { ideal: isPortrait ? 1920 : 1080, min: 480 },
        aspectRatio: { ideal: isPortrait ? 9/16 : 16/9 },
        frameRate: { ideal: 30, min: 24 }
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true
      });

      streamRef.current = stream;
      setHasPermission(true);

      // Log actual camera settings for debug
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();
      console.log("Camera settings:", settings);
      console.log("Resolution:", settings.width, "x", settings.height);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      setError(err.name === "NotAllowedError" 
        ? "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres."
        : "Impossible d'accéder à la caméra."
      );
    }
  }, [facingMode]);

  // Initialize camera when component opens
  useEffect(() => {
    if (isOpen && !capturedMedia) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isOpen, startCamera, capturedMedia]);

  // Switch camera
  const switchCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Take photo with 9:16 aspect ratio crop and HD quality
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Calculate 9:16 crop from video
    const targetAspect = 9 / 16;
    const videoAspect = video.videoWidth / video.videoHeight;
    
    let sourceX = 0, sourceY = 0, sourceWidth = video.videoWidth, sourceHeight = video.videoHeight;
    
    if (videoAspect > targetAspect) {
      // Video too wide → horizontal crop
      sourceWidth = video.videoHeight * targetAspect;
      sourceX = (video.videoWidth - sourceWidth) / 2;
    } else {
      // Video too tall → vertical crop
      sourceHeight = video.videoWidth / targetAspect;
      sourceY = (video.videoHeight - sourceHeight) / 2;
    }
    
    // Canvas in 1080x1920 (9:16) for HD quality
    canvas.width = 1080;
    canvas.height = 1920;

    // Mirror the image if using front camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, 1080, 1920);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ blob, type: "image", url });
        
        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      }
    }, "image/jpeg", 0.95);
  };

  // Start video recording with Safari/iOS compatibility
  const startRecording = () => {
    if (!streamRef.current) {
      setError("Caméra non disponible. Veuillez réessayer.");
      return;
    }

    // Check if MediaRecorder is available
    if (typeof MediaRecorder === 'undefined') {
      setError("L'enregistrement vidéo n'est pas supporté sur votre navigateur.");
      return;
    }

    chunksRef.current = [];
    setRecordingTime(0);

    const mimeType = getSupportedMimeType();
    console.log("Recording with mimeType:", mimeType);

    try {
      const options: MediaRecorderOptions = {
        videoBitsPerSecond: 2500000 // 2.5 Mbps for HD quality
      };
      
      if (mimeType) {
        options.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        console.log("Data available:", e.data.size);
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Recording stopped, chunks:", chunksRef.current.length);
        const blob = new Blob(chunksRef.current, { type: mimeType || "video/webm" });
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ blob, type: "video", url });

        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.onerror = (e: any) => {
        console.error("MediaRecorder error:", e);
        setError("Erreur d'enregistrement. Essayez de prendre une photo.");
        setIsRecording(false);
      };

      // Start without timeslice for better Safari compatibility
      mediaRecorder.start();
      setIsRecording(true);
      console.log("Recording started");

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_VIDEO_DURATION - 1) {
            stopRecording();
            return MAX_VIDEO_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Recording error:", err);
      setError("Votre appareil ne supporte pas l'enregistrement vidéo. Essayez de prendre une photo.");
    }
  };

  // Stop video recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Retake - go back to camera
  const handleRetake = () => {
    if (capturedMedia?.url) {
      URL.revokeObjectURL(capturedMedia.url);
    }
    setCapturedMedia(null);
    setCaption("");
    setRecordingTime(0);
    startCamera();
  };

  // Publish story
  const handlePublish = async () => {
    if (!capturedMedia) return;
    await onPublish(capturedMedia.blob, capturedMedia.type, caption || undefined);
    handleClose();
  };

  // Close and cleanup
  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (capturedMedia?.url) {
      URL.revokeObjectURL(capturedMedia.url);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setCapturedMedia(null);
    setCaption("");
    setRecordingTime(0);
    setIsRecording(false);
    setHasPermission(null);
    onClose();
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  // Block recording on PC - show simple message
  if (!isMobile) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        style={{ height: "100dvh" }}
      >
        <div className="text-center p-6">
          <Camera className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-white text-xl font-medium mb-6">
            Stories disponibles sur mobile uniquement
          </p>
          <Button onClick={handleClose} variant="secondary">
            Fermer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex flex-col overflow-hidden"
      style={{ height: "100dvh" }}
    >
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main content */}
      {!capturedMedia ? (
        // Camera view - full screen with overlay controls
        <div className="relative w-full h-full">
          {/* Permission error */}
          {hasPermission === false && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center z-30">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-white text-lg mb-2">Accès caméra requis</p>
              <p className="text-muted-foreground text-sm mb-6">
                {error || "Veuillez autoriser l'accès à la caméra."}
              </p>
              <Button onClick={startCamera} variant="secondary">
                Réessayer
              </Button>
            </div>
          )}

          {/* Camera preview - object-contain to avoid zoom */}
          {hasPermission !== false && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={cn(
                "w-full h-full object-contain bg-black",
                facingMode === "user" && "scale-x-[-1]"
              )}
            />
          )}

          {/* Close button - inside frame */}
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Recording timer - inside frame */}
          {isRecording && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-destructive/90 px-3 py-1.5 rounded-full"
              style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-white font-mono text-sm">
                {formatTime(recordingTime)} / {formatTime(MAX_VIDEO_DURATION)}
              </span>
            </div>
          )}

          {/* Recording progress bar */}
          {isRecording && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
              <div 
                className="h-full bg-destructive transition-all duration-1000"
                style={{ width: `${(recordingTime / MAX_VIDEO_DURATION) * 100}%` }}
              />
            </div>
          )}

          {/* Camera controls - inside frame with safe area padding */}
          <div 
            className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1.5rem)" }}
          >
            <div className="flex items-center justify-center gap-8">
              {/* Switch camera */}
              <button
                onClick={switchCamera}
                disabled={isRecording}
                className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <SwitchCamera className="w-6 h-6" />
              </button>

              {/* Record/Stop button with pulsing animation when recording */}
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="w-20 h-20 rounded-full bg-destructive border-4 border-white flex items-center justify-center animate-pulse shadow-lg"
                >
                  <Square className="w-8 h-8 text-white fill-white" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="w-20 h-20 rounded-full bg-destructive border-4 border-white hover:scale-105 transition-transform active:scale-95 shadow-lg"
                  aria-label="Enregistrer"
                />
              )}

              {/* Take photo */}
              <button
                onClick={takePhoto}
                disabled={isRecording}
                className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            <p className="text-center text-white/60 text-xs mt-3">
              {isRecording 
                ? "Appuyez sur ■ pour arrêter" 
                : "● Filmer · 📷 Photo"}
            </p>
          </div>
        </div>
      ) : (
        // Preview captured media - with controls inside frame
        <div className="relative w-full h-full">
          {/* Media preview */}
          {capturedMedia.type === "video" ? (
            <video
              src={capturedMedia.url}
              className="w-full h-full object-contain bg-black"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={capturedMedia.url}
              alt="Capture"
              className="w-full h-full object-contain bg-black"
            />
          )}

          {/* Close button - inside frame */}
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            style={{ top: "max(env(safe-area-inset-top), 1rem)" }}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Controls overlay - inside frame */}
          <div 
            className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 1rem)" }}
          >
            {/* Caption input */}
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter une l\u00e9gende... (optionnel)"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={150}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm flex-1"
                />
                {artisanContext && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleGenerateCaption}
                    disabled={isGeneratingCaption}
                    className="border-white/30 text-white bg-white/10 hover:bg-white/20 shrink-0"
                    title="G\u00e9n\u00e9rer une l\u00e9gende g\u00e9o-centr\u00e9e par IA"
                  >
                    {isGeneratingCaption ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <p className="text-xs text-white/40 text-right mt-1">
                {caption.length}/150
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 border-white/30 text-white bg-white/10 hover:bg-white/20"
                disabled={isUploading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reprendre
              </Button>
              <Button
                onClick={handlePublish}
                className="flex-1"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Publier
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryRecorder;
