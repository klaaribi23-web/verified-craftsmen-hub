import { useState, useCallback, useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSimilarArtisans } from "@/hooks/usePublicData";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import ArtisanCard from "@/components/artisan-search/ArtisanCard";

interface SimilarArtisansCarouselProps {
  currentArtisanId: string;
  categoryId: string | null;
  trade: string;
}

const SimilarArtisansCarousel = ({ currentArtisanId, categoryId, trade }: SimilarArtisansCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  
  const { data: allSimilarArtisans = [], isLoading } = useSimilarArtisans(categoryId, currentArtisanId);

  // Filter out artisans with rating 0
  const similarArtisans = allSimilarArtisans.filter(a => (a.rating || 0) > 0);

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

        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex -ml-4">
            {similarArtisans.map((artisan) => (
              <div 
                key={artisan.id} 
                className="flex-[0_0_100%] sm:flex-[0_0_33.333%] lg:flex-[0_0_25%] min-w-0 pl-4"
              >
                <ArtisanCard
                  id={artisan.id}
                  slug={artisan.slug}
                  name={artisan.business_name}
                  profession={artisan.category?.name || trade}
                  location={artisan.city}
                  rating={artisan.rating || 0}
                  reviews={artisan.review_count || 0}
                  verified={artisan.is_verified || false}
                  experience={artisan.experience_years ? `${artisan.experience_years} ans` : ""}
                  profileImage={artisan.photo_url || undefined}
                  portfolio={artisan.portfolio_images || undefined}
                  portfolioVideos={artisan.portfolio_videos || undefined}
                  subscriptionTier={artisan.subscription_tier}
                  isAudited={artisan.is_audited}
                  availableUrgent={artisan.available_urgent}
                  isRge={artisan.is_rge}
                />
              </div>
            ))}
          </div>
        </div>

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
