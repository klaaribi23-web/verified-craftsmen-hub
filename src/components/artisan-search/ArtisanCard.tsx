import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePublicArtisanStories } from "@/hooks/usePublicArtisanStories";
import { cn, ensureHttps, optimizeImageUrl } from "@/lib/utils";
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
  isRge?: boolean;
}

const DEFAULT_LOGO = "/favicon.png";

function generateAndreaScore(id: string | number): number {
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 87 + Math.abs(hash % 12);
}

const ArtisanCard = ({
  id, slug, name, profession, location, rating, reviews, verified, experience,
  profileImage, portfolio, portfolioVideos, distance, subscriptionTier, phone,
  siret, facebookUrl, instagramUrl, linkedinUrl, websiteUrl, isUrgent,
  isAudited, availableUrgent, isRge,
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
  const isPaying = subscriptionTier === "artisan_valide" || subscriptionTier === "boost_annuel";
  const hasPortfolioImage = portfolio && portfolio.length > 0;

  const andreaScore = useMemo(() => generateAndreaScore(id), [id]);

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
        .from("profiles").select("id").eq("user_id", user.id).single();
      if (profileError || !profile) {
        toast.error("Erreur lors de la récupération du profil");
        setIsLoading(false);
        return;
      }
      if (isFavorite) {
        const { error } = await supabase
          .from("client_favorites").delete()
          .eq("client_id", profile.id).eq("artisan_id", artisanId);
        if (error) throw error;
        setIsFavorite(false);
        toast.info("Artisan retiré de vos favoris");
      } else {
        const { error } = await supabase.from("client_favorites").insert({
          client_id: profile.id, artisan_id: artisanId,
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

  // Build badges for info zone
  const infoBadges: { label: string }[] = [];
  if (isRge) infoBadges.push({ label: "✓ RGE" });
  if (isPaying) {
    infoBadges.push({ label: "Décennale" });
    if (siret) infoBadges.push({ label: "SIRET" });
  }

  return (
    <div
      onClick={handleProfileClick}
      className={cn(
        "rounded-xl overflow-hidden relative cursor-pointer group h-full flex flex-col",
        "border border-white/[0.06]",
        "transition-all duration-250 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(240,165,0,0.15)]",
        "active:scale-[0.98] active:transition-[transform] active:duration-150",
      )}
      style={{ backgroundColor: '#111827' }}
    >
      {/* ══ IMAGE ZONE ══ */}
      <div className="relative w-full overflow-hidden flex-shrink-0" style={{ aspectRatio: '4/3' }}>
        {/* Image content */}
        {showVideo && hasVideos ? (
          <video
            src={portfolioVideos![0]}
            controls
            autoPlay
            className="absolute inset-0 w-full h-full object-cover"
            onClick={(e) => e.stopPropagation()}
          />
        ) : hasPortfolioImage ? (
          <img
            src={optimizeImageUrl(portfolioImages[0], 'card')}
            alt={`Réalisation de ${name}`}
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-400 group-hover:scale-[1.04]"
            loading="lazy"
            style={{ backgroundColor: '#111827' }}
          />
        ) : profileImage ? (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center p-6" style={{ backgroundColor: '#0D1F35' }}>
            <img src={optimizeImageUrl(profileImage, 'card')} alt={`Logo de ${name}`} className="max-w-[60%] max-h-[80%] object-contain" loading="lazy" />
          </div>
        ) : (
          <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ backgroundColor: '#0D1F35' }}>
            <span className="text-3xl font-black" style={{ color: 'rgba(240,165,0,0.3)' }}>{name.charAt(0)}</span>
          </div>
        )}

        {/* Bottom gradient overlay for name */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{ background: 'linear-gradient(to top, rgba(10,15,28,0.95) 0%, rgba(10,15,28,0.4) 50%, transparent 100%)' }}
        />

        {/* ─ OVERLAY: Urgent ribbon (top-left, above everything) ─ */}
        {isUrgent && (
          <div className="absolute top-0 left-0 z-20 px-2.5 py-1 text-[10px] font-bold text-white bg-red-600 rounded-br-lg flex items-center gap-1 animate-pulse">
            <Zap className="w-3 h-3 fill-current" />
            URGENT 24/7
          </div>
        )}

        {/* ─ OVERLAY: Andrea Score Badge (top-left) ─ */}
        <div
          className={cn("absolute left-2 z-10 px-2 py-[3px] rounded-md", isUrgent ? "top-7" : "top-2")}
          style={{
            backgroundColor: 'rgba(10,15,28,0.8)',
            border: '1px solid rgba(240,165,0,0.4)',
            borderRadius: '6px',
            padding: '3px 8px',
          }}
        >
          <span className="text-[10px] font-bold" style={{ color: '#f0a500' }}>⭐ Score {andreaScore}/100</span>
        </div>

        {/* ─ OVERLAY: Status Badge (top-right) ─ */}
        {isAudited ? (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAuditDialogOpen(true); }}
            className="absolute top-2 right-10 z-10 cursor-pointer"
            aria-label="Voir le résumé d'audit"
          >
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-[11px] font-extrabold shadow-lg bg-primary text-primary-foreground border border-primary/50 transition-colors whitespace-nowrap">
              <Shield className="w-3 h-3 md:w-3.5 md:h-3.5 fill-current" />
              <span>ARTISAN AUDITÉ</span>
            </div>
          </button>
        ) : isPaying ? (
          <div className="absolute top-2 right-10 z-10">
            <div className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-[11px] font-bold shadow-lg bg-green-600 text-white whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5" />
              <span>ARTISAN VALIDÉ</span>
            </div>
          </div>
        ) : null}

        {/* ─ OVERLAY: Favorite Button (top-right, beside status) ─ */}
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

        {/* ─ OVERLAY: Video play button (centered) ─ */}
        {hasVideos && !showVideo && (
          <button
            onClick={handleVideoClick}
            className="absolute inset-0 m-auto w-10 h-10 z-10 rounded-full flex items-center justify-center transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.75)' }}
            aria-label="Voir la vidéo"
          >
            <Play className="w-5 h-5 fill-current" style={{ color: '#f0a500' }} />
          </button>
        )}

        {/* ─ OVERLAY: Name + Profession (bottom-left, over gradient) ─ */}
        <div className="absolute bottom-2 left-2.5 right-2.5 z-[2] flex items-end gap-2">
          {/* Story-aware profile photo */}
          <img
            src={optimizeImageUrl(profileImage || defaultProfileImage, 'card')}
            alt={`Photo de ${name}`}
            loading="lazy"
            onClick={(e) => {
              if (hasActiveStories) {
                e.preventDefault();
                e.stopPropagation();
                setStoryViewerOpen(true);
              }
            }}
            className={cn(
              "w-8 h-8 rounded-full object-cover border-2 flex-shrink-0",
              hasActiveStories ? "border-green-500 cursor-pointer animate-story-pulse" : "border-[#f0a500]/60",
            )}
          />
          <div className="flex-1 min-w-0">
            <h3
              className="truncate text-white font-['Syne'] leading-tight"
              style={{ fontSize: '15px', fontWeight: 800 }}
            >
              {name}
            </h3>
            <p
              className="truncate leading-tight"
              style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(240,165,0,0.9)' }}
            >
              {profession}
            </p>
          </div>
        </div>
      </div>

      {/* ══ INFO ZONE ══ */}
      <div className="p-3 flex flex-col flex-1 gap-1.5" style={{ backgroundColor: '#111827' }}>
        {/* Line 1: City + response time */}
        <div className="flex items-center gap-1 text-[11px] min-w-0" style={{ color: '#8b95a8' }}>
          <span className="truncate flex items-center gap-1">
            📍 {location}
            {distance !== null && distance !== undefined && (
              <span className="font-medium" style={{ color: '#f0a500' }}>({Math.round(distance)} km)</span>
            )}
          </span>
          <span className="shrink-0">&nbsp;·&nbsp;</span>
          <span className="shrink-0 flex items-center gap-0.5">
            {availableUrgent ? (
              <span className="font-semibold" style={{ color: '#f97316' }}>⚡ Dispo. immédiate</span>
            ) : (
              <span style={{ color: '#22c55e' }}>⚡ Répond en 24h</span>
            )}
          </span>
        </div>

        {/* Rating (compact, only if > 0) */}
        {rating > 0 && (
          <div className="flex items-center gap-1 text-[11px]">
            <Star className="w-3 h-3 fill-[#f0a500] text-[#f0a500]" />
            <span className="font-semibold text-white">{rating.toFixed(1)}</span>
            {reviews > 0 && <span style={{ color: '#8b95a8' }}>({reviews})</span>}
          </div>
        )}

        {/* Line 2: Badges (RGE, Décennale, SIRET) - max 2 visible */}
        {infoBadges.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {infoBadges.slice(0, 2).map((b, i) => (
              <span
                key={i}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{
                  backgroundColor: 'rgba(34,197,94,0.1)',
                  color: '#22c55e',
                  borderRadius: '4px',
                  height: '20px',
                }}
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        {/* Social Icons - hidden on mobile */}
        {hasSocialLinks && (
          <div className="hidden md:flex items-center gap-2">
            {instagramUrl && (
              <a href={ensureHttps(instagramUrl)!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="Instagram">
                <Instagram className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
            {facebookUrl && (
              <a href={ensureHttps(facebookUrl)!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="Facebook">
                <Facebook className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
            {linkedinUrl && (
              <a href={ensureHttps(linkedinUrl)!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="LinkedIn">
                <Linkedin className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
            {websiteUrl && (
              <a href={ensureHttps(websiteUrl)!} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="w-5 h-5 rounded-full bg-muted flex items-center justify-center hover:bg-accent/20 transition-colors" title="Site web">
                <Globe className="w-3 h-3 text-muted-foreground" />
              </a>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* CTA Button */}
        {isUrgent ? (
          <button
            onClick={handleCallUrgent}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-[13px] font-extrabold transition-all bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]"
          >
            <Phone className="w-3.5 h-3.5" />
            Appeler pour une urgence
          </button>
        ) : (
          <button
            className="w-full rounded-lg py-2.5 text-[13px] font-extrabold transition-all active:scale-[0.98]"
            style={{
              backgroundColor: '#f0a500',
              color: '#0d1117',
              borderRadius: '8px',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#ffc13d';
              (e.target as HTMLElement).style.boxShadow = '0 0 16px rgba(240,165,0,0.4)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = '#f0a500';
              (e.target as HTMLElement).style.boxShadow = 'none';
            }}
          >
            Voir le profil →
          </button>
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
