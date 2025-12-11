import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Star, CheckCircle2, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { toast } from "sonner";
interface ArtisanCardProps {
  id: string | number;
  slug?: string | null;
  name: string;
  profession: string;
  location: string;
  rating: number;
  reviews: number;
  verified: boolean;
  experience: string;
  profileImage?: string;
  portfolio?: string[];
}

// Sample portfolio images for demo
const defaultPortfolios: Record<string, string[]> = {
  "Plombier": ["https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"],
  "Électricien": ["https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1545259741-2ea3ebf61fa3?w=400&h=300&fit=crop"],
  "Peintre": ["https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"],
  "Chauffagiste": ["https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1581092921461-39b14e4fec0e?w=400&h=300&fit=crop"],
  "Serrurier": ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1581092921461-39b14e4fec0e?w=400&h=300&fit=crop"],
  "Maçon": ["https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"],
  "Menuisier": ["https://images.unsplash.com/photo-1622021142947-da7dedc7c39a?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1588854337115-1c67d9247e4d?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"],
  "Carreleur": ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop"]
};

// Sample profile images
const profileImages = ["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face", "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face", "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face"];
const ArtisanCard = ({
  id,
  slug,
  name,
  profession,
  location,
  rating,
  reviews,
  verified,
  experience,
  profileImage,
  portfolio
}: ArtisanCardProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const navigate = useNavigate();

  // Use slug for URL, fallback to id
  const artisanUrl = slug || id;

  // Use provided portfolio or fallback to defaults
  const portfolioImages = portfolio && portfolio.length > 0 ? portfolio : defaultPortfolios[profession] || defaultPortfolios["Plombier"];
  const numericId = typeof id === "string" ? parseInt(id.slice(0, 8), 16) : id;
  const defaultProfileImage = profileImages[numericId % profileImages.length];
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    if (!isFavorite) {
      toast.success("Artisan ajouté à vos favoris");
    } else {
      toast.info("Artisan retiré de vos favoris");
    }
  };
  const handleProfileClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
    navigate(`/artisan/${artisanUrl}`);
  };
  const nextSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(prev => (prev + 1) % portfolioImages.length);
  };
  const prevSlide = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentSlide(prev => (prev - 1 + portfolioImages.length) % portfolioImages.length);
  };
  return <div className="bg-card rounded-2xl shadow-soft border border-border hover:shadow-elevated transition-shadow overflow-hidden">
      {/* Portfolio Carousel */}
      <div className="relative h-48 overflow-hidden group">
        <img src={portfolioImages[currentSlide]} alt={`Réalisation ${currentSlide + 1}`} className="w-full h-full object-cover transition-transform duration-300" />
        
        {/* Carousel Controls */}
        <button onClick={prevSlide} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card">
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
        <button onClick={nextSlide} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card">
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {portfolioImages.map((_, index) => <button key={index} onClick={e => {
          e.preventDefault();
          e.stopPropagation();
          setCurrentSlide(index);
        }} className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentSlide ? "bg-card w-4" : "bg-card/60"}`} />)}
        </div>

        {/* Verified Badge */}
        {verified && <div className="absolute top-2 right-12 bg-success text-success-foreground text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Vérifié
          </div>}

        {/* Favorite Button */}
        <button onClick={handleFavoriteClick} className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFavorite ? "bg-red-500 text-white" : "bg-card/90 text-muted-foreground hover:bg-red-500 hover:text-white"}`}>
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Profile Row */}
        <div className="flex items-center gap-3 mb-3">
          <img src={profileImage || defaultProfileImage} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-gold" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link to={`/artisan/${artisanUrl}`}>
                <h3 className="font-semibold text-foreground hover:text-gold transition-colors truncate">
                  {name}
                </h3>
              </Link>
            </div>
            
          </div>
          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg">
            <Star className="w-4 h-4 fill-gold text-gold" />
            <span className="font-semibold text-foreground">{rating}</span>
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>
        </div>

        {/* Location & Info */}
        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate" title={location}>{location}</span>
          </div>
          <span className="flex-shrink-0">•</span>
          <span className="flex-shrink-0">{experience} d'expérience</span>
        </div>

        <Button variant="gold" className="w-full" onClick={handleProfileClick}>
          Voir le profil
        </Button>
      </div>
    </div>;
};
export default ArtisanCard;