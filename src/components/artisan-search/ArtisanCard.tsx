import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Star,
  CheckCircle2,
  Heart,
  Shield,
  Phone,
  Zap,
  Play,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePublicArtisanStories } from "@/hooks/usePublicArtisanStories";
import { cn, ensureHttps } from "@/lib/utils";
import StoryViewer from "@/components/stories/StoryViewer";
import AuditSummaryDialog from "@/components/artisan-search/AuditSummaryDialog";

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
  isAudited?: boolean;
  availableUrgent?: boolean;
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
  isAudited,
  availableUrgent,
}: ArtisanCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const artisanId = typeof id === "string" ? id : id.toString();
  const { stories, hasActiveStories } = usePublicArtisanStories(artisanId);

  const artisanUrl = slug || id;
  const portfolioImages = portfolio && portfolio.length > 0 ? portfolio : [];
  const defaultProfileImage = profileImage || DEFAULT_LOGO;
  const hasVideos = portfolioVideos && portfolioVideos.length > 0;
  const hasSocialLinks = facebookUrl || instagramUrl || linkedinUrl || websiteUrl;
  const isPremium = subscriptionTier === "boost_annuel";
  const isPaying = subscriptionTier === "artisan_valide" || subscriptionTier === "boost_annuel";
  const hasPortfolioImage = portfolio && portfolio.length > 0;

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


  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowVideo(true);
  };

  const portfolioImage = portfolioImages[0] || defaultProfileImage;

  return (
    <div
      onClick={handleProfileClick}
      className={cn(
        "rounded-lg shadow-soft overflow-hidden relative cursor-pointer group h-full flex flex-col",
        isPremium
          ? "border-2 border-[#D4AF37]/30 shadow-lg hover:scale-[1.02] hover:shadow-xl transition-all duration-300 ease-out"
          : "border border-[#D4AF37]/15 hover:shadow-elevated hover:border-[#D4AF37]/30 transition-all",
      )}
      style={{ backgroundColor: '#112240' }}
    >
      {/* Urgent Badge */}
      {isUrgent && (
        <div className="absolute top-0 left-0 right-0 z-20 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 flex items-center justify-center gap-1.5 animate-pulse">
          <Zap className="w-3.5 h-3.5 fill-current" />
          Dépannage Urgent 24/7
        </div>
      )}

      {/* Image */}
      <div className={cn("relative h-36 md:h-40 overflow-hidden flex-shrink-0", isUrgent && "mt-7")}>
        {showVideo && hasVideos ? (
          <video
            src={portfolioVideos![0]}
            controls
            autoPlay
            className="w-full h-full object-cover"
            onClick={(e) => e.stopPropagation()}
          />
        ) : hasPortfolioImage ? (
          <img src={portfolioImages[0]} alt={`Réalisation de ${name}`} className="w-full h-full object-cover" />
        ) : profileImage ? (
          <div className="w-full h-full bg-gradient-to-br from-muted/80 to-muted/30 flex items-center justify-center p-6">
            <img src={profileImage} alt={`Logo de ${name}`} className="max-w-[60%] max-h-[80%] object-contain" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sky-100 to-blue-50" />
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

        {/* Status Badge - Audité (gold, top tier) OR Validé (green) - never both */}
        {isAudited ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuditDialogOpen(true); }}
            className="absolute top-2 right-10 z-10 cursor-pointer"
            aria-label="Voir le résumé d'audit"
          >
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-lg bg-primary text-primary-foreground border border-primary/50 transition-colors">
              <Shield className="w-3.5 h-3.5 fill-current" />
              <span>ARTISAN AUDITÉ</span>
            </div>
          </button>
        ) : isPaying ? (
          <div className="absolute top-2 right-10 z-10">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg bg-green-600 text-white">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ARTISAN VALIDÉ</span>
            </div>
          </div>
        ) : null}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          disabled={isLoading}
          className={cn(
            "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all touch-manipulation z-10",
            isFavorite ? "bg-red-500 text-white" : "bg-card/90 text-muted-foreground hover:bg-red-500 hover:text-white",
            isLoading && "opacity-50 cursor-not-allowed",
          )}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>
      </div>

        {/* Content - flex-1 to fill remaining space */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Available Urgent Badge */}
        {availableUrgent && (
          <div className="flex items-center gap-1 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-500 border border-orange-500/30 animate-pulse">
              <Zap className="w-3 h-3 fill-current" />
              Disponible aujourd'hui
            </span>
          </div>
        )}

        {/* Premium Certification Badges - only for paying subscribers */}
        {isPaying && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <Shield className="w-3 h-3" />
              Décennale
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
              <Shield className="w-3 h-3" />
              {siret ? "SIRET" : "Vérifié"}
            </span>
          </div>
        )}

        {/* Profile photo with story indicator - fixed min-height for title zone */}
        <div className="flex items-start gap-2 mb-2 min-h-[48px]">
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
              hasActiveStories ? "border-green-500 cursor-pointer animate-story-pulse" : "border-[#D4AF37]",
            )}
          />
          <div className="flex-1 min-w-0">
            <h3 className={cn("truncate mb-0.5 text-white font-['DM_Sans']", isPremium ? "font-bold text-base sm:text-lg" : "font-semibold text-sm sm:text-base")}>{name}</h3>
            <Badge variant="secondary" className="text-xs font-semibold font-['DM_Sans']" style={{ color: '#D4AF37', backgroundColor: 'rgba(212,175,55,0.1)', borderColor: 'rgba(212,175,55,0.3)' }}>
              {profession}
            </Badge>
          </div>
        </div>

        {/* Location + distance */}
        <div className="flex items-center gap-1 text-xs text-[#8892B0] mb-2">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{location}</span>
          {distance !== null && distance !== undefined && (
            <span className="text-gold font-medium ml-1">• {Math.round(distance)} km</span>
          )}
        </div>

        {/* Rating - only show if has reviews */}
        {rating > 0 && (
          <div className="flex items-center gap-1 mb-3">
            <Star className="w-3.5 h-3.5 fill-gold text-gold" />
            <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
            {reviews > 0 && <span className="text-xs text-muted-foreground">({reviews} avis)</span>}
          </div>
        )}

        {/* Social Icons Bar - reserved height even when empty */}
        <div className="flex items-center gap-1.5 mb-3 min-h-[24px]">
          {instagramUrl && (
            <a href={ensureHttps(instagramUrl)!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="Instagram">
              <Instagram className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
          {facebookUrl && (
            <a href={ensureHttps(facebookUrl)!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="Facebook">
              <Facebook className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
          {linkedinUrl && (
            <a href={ensureHttps(linkedinUrl)!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="LinkedIn">
              <Linkedin className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
          {websiteUrl && (
            <a href={ensureHttps(websiteUrl)!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="Site web">
              <Globe className="w-3 h-3 text-muted-foreground" />
            </a>
          )}
        </div>

        {/* Spacer to push urgent button to bottom */}
        <div className="flex-1" />

        {/* Urgent CTA only */}
        {isUrgent && (
          <div className="mt-2">
            <Button
              variant="destructive"
              size="sm"
              className="w-full text-xs"
              onClick={handleCallUrgent}
            >
              <Phone className="w-3.5 h-3.5" />
              Appeler pour une urgence
            </Button>
          </div>
        )}
      </div>

      {/* Story Viewer */}
      <StoryViewer
        stories={stories}
        artisanName={name}
        artisanPhoto={profileImage || defaultProfileImage}
        highlightCity={location}
        isOpen={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
      />

      {/* Audit Summary Dialog */}
      <AuditSummaryDialog
        open={auditDialogOpen}
        onOpenChange={setAuditDialogOpen}
        businessName={name}
      />
    </div>
  );
};

export default ArtisanCard;
