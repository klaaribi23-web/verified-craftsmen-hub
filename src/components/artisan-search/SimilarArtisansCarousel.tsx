import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, ChevronLeft, ChevronRight, Shield, Crown, Award, Gem } from "lucide-react";
import { useSimilarArtisans } from "@/hooks/usePublicData";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SimilarArtisansCarouselProps {
  currentArtisanId: string;
  categoryId: string | null;
  trade: string;
}

const SimilarArtisansCarousel = ({ currentArtisanId, categoryId, trade }: SimilarArtisansCarouselProps) => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  
  const { data: similarArtisans = [], isLoading } = useSimilarArtisans(categoryId, currentArtisanId);

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

  const handleViewProfile = (slugOrId: string) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/artisan/${slugOrId}`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3 w-3",
          i < Math.floor(rating)
            ? "fill-amber-400 text-amber-400"
            : "text-muted-foreground/30"
        )}
      />
    ));
  };

  const getSubscriptionBadge = (tier: string | null) => {
    switch (tier) {
      case 'elite':
        return { 
          show: true, 
          label: 'Elite', 
          icon: Crown, 
          gradient: 'from-amber-500 to-yellow-400',
          borderClass: 'ring-2 ring-amber-400/50'
        };
      case 'pro':
        return { 
          show: true, 
          label: 'Pro', 
          icon: Award, 
          gradient: 'from-blue-600 to-blue-400',
          borderClass: 'ring-2 ring-blue-400/50'
        };
      case 'essential':
        return { 
          show: true, 
          label: 'Essentiel', 
          icon: Gem, 
          gradient: 'from-emerald-600 to-emerald-400',
          borderClass: 'ring-2 ring-emerald-400/50'
        };
      default:
        return { show: false, label: '', icon: null, gradient: '', borderClass: '' };
    }
  };

  if (isLoading) {
    return (
      <section className="py-6 md:py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
            Artisans similaires
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-32 sm:h-40 w-full" />
                <CardContent className="p-3 sm:p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (similarArtisans.length === 0) {
    return null;
  }

  return (
    <section className="py-6 md:py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
            Artisans similaires
          </h2>
          {similarArtisans.length > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full touch-manipulation"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNext}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full touch-manipulation"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Embla Carousel - 1x1 mobile, 3x3 tablet, 4x4 desktop */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {similarArtisans.map((artisan) => {
              const badgeConfig = getSubscriptionBadge(artisan.subscription_tier);
              const BadgeIcon = badgeConfig.icon;

              return (
                <div 
                  key={artisan.id} 
                  className="flex-[0_0_100%] sm:flex-[0_0_33.333%] lg:flex-[0_0_25%] min-w-0 pl-4"
                >
                  <Card 
                    className={cn(
                      "overflow-hidden hover:shadow-xl transition-all cursor-pointer h-full",
                      badgeConfig.borderClass
                    )}
                    onClick={() => handleViewProfile(artisan.slug || artisan.id)}
                  >
                    {/* Photo en haut de la card */}
                    <div className="relative h-32 sm:h-36 lg:h-40 overflow-hidden bg-muted">
                    <img 
                      src={
                        artisan.photo_url || 
                        (artisan.portfolio_images && artisan.portfolio_images.length > 0 
                          ? artisan.portfolio_images[0] 
                          : "/placeholder.svg")
                      } 
                      alt={artisan.business_name || "Artisan"}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                      {/* Badge abonnement en overlay */}
                      {badgeConfig.show && BadgeIcon && (
                        <div className={cn(
                          "absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-white text-xs font-semibold bg-gradient-to-r shadow-lg",
                          badgeConfig.gradient
                        )}>
                          <BadgeIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">{badgeConfig.label}</span>
                        </div>
                      )}
                      {/* Badge vérifié */}
                      {artisan.is_verified && (
                        <div className="absolute bottom-2 left-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg">
                          <Shield className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-3 sm:p-4">
                      <h3 className="font-semibold text-sm sm:text-base truncate mb-1">
                        {artisan.business_name}
                      </h3>
                      
                      <Badge variant="secondary" className="text-xs mb-2">
                        {artisan.category?.name || trade}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{artisan.city}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5">
                          {renderStars(artisan.rating || 0)}
                          <span className="text-xs font-medium ml-1">
                            {artisan.rating?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                        {artisan.hourly_rate && (
                          <span className="text-xs font-semibold text-primary">
                            {artisan.hourly_rate}€/h
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dots pagination - visible on mobile */}
        {scrollSnaps.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-4 sm:mt-6">
            {scrollSnaps.slice(0, Math.min(8, scrollSnaps.length)).map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors touch-manipulation",
                  idx === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SimilarArtisansCarousel;
