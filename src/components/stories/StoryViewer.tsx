import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Story {
  id: string;
  media_url: string;
  media_type: string;
  caption?: string | null;
  created_at: string;
  expires_at: string;
}

interface StoryViewerProps {
  stories: Story[];
  artisanName: string;
  artisanPhoto?: string | null;
  highlightCity?: string;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const STORY_DURATION = 5000; // 5 seconds for images

const StoryViewer = ({
  stories,
  artisanName,
  artisanPhoto,
  highlightCity,
  initialIndex = 0,
  isOpen,
  onClose,
}: StoryViewerProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const viewedStories = useRef<Set<string>>(new Set());

  const currentStory = stories[currentIndex];
  const isVideo = currentStory?.media_type === "video";

  // Record view with duplicate prevention
  const recordView = useCallback(async (storyId: string) => {
    if (viewedStories.current.has(storyId)) return;
    viewedStories.current.add(storyId);

    try {
      // Get current user ID if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      const viewerId = user?.id || null;

      // Use the new record_story_view function that prevents duplicates
      await supabase.rpc("record_story_view", { 
        p_story_id: storyId,
        p_viewer_id: viewerId
      });
    } catch (error) {
      console.error("Error recording view:", error);
    }
  }, []);

  // Go to next story
  const goToNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  // Go to previous story
  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  // Handle click navigation
  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const threshold = rect.width / 3;

    if (x < threshold) {
      goToPrev();
    } else {
      goToNext();
    }
  };

  // Progress timer for images
  useEffect(() => {
    if (!isOpen || isPaused || isVideo) return;

    const startTime = Date.now();
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        goToNext();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isOpen, isPaused, isVideo, currentIndex, goToNext]);

  // Video progress handling
  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      setProgress((currentTime / duration) * 100);
    }
  };

  const handleVideoEnded = () => {
    goToNext();
  };

  // Record view on story change
  useEffect(() => {
    if (isOpen && currentStory) {
      recordView(currentStory.id);
    }
  }, [isOpen, currentStory, recordView]);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setProgress(0);
      viewedStories.current.clear();
    }
  }, [isOpen, initialIndex]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "Escape") onClose();
      if (e.key === " ") {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  if (!isOpen || !currentStory) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Story container */}
      <div
        className="relative w-full h-full max-w-lg mx-auto flex flex-col"
        onClick={handleClick}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-2">
          {stories.map((_, index) => (
            <div
              key={index}
              className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden"
            >
              <div
                className={cn(
                  "h-full bg-white rounded-full transition-all",
                  index < currentIndex ? "w-full" : index === currentIndex ? "" : "w-0"
                )}
                style={{
                  width: index === currentIndex ? `${progress}%` : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-10 flex items-center gap-3 px-4 py-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white">
            {artisanPhoto ? (
              <img src={artisanPhoto} alt={artisanName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                {artisanName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-white font-medium text-sm">{artisanName}</span>
            <span className="text-white/60 text-xs">
              {formatDistanceToNow(new Date(currentStory.created_at), { 
                addSuffix: true, 
                locale: fr 
              })}
            </span>
          </div>
        </div>

        {/* Media content */}
        <div className="flex-1 flex items-center justify-center">
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentStory.media_url}
              className="max-w-full max-h-full object-contain"
              autoPlay
              muted={isMuted}
              playsInline
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
            />
          ) : (
            <img
              src={currentStory.media_url}
              alt="Story"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-16 left-0 right-0 z-10 px-4">
            <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 max-w-lg mx-auto">
              <p className="text-white text-sm text-center" dangerouslySetInnerHTML={{
                __html: highlightCity && currentStory.caption.includes(highlightCity)
                  ? currentStory.caption.replace(
                      new RegExp(`(${highlightCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'),
                      '<strong class="font-bold">$1</strong>'
                    )
                  : currentStory.caption
              }} />
            </div>
          </div>
        )}
        {isVideo && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="absolute bottom-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}

        {/* Navigation arrows (visible on hover) */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 text-white opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}
        {currentIndex < stories.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 text-white opacity-0 hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;
