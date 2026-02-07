import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Star, MapPin, CheckCircle2, Crown, Award, Medal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
interface CategoryArtisansCarouselProps {
  categoryName: string;
  title: string;
  subtitle?: string;
}

interface ArtisanData {
  id: string;
  slug: string | null;
  business_name: string;
  city: string;
  rating: number | null;
  review_count: number | null;
  is_verified: boolean | null;
  experience_years: number | null;
  photo_url: string | null;
  portfolio_images: string[] | null;
  subscription_tier: string | null;
  category: { name: string } | null;
}

const CategoryArtisansCarousel = ({ categoryName, title, subtitle }: CategoryArtisansCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': { slidesToScroll: 4 }
    }
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const { data: artisans, isLoading } = useQuery({
    queryKey: ['category-artisans', categoryName],
    queryFn: async () => {
      // First get the category ID
      const { data: category } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', categoryName)
        .single();

      if (!category) return [];

      // Get artisans in this category
      const { data: artisanCategories } = await supabase
        .from('artisan_categories')
        .select('artisan_id')
        .eq('category_id', category.id);

      if (!artisanCategories || artisanCategories.length === 0) return [];

      const artisanIds = artisanCategories.map(ac => ac.artisan_id);

      // Get artisan details
      const { data, error } = await supabase
        .from('public_artisans')
        .select(`
          id,
          slug,
          business_name,
          city,
          rating,
          review_count,
          is_verified,
          experience_years,
          photo_url,
          portfolio_images,
          subscription_tier,
          category_id
        `)
        .in('id', artisanIds)
        .in('status', ['active', 'prospect'])
        .order('display_priority', { ascending: true })
        .limit(12);

      if (error) throw error;

      // Get category names
      const categoryIds = [...new Set(data?.map(a => a.category_id).filter(Boolean))];
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIds);

      const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);

      return (data || []).map(artisan => ({
        ...artisan,
        category: artisan.category_id ? { name: categoryMap.get(artisan.category_id) || categoryName } : { name: categoryName }
      })) as ArtisanData[];
    }
  });

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
      <section className="py-12 md:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-64 mx-auto mb-2" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`bg-card rounded-2xl shadow-soft border border-border overflow-hidden ${i > 1 ? 'hidden md:block' : ''}`}>
                <Skeleton className="h-40 w-full" />
                <div className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-14" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!artisans || artisans.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-xl md:text-3xl font-bold text-foreground mb-2">{title}</h2>
          {subtitle && (
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              {subtitle}
            </p>
          )}
        </motion.div>

        <div className="relative">
          {/* Navigation Buttons */}
          {artisans.length > 4 && (
            <>
              <button 
                onClick={scrollPrev} 
                className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors touch-manipulation"
                aria-label="Précédent"
              >
                <ChevronLeft className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
              </button>
              <button 
                onClick={scrollNext} 
                className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors touch-manipulation"
                aria-label="Suivant"
              >
                <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
              </button>
            </>
          )}

          {/* Embla Carousel - 4 columns on desktop */}
          <div className="overflow-hidden px-4 md:px-2" ref={emblaRef}>
            <div className="flex -ml-3 md:-ml-4">
              {artisans.map(artisan => (
                <div 
                  key={artisan.id} 
                  className="flex-[0_0_100%] md:flex-[0_0_25%] min-w-0 pl-3 md:pl-4"
                >
                  <CompactArtisanCard artisan={artisan} />
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          {scrollSnaps.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-4">
              {scrollSnaps.map((_, index) => (
                <button 
                  key={index} 
                  onClick={() => scrollTo(index)} 
                  className={`h-1.5 rounded-full transition-all touch-manipulation ${
                    index === selectedIndex ? "bg-gold w-5" : "bg-border w-1.5"
                  }`}
                  aria-label={`Page ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

interface CompactArtisanCardProps {
  artisan: ArtisanData;
}

const CompactArtisanCard = ({ artisan }: CompactArtisanCardProps) => {
  const isPaid = artisan.subscription_tier && artisan.subscription_tier !== "free";

  const getBadgeConfig = () => {
    if (isPaid) {
      return {
        show: true,
        icon: Crown,
        label: "Artisan Validé",
        gradient: "from-primary via-primary/80 to-primary",
      };
    }
    return { show: false };
  };

  const badgeConfig = getBadgeConfig();
  const portfolioImage = artisan.portfolio_images?.[0] || artisan.photo_url || "/favicon.png";

  return (
    <Link to={`/artisan/${artisan.slug || artisan.id}`}>
      <div className="bg-card rounded-xl shadow-soft border border-border hover:shadow-elevated transition-shadow overflow-hidden cursor-pointer h-full">
        {/* Image */}
        <div className="relative h-36 md:h-40 overflow-hidden">
          <img 
            src={portfolioImage} 
            alt={artisan.business_name} 
            className="w-full h-full object-cover" 
          />
          
          {/* Subscription Badge */}
          {badgeConfig.show && badgeConfig.icon && (
            <div className="absolute top-2 left-2 z-10">
              <div className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-semibold shadow-lg bg-gradient-to-r",
                badgeConfig.gradient
              )}>
                <badgeConfig.icon className="w-3 h-3" />
                <span>{badgeConfig.label}</span>
              </div>
            </div>
          )}

          {/* Verified Badge */}
          {artisan.is_verified && (
            <div className="absolute top-2 right-2 bg-success text-success-foreground text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Vérifié</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-sm sm:text-base truncate mb-1">
            {artisan.business_name}
          </h3>
          
          <Badge variant="secondary" className="text-xs mb-2">
            {artisan.category?.name || "Artisan"}
          </Badge>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{artisan.city}</span>
          </div>
          
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < Math.floor(artisan.rating || 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                )}
              />
            ))}
            <span className="text-xs font-medium ml-1">
              {(artisan.rating || 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
export default CategoryArtisansCarousel;