import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceMessageProps {
  audioUrl: string;
  duration?: number;
  isOwn?: boolean;
}

export const VoiceMessage = ({ audioUrl, duration = 0, isOwn = false }: VoiceMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    
    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(Math.floor(audio.duration));
      }
    });
    
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
    });
    
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.playbackRate = playbackRate;
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioDuration;
    
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const newRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-2xl min-w-[200px] max-w-[280px]",
      isOwn 
        ? "bg-primary text-primary-foreground" 
        : "bg-muted text-foreground"
    )}>
      {/* Play/Pause Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        className={cn(
          "h-10 w-10 rounded-full shrink-0",
          isOwn 
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground" 
            : "bg-primary/10 hover:bg-primary/20 text-primary"
        )}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 fill-current ml-0.5" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        {/* Waveform visualization (simplified as progress bar) */}
        <div 
          ref={progressRef}
          className={cn(
            "h-8 rounded cursor-pointer flex items-center relative",
            isOwn ? "bg-primary-foreground/10" : "bg-background/50"
          )}
          onClick={handleProgressClick}
        >
          {/* Waveform bars */}
          <div className="flex items-center gap-0.5 w-full h-full px-2">
            {Array.from({ length: 20 }).map((_, i) => {
              const barProgress = (i + 1) / 20 * 100;
              const isActive = barProgress <= progress;
              // Random heights for visual effect
              const height = 30 + Math.sin(i * 0.8) * 50 + Math.cos(i * 1.2) * 30;
              
              return (
                <div
                  key={i}
                  className={cn(
                    "w-1 rounded-full transition-all",
                    isActive 
                      ? isOwn ? "bg-primary-foreground" : "bg-primary"
                      : isOwn ? "bg-primary-foreground/30" : "bg-muted-foreground/30"
                  )}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Time and speed */}
        <div className="flex items-center justify-between mt-1 px-1">
          <span className={cn(
            "text-xs",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {formatTime(currentTime)} / {formatTime(audioDuration)}
          </span>
          <button
            onClick={cyclePlaybackRate}
            className={cn(
              "text-xs font-medium px-1.5 py-0.5 rounded",
              isOwn 
                ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30" 
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      {/* Mic icon */}
      <Mic className={cn(
        "h-4 w-4 shrink-0",
        isOwn ? "text-primary-foreground/50" : "text-muted-foreground"
      )} />
    </div>
  );
};
