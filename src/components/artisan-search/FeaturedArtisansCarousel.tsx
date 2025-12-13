import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, MapPin, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFeaturedArtisans } from "@/hooks/usePublicData";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [startIndex, setStartIndex] = useState(0);
  const { data: artisansData, isLoading } = useFeaturedArtisans();
  const isMobile = useIsMobile();
  
  const itemsPerView = isMobile ? 1 : 3;

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
    profileImage: artisan.photo_url || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    portfolio: artisan.portfolio_images?.length ? artisan.portfolio_images : ["https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop"]
  }));

  const maxIndex = Math.max(0, Math.ceil(featuredArtisansData.length / itemsPerView) - 1);
  
  const nextSlide = () => {
    setStartIndex(prev => prev >= maxIndex ? 0 : prev + 1);
  };
  
  const prevSlide = () => {
    setStartIndex(prev => prev <= 0 ? maxIndex : prev - 1);
  };

  const visibleArtisans = featuredArtisansData.slice(
    startIndex * itemsPerView, 
    startIndex * itemsPerView + itemsPerView
  );

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
      {/* Navigation Buttons - Always visible on mobile for touch */}
      {featuredArtisansData.length > itemsPerView && (
        <>
          <button 
            onClick={prevSlide} 
            className="absolute -left-2 md:-left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors touch-manipulation"
            aria-label="Précédent"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
          </button>
          <button 
            onClick={nextSlide} 
            className="absolute -right-2 md:-right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors touch-manipulation"
            aria-label="Suivant"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-foreground" />
          </button>
        </>
      )}

      {/* Carousel Content */}
      <div className="overflow-hidden px-4 md:px-2">
        <AnimatePresence mode="wait">
          <motion.div 
            key={startIndex} 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -50 }} 
            transition={{ duration: 0.3 }} 
            className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6"
          >
            {visibleArtisans.map(artisan => (
              <FeaturedArtisanCard key={artisan.id} artisan={artisan} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Indicator */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button 
              key={index} 
              onClick={() => setStartIndex(index)} 
              className={`h-2 rounded-full transition-all touch-manipulation ${
                index === startIndex ? "bg-gold w-6" : "bg-border w-2"
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
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(prev => (prev + 1) % artisan.portfolio.length);
  };
  
  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(prev => (prev - 1 + artisan.portfolio.length) % artisan.portfolio.length);
  };

  return (
    <div className="bg-card rounded-2xl shadow-soft border border-border hover:shadow-elevated transition-shadow overflow-hidden">
      {/* Portfolio Carousel */}
      <div className="relative h-48 overflow-hidden group">
        <img 
          src={artisan.portfolio[currentSlide]} 
          alt={`Réalisation ${currentSlide + 1}`} 
          className="w-full h-full object-cover transition-transform duration-300" 
        />
        
        {/* Carousel Controls */}
        {artisan.portfolio.length > 1 && (
          <>
            <button 
              onClick={prevSlide} 
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card touch-manipulation"
              aria-label="Image précédente"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button 
              onClick={nextSlide} 
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
                    setCurrentSlide(index);
                  }} 
                  className={`w-2 h-2 rounded-full transition-all ${
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
