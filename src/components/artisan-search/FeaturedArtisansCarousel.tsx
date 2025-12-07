import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star, MapPin, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FeaturedArtisan {
  id: number;
  name: string;
  profession: string;
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  experience: string;
  hourlyRate: string;
  profileImage: string;
  portfolio: string[];
}

const featuredArtisansData: FeaturedArtisan[] = [
  {
    id: 1,
    name: "Jean-Pierre Martin",
    profession: "Plombier",
    location: "Paris 15ème",
    rating: 4.9,
    reviews: 127,
    verified: true,
    experience: "15 ans",
    hourlyRate: "45€",
    profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 2,
    name: "Marc Dubois",
    profession: "Électricien",
    location: "Lyon 6ème",
    rating: 4.8,
    reviews: 89,
    verified: true,
    experience: "12 ans",
    hourlyRate: "50€",
    profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 3,
    name: "Sophie Laurent",
    profession: "Peintre",
    location: "Marseille",
    rating: 4.9,
    reviews: 156,
    verified: true,
    experience: "10 ans",
    hourlyRate: "40€",
    profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 4,
    name: "Pierre Lefebvre",
    profession: "Chauffagiste",
    location: "Bordeaux",
    rating: 4.7,
    reviews: 98,
    verified: true,
    experience: "8 ans",
    hourlyRate: "55€",
    profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 5,
    name: "Marie Dupont",
    profession: "Menuisier",
    location: "Nantes",
    rating: 4.8,
    reviews: 112,
    verified: true,
    experience: "14 ans",
    hourlyRate: "52€",
    profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 6,
    name: "Lucas Bernard",
    profession: "Carreleur",
    location: "Toulouse",
    rating: 4.9,
    reviews: 134,
    verified: true,
    experience: "11 ans",
    hourlyRate: "48€",
    profileImage: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 7,
    name: "Emma Moreau",
    profession: "Serrurier",
    location: "Nice",
    rating: 4.6,
    reviews: 67,
    verified: true,
    experience: "6 ans",
    hourlyRate: "50€",
    profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 8,
    name: "Thomas Petit",
    profession: "Maçon",
    location: "Strasbourg",
    rating: 4.8,
    reviews: 89,
    verified: true,
    experience: "9 ans",
    hourlyRate: "47€",
    profileImage: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 9,
    name: "Camille Roux",
    profession: "Plombier",
    location: "Montpellier",
    rating: 4.7,
    reviews: 78,
    verified: true,
    experience: "7 ans",
    hourlyRate: "44€",
    profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 10,
    name: "Antoine Girard",
    profession: "Électricien",
    location: "Lille",
    rating: 4.9,
    reviews: 145,
    verified: true,
    experience: "13 ans",
    hourlyRate: "53€",
    profileImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 11,
    name: "Julie Fontaine",
    profession: "Peintre",
    location: "Rennes",
    rating: 4.8,
    reviews: 91,
    verified: true,
    experience: "10 ans",
    hourlyRate: "42€",
    profileImage: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop",
    ],
  },
  {
    id: 12,
    name: "Nicolas Lambert",
    profession: "Chauffagiste",
    location: "Grenoble",
    rating: 4.7,
    reviews: 73,
    verified: true,
    experience: "8 ans",
    hourlyRate: "54€",
    profileImage: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop&crop=face",
    portfolio: [
      "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop",
    ],
  },
];

const FeaturedArtisansCarousel = () => {
  const [startIndex, setStartIndex] = useState(0);
  const itemsPerView = 3;
  const maxIndex = Math.ceil(featuredArtisansData.length / itemsPerView) - 1;

  const nextSlide = () => {
    setStartIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setStartIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const visibleArtisans = featuredArtisansData.slice(
    startIndex * itemsPerView,
    startIndex * itemsPerView + itemsPerView
  );

  return (
    <div className="relative">
      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
      >
        <ChevronLeft className="w-5 h-5 text-foreground" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card shadow-lg flex items-center justify-center hover:bg-muted transition-colors"
      >
        <ChevronRight className="w-5 h-5 text-foreground" />
      </button>

      {/* Carousel Content */}
      <div className="overflow-hidden px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={startIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {visibleArtisans.map((artisan) => (
              <FeaturedArtisanCard key={artisan.id} artisan={artisan} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
          <button
            key={index}
            onClick={() => setStartIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === startIndex ? "bg-gold w-6" : "bg-border"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const FeaturedArtisanCard = ({ artisan }: { artisan: FeaturedArtisan }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev + 1) % artisan.portfolio.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide((prev) => (prev - 1 + artisan.portfolio.length) % artisan.portfolio.length);
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
        <button
          onClick={prevSlide}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {artisan.portfolio.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentSlide(index);
              }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentSlide 
                  ? "bg-card w-4" 
                  : "bg-card/60"
              }`}
            />
          ))}
        </div>

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
            className="w-12 h-12 rounded-full object-cover border-2 border-gold"
          />
          <div className="flex-1 min-w-0">
            <Link to={`/artisan/${artisan.id}`}>
              <h3 className="font-semibold text-foreground hover:text-gold transition-colors truncate">
                {artisan.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground">{artisan.profession}</p>
          </div>
          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg">
            <Star className="w-4 h-4 fill-gold text-gold" />
            <span className="font-semibold text-foreground">{artisan.rating}</span>
          </div>
        </div>

        {/* Location & Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{artisan.location}</span>
          </div>
          <span>•</span>
          <span>{artisan.experience}</span>
          <span>•</span>
          <span className="text-gold font-medium">{artisan.hourlyRate}/h</span>
        </div>

        <Button variant="gold" className="w-full" asChild>
          <Link to={`/artisan/${artisan.id}`}>Voir le profil</Link>
        </Button>
      </div>
    </div>
  );
};

export default FeaturedArtisansCarousel;
