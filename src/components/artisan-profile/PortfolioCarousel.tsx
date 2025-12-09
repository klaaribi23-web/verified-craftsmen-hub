import { useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortfolioCarouselProps {
  items: string[];
  type: "image" | "video";
  onItemClick?: (item: string, index: number) => void;
}

export const PortfolioCarousel = ({ items, type, onItemClick }: PortfolioCarouselProps) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(items.length / itemsPerPage);
  
  const startIndex = currentPage * itemsPerPage;
  const visibleItems = items.slice(startIndex, startIndex + itemsPerPage);

  const goToPrevious = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const goToNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const getVimeoEmbedUrl = (url: string) => {
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    if (match) {
      return `https://player.vimeo.com/video/${match[1]}`;
    }
    return url;
  };

  const getEmbedUrl = (url: string) => {
    if (url.includes("youtube") || url.includes("youtu.be")) {
      return getYouTubeEmbedUrl(url);
    }
    if (url.includes("vimeo")) {
      return getVimeoEmbedUrl(url);
    }
    return url;
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {visibleItems.map((item, index) => (
          <div key={startIndex + index} className="relative aspect-video rounded-xl overflow-hidden group">
            {type === "image" ? (
              <button
                onClick={() => onItemClick?.(item, startIndex + index)}
                className="w-full h-full cursor-pointer"
              >
                <img
                  src={item}
                  alt={`Réalisation ${startIndex + index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <ExternalLink className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ) : (
              <button
                onClick={() => onItemClick?.(item, startIndex + index)}
                className="w-full h-full cursor-pointer relative"
              >
                {item.includes('youtube') || item.includes('youtu.be') ? (
                  <img
                    src={`https://img.youtube.com/vi/${item.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)?.[1]}/mqdefault.jpg`}
                    alt={`Vidéo ${startIndex + index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : item.startsWith('blob:') ? (
                  <video src={item} className="w-full h-full object-cover" muted />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">Vidéo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
                    <svg className="h-8 w-8 text-primary ml-1" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </button>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            className="h-8 w-8 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentPage
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            className="h-8 w-8 rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
