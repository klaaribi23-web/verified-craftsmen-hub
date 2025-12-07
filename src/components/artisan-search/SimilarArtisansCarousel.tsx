import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, ChevronLeft, ChevronRight, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SimilarArtisan {
  id: number;
  name: string;
  profession: string;
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  photo: string;
  hourlyRate: string;
}

interface SimilarArtisansCarouselProps {
  currentArtisanId?: string;
  trade: string;
}

const similarArtisansData: SimilarArtisan[] = [
  { id: 101, name: "Michel Dubois", profession: "Plombier", location: "Paris 14ème", rating: 4.7, reviews: 89, verified: true, photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face", hourlyRate: "45€" },
  { id: 102, name: "Sophie Bernard", profession: "Plombier", location: "Paris 16ème", rating: 4.9, reviews: 134, verified: true, photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face", hourlyRate: "52€" },
  { id: 103, name: "François Leroy", profession: "Plombier", location: "Boulogne-Billancourt", rating: 4.6, reviews: 67, verified: true, photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face", hourlyRate: "48€" },
  { id: 104, name: "Anne Moreau", profession: "Plombier", location: "Issy-les-Moulineaux", rating: 4.8, reviews: 112, verified: true, photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face", hourlyRate: "50€" },
  { id: 105, name: "Laurent Petit", profession: "Plombier", location: "Paris 17ème", rating: 4.5, reviews: 45, verified: true, photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face", hourlyRate: "42€" },
  { id: 106, name: "Claire Fontaine", profession: "Plombier", location: "Vanves", rating: 4.7, reviews: 78, verified: true, photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face", hourlyRate: "47€" },
  { id: 107, name: "Pierre Martin", profession: "Plombier", location: "Paris 12ème", rating: 4.9, reviews: 156, verified: true, photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face", hourlyRate: "55€" },
  { id: 108, name: "Marie Lambert", profession: "Plombier", location: "Montrouge", rating: 4.6, reviews: 91, verified: true, photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face", hourlyRate: "49€" },
];

const ITEMS_PER_PAGE = 4;

const SimilarArtisansCarousel = ({ currentArtisanId, trade }: SimilarArtisansCarouselProps) => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const totalSlides = Math.ceil(similarArtisansData.length / ITEMS_PER_PAGE);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const visibleArtisans = similarArtisansData.slice(
    currentSlide * ITEMS_PER_PAGE,
    (currentSlide + 1) * ITEMS_PER_PAGE
  );

  const handleViewProfile = (id: number) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/artisan/${id}`);
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

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Artisans similaires
          </h2>
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
                  onClick={() => handleViewProfile(artisan.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                          <AvatarImage src={artisan.photo} alt={artisan.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {artisan.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {artisan.verified && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                            <Shield className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{artisan.name}</h3>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {artisan.profession}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{artisan.location}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {renderStars(artisan.rating)}
                        <span className="text-sm font-medium ml-1">{artisan.rating}</span>
                        <span className="text-xs text-muted-foreground">({artisan.reviews})</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">{artisan.hourlyRate}/h</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dots */}
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
      </div>
    </section>
  );
};

export default SimilarArtisansCarousel;
