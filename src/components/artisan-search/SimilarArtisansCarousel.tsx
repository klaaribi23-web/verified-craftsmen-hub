import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSimilarArtisans } from "@/hooks/usePublicData";

interface SimilarArtisansCarouselProps {
  currentArtisanId: string;
  categoryId: string | null;
  trade: string;
}

const ITEMS_PER_PAGE = 4;

const SimilarArtisansCarousel = ({ currentArtisanId, categoryId, trade }: SimilarArtisansCarouselProps) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { data: similarArtisans = [], isLoading } = useSimilarArtisans(categoryId, currentArtisanId);

  const totalSlides = Math.max(1, Math.ceil(similarArtisans.length / ITEMS_PER_PAGE));

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const visibleArtisans = similarArtisans.slice(
    currentSlide * ITEMS_PER_PAGE,
    (currentSlide + 1) * ITEMS_PER_PAGE
  );

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
          {totalSlides > 1 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
                className="h-10 w-10 rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
                className="h-10 w-10 rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {visibleArtisans.map((artisan) => (
                <Card 
                  key={artisan.id} 
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => handleViewProfile(artisan.slug || artisan.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                          <AvatarImage src={artisan.photo_url || undefined} alt={artisan.business_name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {artisan.business_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        {artisan.is_verified && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                            <Shield className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{artisan.business_name}</h3>
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
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
        {totalSlides > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentSlide ? "bg-primary" : "bg-muted-foreground/30"
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