import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  X, 
  Camera, 
  Video, 
  SwitchCamera, 
  Loader2,
  RotateCcw,
  Send,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StoryRecorderProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (blob: Blob, mediaType: "image" | "video", caption?: string) => Promise<void>;
  isUploading?: boolean;
}

const MAX_VIDEO_DURATION = 20; // 20 seconds max

// Detect mobile device
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
};

const StoryRecorder = ({ isOpen, onClose, onPublish, isUploading }: StoryRecorderProps) => {
  const isMobile = isMobileDevice();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturedMedia, setCapturedMedia] = useState<{ blob: Blob; type: "image" | "video"; url: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start camera stream with HD quality 1080p and 9:16 aspect ratio
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode,
          width: { ideal: 1080, min: 720 },
          height: { ideal: 1920, min: 1280 },
          aspectRatio: { ideal: 9/16 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasPermission(false);
      setError(err.name === "NotAllowedError" 
        ? "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres de votre navigateur."
        : "Impossible d'accéder à la caméra. Vérifiez que votre appareil dispose d'une caméra."
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

  // Start video recording with HD quality and high bitrate
  const startRecording = () => {
    if (!streamRef.current) {
      setError("Caméra non disponible. Veuillez réessayer.");
      return;
    }

    chunksRef.current = [];
    setRecordingTime(0);

    // Find best supported codec for quality
    const mimeTypes = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=h264,opus",
      "video/mp4;codecs=h264,aac",
      "video/webm"
    ];
    
    let mimeType = "video/webm";
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, { 
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps for HD quality
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setCapturedMedia({ blob, type: "video", url });

        // Stop camera stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setError("Erreur d'enregistrement. Veuillez réessayer.");
        setIsRecording(false);
      };

      mediaRecorder.start(100);
      setIsRecording(true);

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
      setError("Erreur lors du démarrage de l'enregistrement. Votre appareil ne supporte peut-être pas l'enregistrement vidéo.");
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
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 left-4 z-20 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Main content */}
      {!capturedMedia ? (
        // Camera view
        <>
          {/* Permission error */}
          {hasPermission === false && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-white text-lg mb-2">Accès caméra requis</p>
              <p className="text-muted-foreground text-sm mb-6">
                {error || "Veuillez autoriser l'accès à la caméra pour filmer une story."}
              </p>
              <Button onClick={startCamera} variant="secondary">
                Réessayer
              </Button>
            </div>
          )}

          {/* Camera preview */}
          {hasPermission !== false && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  "flex-1 w-full object-cover",
                  facingMode === "user" && "scale-x-[-1]"
                )}
              />

              {/* Recording timer */}
              {isRecording && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-destructive/90 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-white font-mono text-sm">
                    {formatTime(recordingTime)} / {formatTime(MAX_VIDEO_DURATION)}
                  </span>
                </div>
              )}

              {/* Recording progress bar */}
              {isRecording && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
                  <div 
                    className="h-full bg-destructive transition-all duration-1000"
                    style={{ width: `${(recordingTime / MAX_VIDEO_DURATION) * 100}%` }}
                  />
                </div>
              )}

              {/* Camera controls */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-8">
                  {/* Switch camera */}
                  <button
                    onClick={switchCamera}
                    disabled={isRecording}
                    className="p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors disabled:opacity-50"
                  >
                    <SwitchCamera className="w-6 h-6" />
                  </button>

                  {/* Record/Stop button with pulsing animation */}
                  {isRecording ? (
                    <button
                      onClick={stopRecording}
                      className="w-20 h-20 rounded-full bg-destructive border-4 border-white flex items-center justify-center animate-pulse"
                    >
                      <Square className="w-8 h-8 text-white fill-white" />
                    </button>
                  ) : (
                    <button
                      onClick={startRecording}
                      className="w-20 h-20 rounded-full bg-destructive border-4 border-white hover:scale-105 transition-transform active:scale-95"
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

                <p className="text-center text-white/60 text-sm mt-4">
                  {isRecording 
                    ? "Appuyez sur ■ pour arrêter" 
                    : "Appuyez sur ● pour filmer ou 📷 pour une photo"}
                </p>
              </div>
            </>
          )}
        </>
      ) : (
        // Preview captured media
        <div className="flex-1 flex flex-col">
          {/* Media preview */}
          <div className="flex-1 flex items-center justify-center bg-black">
            {capturedMedia.type === "video" ? (
              <video
                src={capturedMedia.url}
                className="max-w-full max-h-full object-contain"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={capturedMedia.url}
                alt="Capture"
                className="max-w-full max-h-full object-contain"
              />
            )}
          </div>

          {/* Caption and actions */}
          <div className="p-4 bg-black/90 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="caption" className="text-white">Légende (optionnel)</Label>
              <Input
                id="caption"
                placeholder="Décrivez votre réalisation..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={150}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
              <p className="text-xs text-white/60 text-right">
                {caption.length}/150 caractères
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
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
