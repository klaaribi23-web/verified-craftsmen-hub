import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Star, CheckCircle2, ChevronLeft, ChevronRight, Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePublicArtisanStories } from "@/hooks/usePublicArtisanStories";
import { cn } from "@/lib/utils";
import StoryViewer from "@/components/stories/StoryViewer";

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
  const [isLoading, setIsLoading] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const artisanId = typeof id === "string" ? id : id.toString();
  const { stories, hasActiveStories } = usePublicArtisanStories(artisanId);

  // Use slug for URL, fallback to id
  const artisanUrl = slug || id;

  // Use provided portfolio or fallback to defaults
  const portfolioImages = portfolio && portfolio.length > 0 ? portfolio : defaultPortfolios[profession] || defaultPortfolios["Plombier"];
  const numericId = typeof id === "string" ? parseInt(id.slice(0, 8), 16) : id;
  const defaultProfileImage = profileImages[numericId % profileImages.length];

  // Check if artisan is already in favorites on mount
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return;

      try {
        // Get user's profile ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!profile) return;

        // Check if this artisan is in favorites
        const { data: favorite } = await supabase
          .from("client_favorites")
          .select("id")
          .eq("client_id", profile.id)
          .eq("artisan_id", artisanId)
          .maybeSingle();

        setIsFavorite(!!favorite);
      } catch (error) {
        console.error("Error checking favorite:", error);
      }
    };

    checkFavorite();
  }, [user, artisanId]);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !user) {
      toast.error("Connectez-vous pour ajouter des favoris");
      navigate("/auth");
      return;
    }

    setIsLoading(true);

    try {
      // Get user's profile ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile) {
        toast.error("Erreur lors de la récupération du profil");
        setIsLoading(false);
        return;
      }

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from("client_favorites")
          .delete()
          .eq("client_id", profile.id)
          .eq("artisan_id", artisanId);

        if (error) throw error;

        setIsFavorite(false);
        toast.info("Artisan retiré de vos favoris");
      } else {
        // Add to favorites
        const { error } = await supabase
          .from("client_favorites")
          .insert({
            client_id: profile.id,
            artisan_id: artisanId
          });

        if (error) throw error;

        setIsFavorite(true);
        toast.success("Artisan ajouté à vos favoris");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast.error("Erreur lors de la mise à jour des favoris");
    } finally {
      setIsLoading(false);
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

  return (
    <div className="bg-card rounded-2xl shadow-soft border border-border hover:shadow-elevated transition-shadow overflow-hidden">
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
          {portfolioImages.map((_, index) => (
            <button 
              key={index} 
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentSlide(index);
              }} 
              className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentSlide ? "bg-card w-4" : "bg-card/60"}`} 
            />
          ))}
        </div>

        {/* Verified Badge */}
        {verified && (
          <div className="absolute top-2 right-12 bg-success text-success-foreground text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Vérifié
          </div>
        )}

        {/* Favorite Button */}
        <button 
          onClick={handleFavoriteClick} 
          disabled={isLoading}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFavorite ? "bg-red-500 text-white" : "bg-card/90 text-muted-foreground hover:bg-red-500 hover:text-white"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Profile Row */}
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={profileImage || defaultProfileImage} 
            alt={name} 
            onClick={(e) => {
              if (hasActiveStories) {
                e.preventDefault();
                e.stopPropagation();
                setStoryViewerOpen(true);
              }
            }}
            className={cn(
              "w-12 h-12 rounded-full object-cover border-2",
              hasActiveStories 
                ? "border-green-500 cursor-pointer animate-story-pulse" 
                : "border-gold"
            )} 
          />
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

      {/* Story Viewer */}
      <StoryViewer
        stories={stories}
        artisanName={name}
        artisanPhoto={profileImage || defaultProfileImage}
        isOpen={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
      />
    </div>
  );
};

export default ArtisanCard;
