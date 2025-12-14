import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceMessageProps {
  audioUrl: string;
  duration?: number;
  isOwn?: boolean;
}

// Generate consistent waveform data based on URL hash
const generateWaveformData = (url: string, barCount: number = 40): number[] => {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash = hash & hash;
  }
  
  const bars: number[] = [];
  for (let i = 0; i < barCount; i++) {
    // Create natural-looking waveform with varying heights
    const seed = Math.abs(Math.sin(hash * (i + 1) * 0.1) * 10000);
    const base = 0.3 + (seed % 0.7);
    // Add some wave-like variation
    const wave = Math.sin(i * 0.3) * 0.2 + Math.sin(i * 0.7) * 0.15;
    bars.push(Math.min(1, Math.max(0.15, base + wave)));
  }
  return bars;
};

export const VoiceMessage = ({ audioUrl, duration = 0, isOwn = false }: VoiceMessageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  const waveformData = useMemo(() => generateWaveformData(audioUrl, 35), [audioUrl]);

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
      "flex items-center gap-2 p-2.5 rounded-2xl min-w-[220px] max-w-[300px] shadow-sm",
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
          "h-11 w-11 rounded-full shrink-0 transition-all duration-200",
          isOwn 
            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground hover:scale-105" 
            : "bg-primary hover:bg-primary/90 text-primary-foreground hover:scale-105"
        )}
      >
        {isPlaying ? (
          <Pause className="h-5 w-5 fill-current" />
        ) : (
          <Play className="h-5 w-5 fill-current ml-0.5" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        {/* Waveform visualization */}
        <div 
          ref={progressRef}
          className="h-9 cursor-pointer flex items-center gap-[2px] px-1"
          onClick={handleProgressClick}
        >
          {waveformData.map((height, i) => {
            const barProgress = ((i + 1) / waveformData.length) * 100;
            const isActive = barProgress <= progress;
            const isCurrentBar = Math.abs(barProgress - progress) < (100 / waveformData.length);
            
            return (
              <div
                key={i}
                className={cn(
                  "w-[3px] rounded-full transition-all duration-150",
                  isActive 
                    ? isOwn 
                      ? "bg-primary-foreground" 
                      : "bg-primary"
                    : isOwn 
                      ? "bg-primary-foreground/30" 
                      : "bg-muted-foreground/30",
                  isCurrentBar && isPlaying && "animate-pulse"
                )}
                style={{ 
                  height: `${height * 100}%`,
                  minHeight: '4px',
                  transform: isCurrentBar && isPlaying ? 'scaleY(1.1)' : 'scaleY(1)',
                }}
              />
            );
          })}
        </div>

        {/* Time and speed controls */}
        <div className="flex items-center justify-between px-1 mt-0.5">
          <span className={cn(
            "text-[11px] font-medium tabular-nums",
            isOwn ? "text-primary-foreground/80" : "text-muted-foreground"
          )}>
            {isPlaying ? formatTime(currentTime) : formatTime(audioDuration)}
          </span>
          <button
            onClick={cyclePlaybackRate}
            className={cn(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-md transition-colors",
              isOwn 
                ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30" 
                : "bg-accent text-accent-foreground hover:bg-accent/80"
            )}
          >
            {playbackRate}×
          </button>
        </div>
      </div>
    </div>
  );
};
