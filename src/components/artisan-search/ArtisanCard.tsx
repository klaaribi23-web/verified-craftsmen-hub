import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, CheckCircle2, Heart, Crown, Award, Medal } from "lucide-react";
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


  const isElite = subscriptionTier === "elite";
  const isPro = subscriptionTier === "pro";
  const isEssential = subscriptionTier === "essential";

  const getBadgeConfig = () => {
    if (isElite) {
      return {
        show: true,
        icon: Crown,
        label: "Elite",
        gradient: "from-yellow-500 via-amber-400 to-yellow-500",
        borderClass: "border-border"
      };
    }
    if (isPro) {
      return {
        show: true,
        icon: Award,
        label: "Premium",
        gradient: "from-slate-400 via-slate-300 to-slate-400",
        borderClass: "border-border"
      };
    }
    if (isEssential) {
      return {
        show: true,
        icon: Medal,
        label: "Pro",
        gradient: "from-amber-700 via-amber-600 to-amber-700",
        borderClass: "border-border"
      };
    }
    return { show: false, borderClass: "border-border" };
  };

  const badgeConfig = getBadgeConfig();

  const portfolioImage = portfolioImages[0] || defaultProfileImage;

  return (
    <div 
      onClick={handleProfileClick}
      className={cn(
        "bg-card rounded-xl shadow-soft border hover:shadow-elevated transition-shadow overflow-hidden relative cursor-pointer",
        badgeConfig.borderClass
      )}
    >
      {/* Image */}
      <div className="relative h-36 md:h-40 overflow-hidden">
        <img 
          src={portfolioImage} 
          alt={`Réalisation de ${name}`} 
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
        {verified && (
          <div className="absolute top-2 right-12 bg-success text-success-foreground text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Vérifié</span>
          </div>
        )}

        {/* Favorite Button */}
        <button 
          onClick={handleFavoriteClick} 
          disabled={isLoading}
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all touch-manipulation",
            isFavorite ? "bg-red-500 text-white" : "bg-card/90 text-muted-foreground hover:bg-red-500 hover:text-white",
            isLoading && "opacity-50 cursor-not-allowed"
          )}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Profile photo with story indicator */}
        <div className="flex items-start gap-2 mb-2">
          <img 
            src={profileImage || defaultProfileImage} 
            alt={`Photo de profil de ${name}`}
            onClick={(e) => {
              if (hasActiveStories) {
                e.preventDefault();
                e.stopPropagation();
                setStoryViewerOpen(true);
              }
            }}
            className={cn(
              "w-9 h-9 rounded-full object-cover border-2 flex-shrink-0",
              hasActiveStories 
                ? "border-green-500 cursor-pointer animate-story-pulse" 
                : "border-gold"
            )} 
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate mb-0.5">
              {name}
            </h3>
            <Badge variant="secondary" className="text-xs">
              {profession}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
          {distance !== null && distance !== undefined && (
            <span className="text-gold font-medium ml-1">• {Math.round(distance)} km</span>
          )}
        </div>
        
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={cn(
                "h-3 w-3",
                i < Math.floor(rating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              )}
            />
          ))}
          <span className="text-xs font-medium ml-1">
            {rating.toFixed(1)}
          </span>
          {reviews > 0 && (
            <span className="text-xs text-muted-foreground ml-1">({reviews})</span>
          )}
        </div>
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
