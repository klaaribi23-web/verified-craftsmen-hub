import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { optimizeImageUrl } from "@/lib/utils";

interface PortfolioCarouselProps {
  items: string[];
  type: "image" | "video";
  onItemClick?: (item: string, index: number) => void;
  artisanContext?: {
    businessName: string;
    city: string;
    category?: string;
    department?: string;
  };
}

export const PortfolioCarousel = ({ items, type, onItemClick, artisanContext }: PortfolioCarouselProps) => {
  const getAltText = (index: number) => {
    if (!artisanContext) return type === "image" ? `Réalisation ${index + 1}` : `Vidéo ${index + 1}`;
    const { businessName, category, city, department } = artisanContext;
    const deptSuffix = department ? ` (${department})` : "";
    if (type === "image") {
      return `${category || "Travaux"} par ${businessName} à ${city}${deptSuffix} - Réalisation ${index + 1}`;
    }
    return `Vidéo ${category || "chantier"} par ${businessName} à ${city}${deptSuffix}`;
  };
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 3 }
    }
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi?.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (items.length === 0) return null;

  return (
    <div className="relative">
      {/* Embla Carousel with swipe */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-3">
          {items.map((item, index) => (
            <div 
              key={index} 
              className="flex-[0_0_100%] md:flex-[0_0_33.333%] min-w-0 pl-3"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden group shadow-md hover:shadow-[0_4px_20px_rgba(212,175,55,0.3)] transition-shadow duration-300">
                {type === "image" ? (
                  <button
                    onClick={() => onItemClick?.(item, index)}
                    className="w-full h-full cursor-pointer"
                  >
                    <img
                      src={optimizeImageUrl(item, 'large')}
                      alt={getAltText(index)}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ExternalLink className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Label Réalisation Élite */}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-primary/30">
                      ✦ Réalisation Élite
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={() => onItemClick?.(item, index)}
                    className="w-full h-full cursor-pointer relative"
                  >
                    {item.includes('youtube') || item.includes('youtu.be') ? (
                      <img
                        src={`https://img.youtube.com/vi/${item.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)?.[1]}/mqdefault.jpg`}
                        alt={getAltText(index)}
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
            </div>
          ))}
        </div>
      </div>

      {scrollSnaps.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="icon"
            onClick={scrollPrev}
            className="h-8 w-8 rounded-full touch-manipulation"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            {scrollSnaps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2 w-2 rounded-full transition-colors touch-manipulation ${
                  index === selectedIndex
                    ? "bg-primary"
                    : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={scrollNext}
            className="h-8 w-8 rounded-full touch-manipulation"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
