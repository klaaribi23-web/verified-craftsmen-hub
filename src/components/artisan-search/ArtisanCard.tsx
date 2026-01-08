import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, Star, CheckCircle2, ChevronLeft, ChevronRight, Heart, Crown } from "lucide-react";
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
  distance?: number | null;
  subscriptionTier?: string | null;
}

// Default logo for artisans without photos
const DEFAULT_LOGO = "/favicon.png";

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
  portfolio,
  distance,
  subscriptionTier
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

  // Use provided portfolio or fallback to logo
  const portfolioImages = portfolio && portfolio.length > 0 ? portfolio : [DEFAULT_LOGO];
  const defaultProfileImage = profileImage || DEFAULT_LOGO;

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

  const isElite = subscriptionTier === "elite";

  return (
    <div className={cn(
      "bg-card rounded-2xl shadow-soft border hover:shadow-elevated transition-shadow overflow-hidden relative",
      isElite ? "border-yellow-500/50 ring-2 ring-yellow-500/30 animate-glow-pulse" : "border-border"
    )}>
      {/* Portfolio Carousel */}
      <div className="relative h-44 md:h-48 overflow-hidden group">
        {/* Elite Badge */}
        {isElite && (
          <div className="absolute top-2 left-2 z-20">
            <div className="relative flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 text-white text-xs font-semibold shadow-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
              <Crown className="w-3.5 h-3.5 relative z-10" />
              <span className="relative z-10">Elite</span>
            </div>
          </div>
        )}
        <img 
          src={portfolioImages[currentSlide]} 
          alt={`Réalisation de ${name} - Photo ${currentSlide + 1}`} 
          width={400}
          height={192}
          className="w-full h-full object-cover transition-transform duration-300" 
        />
        
        {/* Carousel Controls - Always visible on mobile for touch */}
        <button 
          onClick={prevSlide} 
          className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-card touch-manipulation"
          aria-label="Image précédente"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <button 
          onClick={nextSlide} 
          className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/90 flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-card touch-manipulation"
          aria-label="Image suivante"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
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
              className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? "bg-card w-4" : "bg-card/60"}`} 
              aria-label={`Image ${index + 1}`}
            />
          ))}
        </div>

        {/* Verified Badge */}
        {verified && (
          <div className="absolute top-2 right-14 bg-success text-success-foreground text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span className="hidden sm:inline">Vérifié</span>
          </div>
        )}

        {/* Favorite Button */}
        <button 
          onClick={handleFavoriteClick} 
          disabled={isLoading}
          className={`absolute top-2 right-2 w-10 h-10 rounded-full flex items-center justify-center transition-all touch-manipulation ${isFavorite ? "bg-red-500 text-white" : "bg-card/90 text-muted-foreground hover:bg-red-500 hover:text-white"} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Profile Row */}
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={profileImage || defaultProfileImage} 
            alt={`Photo de profil de ${name}`}
            width={48}
            height={48}
            onClick={(e) => {
              if (hasActiveStories) {
                e.preventDefault();
                e.stopPropagation();
                setStoryViewerOpen(true);
              }
            }}
            className={cn(
              "w-11 h-11 md:w-12 md:h-12 rounded-full object-cover border-2 flex-shrink-0",
              hasActiveStories 
                ? "border-green-500 cursor-pointer animate-story-pulse" 
                : "border-gold"
            )} 
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link to={`/artisan/${artisanUrl}`}>
                <h3 className="font-semibold text-foreground hover:text-gold transition-colors truncate text-sm md:text-base">
                  {name}
                </h3>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg flex-shrink-0">
            <Star className="w-4 h-4 fill-gold text-gold" />
            <span className="font-semibold text-foreground text-sm">{rating}</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">({reviews})</span>
          </div>
        </div>

        {/* Location & Info */}
        <div className="flex items-center gap-2 md:gap-4 mb-4 text-xs md:text-sm text-muted-foreground">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate" title={location}>{location}</span>
          </div>
          {distance !== null && distance !== undefined && (
            <>
              <span className="flex-shrink-0">•</span>
              <span className="flex-shrink-0 whitespace-nowrap text-gold font-medium">{Math.round(distance)} km</span>
            </>
          )}
          <span className="flex-shrink-0">•</span>
          <span className="flex-shrink-0 whitespace-nowrap">{experience} d'exp.</span>
        </div>

        <Button variant="gold" className="w-full h-11" onClick={handleProfileClick}>
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
