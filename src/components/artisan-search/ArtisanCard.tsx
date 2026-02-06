import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Star,
  CheckCircle2,
  Heart,
  Crown,
  Award,
  Medal,
  Shield,
  Phone,
  Zap,
  Play,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  FileText,
  Send,
} from "lucide-react";
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
  portfolioVideos?: string[];
  distance?: number | null;
  subscriptionTier?: string | null;
  phone?: string | null;
  siret?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  isUrgent?: boolean;
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
  portfolioVideos,
  distance,
  subscriptionTier,
  phone,
  siret,
  facebookUrl,
  instagramUrl,
  linkedinUrl,
  websiteUrl,
  isUrgent,
}: ArtisanCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const artisanId = typeof id === "string" ? id : id.toString();
  const { stories, hasActiveStories } = usePublicArtisanStories(artisanId);

  const artisanUrl = slug || id;
  const portfolioImages = portfolio && portfolio.length > 0 ? portfolio : [DEFAULT_LOGO];
  const defaultProfileImage = profileImage || DEFAULT_LOGO;
  const hasVideos = portfolioVideos && portfolioVideos.length > 0;
  const hasSocialLinks = facebookUrl || instagramUrl || linkedinUrl || websiteUrl;

  // Check if artisan is already in favorites on mount
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return;
      try {
        const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
        if (!profile) return;
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
        const { error } = await supabase
          .from("client_favorites")
          .delete()
          .eq("client_id", profile.id)
          .eq("artisan_id", artisanId);
        if (error) throw error;
        setIsFavorite(false);
        toast.info("Artisan retiré de vos favoris");
      } else {
        const { error } = await supabase.from("client_favorites").insert({
          client_id: profile.id,
          artisan_id: artisanId,
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
    window.scrollTo({ top: 0, behavior: "instant" });
    navigate(`/artisan/${artisanUrl}`);
  };

  const handleCallUrgent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast.info("Numéro non disponible. Contactez l'artisan via sa fiche.");
    }
  };

  const handleInviteProject = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour inviter un artisan");
      navigate("/auth");
      return;
    }
    navigate(`/demande-devis?artisan=${artisanId}`);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowVideo(true);
  };

  const isElite = subscriptionTier === "elite";
  const isPro = subscriptionTier === "pro";
  const isEssential = subscriptionTier === "essential";

  const getBadgeConfig = () => {
    if (isElite) return { show: true, icon: Crown, label: "Elite", gradient: "from-yellow-500 via-amber-400 to-yellow-500", borderClass: "border-border" };
    if (isPro) return { show: true, icon: Award, label: "Premium", gradient: "from-slate-400 via-slate-300 to-slate-400", borderClass: "border-border" };
    if (isEssential) return { show: true, icon: Medal, label: "Pro", gradient: "from-amber-700 via-amber-600 to-amber-700", borderClass: "border-border" };
    return { show: false, borderClass: "border-border" };
  };

  const badgeConfig = getBadgeConfig();
  const portfolioImage = portfolioImages[0] || defaultProfileImage;

  return (
    <div
      onClick={handleProfileClick}
      className={cn(
        "bg-card rounded-xl shadow-soft border hover:shadow-elevated transition-all overflow-hidden relative cursor-pointer group",
        badgeConfig.borderClass,
      )}
    >
      {/* Urgent Badge */}
      {isUrgent && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 flex items-center justify-center gap-1.5 animate-pulse">
          <Zap className="w-3.5 h-3.5 fill-current" />
          Dépannage Urgent 24/7
        </div>
      )}

      {/* Image */}
      <div className={cn("relative h-36 md:h-40 overflow-hidden", isUrgent && "mt-7")}>
        {showVideo && hasVideos ? (
          <video
            src={portfolioVideos![0]}
            controls
            autoPlay
            className="w-full h-full object-cover"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <img src={portfolioImage} alt={`Réalisation de ${name}`} className="w-full h-full object-cover" />
        )}

        {/* Video play button overlay */}
        {hasVideos && !showVideo && (
          <button
            onClick={handleVideoClick}
            className="absolute bottom-2 left-2 z-10 bg-foreground/70 hover:bg-foreground/90 text-background rounded-full p-1.5 transition-colors"
            aria-label="Voir la vidéo"
          >
            <Play className="w-4 h-4 fill-current" />
          </button>
        )}

        {/* Subscription Badge */}
        {badgeConfig.show && badgeConfig.icon && (
          <div className="absolute top-2 left-2 z-10">
            <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs font-semibold shadow-lg bg-gradient-to-r", badgeConfig.gradient)}>
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
            isLoading && "opacity-50 cursor-not-allowed",
          )}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4">
        {/* Check Artisans Validés - Verification Block */}
        {verified && (
          <div className="flex items-center gap-2 mb-2 p-1.5 rounded-lg bg-success/5 border border-success/15">
            <Shield className="w-4 h-4 text-success flex-shrink-0" />
            <div className="flex items-center gap-2 text-xs text-success font-medium overflow-hidden">
              <span className="flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Décennale
              </span>
              {siret && (
                <span className="flex items-center gap-0.5">
                  <FileText className="w-3 h-3" /> SIRET
                </span>
              )}
            </div>
          </div>
        )}

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
              hasActiveStories ? "border-green-500 cursor-pointer animate-story-pulse" : "border-gold",
            )}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base truncate mb-0.5">{name}</h3>
            <Badge variant="secondary" className="text-xs">
              {profession}
            </Badge>
          </div>
        </div>

        {/* Location + distance */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
          {distance !== null && distance !== undefined && (
            <span className="text-gold font-medium ml-1">• {Math.round(distance)} km</span>
          )}
        </div>

        {/* Rating */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
            {reviews > 0 && <span className="text-xs text-muted-foreground">({reviews} avis)</span>}
          </div>
        )}

        {/* Social Icons Bar */}
        {hasSocialLinks && (
          <div className="flex items-center gap-1.5 mb-3">
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="Instagram">
                <Instagram className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="Facebook">
                <Facebook className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
            {linkedinUrl && (
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="LinkedIn">
                <Linkedin className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
            {websiteUrl && (
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="Site web">
                <Globe className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {/* Invite to project */}
          <Button
            variant="gold"
            size="sm"
            className="w-full text-xs"
            onClick={handleInviteProject}
          >
            <Send className="w-3.5 h-3.5" />
            Inviter à chiffrer mon projet
          </Button>

          {/* Urgent call button */}
          {isUrgent && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full text-xs"
              onClick={handleCallUrgent}
            >
              <Phone className="w-3.5 h-3.5" />
              Appeler pour une urgence
            </Button>
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
