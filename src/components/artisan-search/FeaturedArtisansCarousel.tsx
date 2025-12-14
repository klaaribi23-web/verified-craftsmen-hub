import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, MapPin, CheckCircle2 } from "lucide-react";
import { useFeaturedArtisans } from "@/hooks/usePublicData";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedArtisan {
  id: string;
  slug: string | null;
  name: string;
  profession: string;
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  experience: string;
  profileImage: string;
  portfolio: string[];
}

const FeaturedArtisansCarousel = () => {
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
  const { data: artisansData, isLoading } = useFeaturedArtisans();

  // Transform DB data to display format
  const featuredArtisansData: FeaturedArtisan[] = (artisansData || []).map(artisan => ({
    id: artisan.id,
    slug: artisan.slug,
    name: artisan.business_name,
    profession: artisan.category?.name || "Artisan",
    location: artisan.city,
    rating: artisan.rating || 0,
    reviews: artisan.review_count || 0,
    verified: artisan.is_verified || false,
    experience: artisan.experience_years ? `${artisan.experience_years} ans` : "N/A",
    profileImage: artisan.photo_url || "/favicon.png",
    portfolio: artisan.portfolio_images?.length ? artisan.portfolio_images : ["/favicon.png"]
  }));

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className={`bg-card rounded-2xl shadow-soft border border-border overflow-hidden ${i > 1 ? 'hidden md:block' : ''}`}>
            <Skeleton className="h-48 w-full" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (featuredArtisansData.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Aucun artisan recommandé pour le moment
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      {featuredArtisansData.length > 1 && (
        <>
          <button 
            onClick={scrollPrev} 
            className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors touch-manipulation"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
          </button>
          <button 
            onClick={scrollNext} 
            className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors touch-manipulation"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
          </button>
        </>
      )}

      {/* Embla Carousel */}
      <div className="overflow-hidden px-4 md:px-2" ref={emblaRef}>
        <div className="flex -ml-4">
          {featuredArtisansData.map(artisan => (
            <div 
              key={artisan.id} 
              className="flex-[0_0_100%] md:flex-[0_0_33.333%] min-w-0 pl-4"
            >
              <FeaturedArtisanCard artisan={artisan} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      {scrollSnaps.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {scrollSnaps.map((_, index) => (
            <button 
              key={index} 
              onClick={() => scrollTo(index)} 
              className={`h-2 rounded-full transition-all touch-manipulation ${
                index === selectedIndex ? "bg-gold w-6" : "bg-border w-2"
              }`}
              aria-label={`Page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FeaturedArtisanCard = ({ artisan }: { artisan: FeaturedArtisan }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentSlide, setCurrentSlide] = useState(0);

  const scrollPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentSlide(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="bg-card rounded-2xl shadow-soft border border-border hover:shadow-elevated transition-shadow overflow-hidden">
      {/* Portfolio Carousel with swipe */}
      <div className="relative h-48 overflow-hidden group" ref={emblaRef}>
        <div className="flex h-full">
          {artisan.portfolio.map((img, index) => (
            <div key={index} className="flex-[0_0_100%] min-w-0 h-full">
              <img 
                src={img} 
                alt={`Réalisation ${index + 1}`} 
                className="w-full h-full object-cover" 
              />
            </div>
          ))}
        </div>
        
        {/* Carousel Controls */}
        {artisan.portfolio.length > 1 && (
          <>
            <button 
              onClick={scrollPrev} 
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card touch-manipulation"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button 
              onClick={scrollNext} 
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card touch-manipulation"
              aria-label="Image suivante"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {artisan.portfolio.map((_, index) => (
                <button 
                  key={index} 
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    emblaApi?.scrollTo(index);
                  }} 
                  className={`w-2 h-2 rounded-full transition-all touch-manipulation ${
                    index === currentSlide ? "bg-card w-4" : "bg-card/60"
                  }`}
                  aria-label={`Image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Verified Badge */}
        {artisan.verified && (
          <div className="absolute top-2 right-2 bg-success text-success-foreground text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Vérifié
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Profile Row */}
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={artisan.profileImage} 
            alt={artisan.name} 
            className="w-12 h-12 rounded-full object-cover border-2 border-gold flex-shrink-0" 
          />
          <div className="flex-1 min-w-0">
            <Link to={`/artisan/${artisan.slug || artisan.id}`}>
              <h3 className="font-semibold text-foreground hover:text-gold transition-colors truncate">
                {artisan.name}
              </h3>
            </Link>
          </div>
          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg flex-shrink-0">
            <Star className="w-4 h-4 fill-gold text-gold" />
            <span className="font-semibold text-foreground">{artisan.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Location & Info */}
        <div className="flex items-center gap-2 md:gap-4 mb-4 text-sm text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{artisan.location}</span>
          </div>
          <span className="hidden md:inline">•</span>
          <span className="text-xs md:text-sm">{artisan.experience} d'exp.</span>
        </div>

        <Button variant="gold" className="w-full h-11" asChild>
          <Link to={`/artisan/${artisan.slug || artisan.id}`}>Voir le profil</Link>
        </Button>
      </div>
    </div>
  );
};

export default FeaturedArtisansCarousel;
