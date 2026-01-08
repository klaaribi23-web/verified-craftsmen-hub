import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, ChevronLeft, ChevronRight, Shield, Crown, Award, Medal } from "lucide-react";
import { useSimilarArtisans } from "@/hooks/usePublicData";
import { cn } from "@/lib/utils";

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
    breakpoints: {
      '(min-width: 640px)': { slidesToScroll: 2 },
      '(min-width: 1024px)': { slidesToScroll: 4 }
    }
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
        className={`h-3 w-3 ${
          i < Math.floor(rating)
            ? "fill-amber-400 text-amber-400"
            : "text-muted-foreground/30"
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8">
            Artisans similaires
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-40 bg-muted" />
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
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Artisans similaires
          </h2>
          {similarArtisans.length > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                className="h-10 w-10 rounded-full touch-manipulation"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNext}
                className="h-10 w-10 rounded-full touch-manipulation"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Embla Carousel with swipe */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-6">
            {similarArtisans.map((artisan) => (
              <div 
                key={artisan.id} 
                className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_25%] min-w-0 pl-6"
              >
                {(() => {
                  const isElite = artisan.subscription_tier === "elite";
                  const isPro = artisan.subscription_tier === "pro";
                  const isEssential = artisan.subscription_tier === "essential";

                  const getBadgeConfig = () => {
                    if (isElite) {
                      return {
                        show: true,
                        icon: Crown,
                        label: "Elite",
                        gradient: "from-yellow-500 via-amber-400 to-yellow-500",
                        borderClass: "border-yellow-500/50 ring-2 ring-yellow-500/30 animate-glow-pulse"
                      };
                    }
                    if (isPro) {
                      return {
                        show: true,
                        icon: Award,
                        label: "Premium",
                        gradient: "from-slate-400 via-slate-300 to-slate-400",
                        borderClass: "border-slate-400/50 ring-1 ring-slate-400/20"
                      };
                    }
                    if (isEssential) {
                      return {
                        show: true,
                        icon: Medal,
                        label: "Pro",
                        gradient: "from-amber-700 via-amber-600 to-amber-700",
                        borderClass: "border-amber-600/50 ring-1 ring-amber-600/20"
                      };
                    }
                    return { show: false, borderClass: "" };
                  };

                  const badgeConfig = getBadgeConfig();
                  const BadgeIcon = badgeConfig.icon;

                  return (
                    <Card 
                      className={cn(
                        "overflow-hidden hover:shadow-xl transition-shadow cursor-pointer h-full",
                        badgeConfig.borderClass
                      )}
                      onClick={() => handleViewProfile(artisan.slug || artisan.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="relative">
                            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                              <AvatarImage src={artisan.photo_url || "/favicon.png"} alt={artisan.business_name} />
                              <AvatarFallback className="bg-muted">
                                <img src="/favicon.png" alt="Artisans Validés" className="h-full w-full object-contain" />
                              </AvatarFallback>
                            </Avatar>
                            {artisan.is_verified && (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                                <Shield className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-foreground truncate">{artisan.business_name}</h3>
                              {badgeConfig.show && BadgeIcon && (
                                <div className={cn(
                                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-white text-[10px] font-semibold bg-gradient-to-r",
                                  badgeConfig.gradient
                                )}>
                                  <BadgeIcon className="w-2.5 h-2.5" />
                                  <span>{badgeConfig.label}</span>
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs mt-1">
                              {artisan.category?.name || trade}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{artisan.city}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {renderStars(artisan.rating || 0)}
                            <span className="text-sm font-medium ml-1">{artisan.rating?.toFixed(1) || "0.0"}</span>
                            <span className="text-xs text-muted-foreground">({artisan.review_count || 0})</span>
                          </div>
                          {artisan.hourly_rate && (
                            <span className="text-sm font-semibold text-primary">{artisan.hourly_rate}€/h</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        {scrollSnaps.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {scrollSnaps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => scrollTo(idx)}
                className={`w-2 h-2 rounded-full transition-colors touch-manipulation ${
                  idx === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default SimilarArtisansCarousel;
