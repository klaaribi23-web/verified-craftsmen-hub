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
  subscriptionTier: string | null;
}

const FeaturedArtisansCarousel = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { slidesToScroll: 4 },
    },
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const { data: artisansData, isLoading } = useFeaturedArtisans();

  // Transform DB data to display format
  const featuredArtisansData: FeaturedArtisan[] = (artisansData || []).map((artisan) => ({
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
    portfolio: artisan.portfolio_images?.length ? artisan.portfolio_images : ["/favicon.png"],
    subscriptionTier: artisan.subscription_tier || null,
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`bg-card rounded-2xl shadow-soft border border-border overflow-hidden ${i > 1 ? "hidden md:block" : ""}`}
          >
            <Skeleton className="h-44 w-full" />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-full" />
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
    return <div className="text-center py-12 text-muted-foreground">Aucun artisan recommandé pour le moment</div>;
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
          {featuredArtisansData.map((artisan) => (
            <div key={artisan.id} className="flex-[0_0_100%] md:flex-[0_0_25%] min-w-0 pl-4">
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
  const portfolioImage = artisan.portfolio[0] || artisan.profileImage || "/favicon.png";

  return (
    <Link to={`/artisan/${artisan.slug || artisan.id}`}>
      <div className="bg-card rounded-xl shadow-soft border border-border hover:shadow-elevated transition-shadow overflow-hidden cursor-pointer">
        {/* Image */}
        <div className="relative h-36 md:h-40 overflow-hidden">
          <img src={portfolioImage} alt={artisan.name} className="w-full h-full object-cover" />

          {/* Artisan Validé Badge - only for subscribers */}
          {(artisan.subscriptionTier === "artisan_valide" || artisan.subscriptionTier === "boost_annuel") && (
            <div className="absolute top-2 left-2 z-10">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shadow-lg bg-success text-success-foreground">
                <CheckCircle2 className="w-3 h-3" />
                <span>Artisan Validé</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base truncate mb-1">{artisan.name}</h3>

          <div className="inline-block bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full mb-2">
            {artisan.profession}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{artisan.location}</span>
          </div>

          {/* Rating */}
          {artisan.rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-gold text-gold" />
              <span className="text-xs font-semibold">{artisan.rating.toFixed(1)}</span>
              {artisan.reviews > 0 && <span className="text-xs text-muted-foreground">({artisan.reviews} avis)</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
export default FeaturedArtisansCarousel;