import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  MapPin,
  Phone,
  Mail,
  Star,
  Shield,
  Clock,
  CheckCircle2,
  FileCheck,
  MessageSquare,
  Wrench,
  Award,
  ThumbsUp,
  Facebook,
  Instagram,
  Linkedin,
  Globe,
  ExternalLink,
  Share2,
  Copy,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Info,
  ShieldCheck,
  ArrowUp,
  FileText,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CategoryIcon from "@/components/categories/CategoryIcon";
import RecommendationsSection from "@/components/artisan-profile/RecommendationsSection";
import { PortfolioCarousel } from "@/components/artisan-profile/PortfolioCarousel";
import PortfolioPlaceholder from "@/components/artisan-profile/PortfolioPlaceholder";
import YouTubeEmbed from "@/components/artisan-profile/YouTubeEmbed";
import { isYouTubeUrl } from "@/lib/youtubeEmbed";
import { Video } from "lucide-react";
import SimilarArtisansCarousel from "@/components/artisan-search/SimilarArtisansCarousel";
import { fr } from "date-fns/locale";
import { formatDistanceToNow, format } from "date-fns";
import { useArtisanBySlug, useArtisanPreview, useArtisanServices, useArtisanReviews } from "@/hooks/usePublicData";
import { useArtisanRecommendations } from "@/hooks/useRecommendations";
import ChatWidget from "@/components/chat/ChatWidget";
import { useAuth } from "@/hooks/useAuth";

import { supabase } from "@/integrations/supabase/client";
import { usePublicArtisanStories } from "@/hooks/usePublicArtisanStories";
import { cn, DEFAULT_AVATAR, ensureHttps } from "@/lib/utils";
import StoryViewer from "@/components/stories/StoryViewer";
import { InterventionMap } from "@/components/artisan-profile/InterventionMap";
import ProfileNavigation from "@/components/artisan-profile/ProfileNavigation";
import AuditReportSection from "@/components/artisan-profile/AuditReportSection";
import ArtisanContactForm from "@/components/artisan-profile/ArtisanContactForm";
import StickyMobileCTA from "@/components/artisan-profile/StickyMobileCTA";

import OwnerClosingTunnel from "@/components/artisan-profile/OwnerClosingTunnel";

// Helper: get tomorrow's date formatted for urgency banner
const getTomorrowDeadline = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
};

const ArtisanPublicProfile = () => {
  const { slug } = useParams<{
    slug: string;
  }>();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get("preview") === "true";
  // Detect owner mode — via ?view=owner OR ?email= parameter
  const ownerEmail = searchParams.get("email") || "";
  const [isOwnerView, setIsOwnerView] = useState(() => {
    const fromUrl = window.location.search.includes("view=owner") || !!new URLSearchParams(window.location.search).get("email");
    const fromSession = sessionStorage.getItem("owner_mode") === "1";
    return fromUrl || fromSession;
  });

  // Persist owner mode and email in sessionStorage
  useEffect(() => {
    if (window.location.search.includes("view=owner") || ownerEmail) {
      sessionStorage.setItem("owner_mode", "1");
      if (ownerEmail) sessionStorage.setItem("owner_email", ownerEmail);
      setIsOwnerView(true);
    }
  }, [ownerEmail]);
  const navigate = useNavigate();
  const { user, isAuthenticated, role } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [artisanContact, setArtisanContact] = useState<{ phone: string | null; email: string | null }>({
    phone: null,
    email: null,
  });
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [showMobileContactDialog, setShowMobileContactDialog] = useState(false);

  // In preview mode, fetch from artisans table directly (for pending/imported profiles)
  const { data: publicArtisan, isLoading: publicLoading } = useArtisanBySlug(!isPreviewMode ? (slug || "") : "");
  const { data: previewArtisan, isLoading: previewLoading } = useArtisanPreview(slug || "", isPreviewMode);
  
  const artisan = isPreviewMode ? previewArtisan : publicArtisan;
  const artisanLoading = isPreviewMode ? previewLoading : publicLoading;

  // Use artisan.id for services and reviews (they need the actual ID)
  const artisanId = artisan?.id || "";
  const { data: services, isLoading: servicesLoading } = useArtisanServices(artisanId);
  const { data: reviews, isLoading: reviewsLoading } = useArtisanReviews(artisanId);

  // Fetch recommendations to conditionally show/hide section
  const { data: recommendations = [] } = useArtisanRecommendations(artisanId);
  const hasRecommendations = recommendations.length > 0;

  // Check for active stories
  const { stories, hasActiveStories } = usePublicArtisanStories(artisanId);

  // Determine which sections are visible for navigation (must be before early returns)
  const secondarySkills =
    (artisan as any)?.categories?.filter((cat: { id: string }) => cat.id !== artisan?.category?.id) || [];
  const hasWorkingHours = (artisan as any)?.working_hours && Object.keys((artisan as any).working_hours).length > 0;
  const portfolio = artisan?.portfolio_images || [];

  const visibleSections = useMemo(() => {
    if (!artisan) return [];
    const sections: string[] = ["description"]; // Always show description
    if (secondarySkills.length > 0) sections.push("competences");
    sections.push("prestations"); // Always show prestations
    sections.push("realisations"); // Always show (placeholder if no photos)
    if (artisan.portfolio_videos && artisan.portfolio_videos.length > 0) sections.push("videos");
    if (hasWorkingHours) sections.push("horaires");
    sections.push("avis"); // Always show avis
    if (hasRecommendations) sections.push("recommandations"); // Only show if has recommendations
    return sections;
  }, [artisan, secondarySkills.length, portfolio.length, hasWorkingHours, hasRecommendations]);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const handleShare = (platform: string) => {
    if (!artisan) return;
    const shareText = `Découvrez ${artisan.business_name}, ${artisan.category?.name || "Artisan"} sur Artisans Validés`;
    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, "_blank");
        break;
      case "whatsapp":
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + " " + currentUrl)}`, "_blank");
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
          "_blank",
        );
        break;
      case "linkedin":
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, "_blank");
        break;
      case "copy":
        navigator.clipboard.writeText(currentUrl);
        toast.success("Lien copié dans le presse-papier");
        break;
    }
  };
  const renderStars = (rating: number) => {
    return Array.from(
      {
        length: 5,
      },
      (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : i < rating ? "fill-amber-400/50 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ),
    );
  };

  // Fetch artisan contact info when authenticated - load immediately, not on click
  // Priority: artisans.phone/email (imported data) > profiles.phone/email (user updated)
  useEffect(() => {
    const fetchArtisanContact = async () => {
      if (!isAuthenticated || !artisan?.id) return;

      // Get the artisan's direct contact info (phone, email) and profile_id
      const { data: artisanData, error: artisanError } = await supabase
        .from("artisans")
        .select("phone, email, profile_id")
        .eq("id", artisan.id)
        .single();

      if (artisanError) return;

      // Use artisan's direct phone/email first (imported data)
      let phone = artisanData?.phone || null;
      let email = artisanData?.email || null;

      // If artisan has a profile_id and missing contact info, fallback to profiles table
      if (artisanData?.profile_id && (!phone || !email)) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("phone, email")
          .eq("id", artisanData.profile_id)
          .single();

        if (!profileError && profileData) {
          phone = phone || profileData.phone;
          email = email || profileData.email;
        }
      }

      setArtisanContact({ phone, email });
    };

    fetchArtisanContact();
  }, [isAuthenticated, artisan?.id]);

  // Loading state
  if (artisanLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pb-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-64 mb-8" />
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
              <div>
                <Skeleton className="h-96 rounded-xl" />
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!artisan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pb-8">
          <div className="container mx-auto px-4 text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Artisan non trouvé</h1>
            <p className="text-muted-foreground mb-6">Cet artisan n'existe pas ou n'est plus disponible.</p>
            <Button onClick={() => navigate("/trouver-artisan")}>Retour à la recherche</Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }
  const rating = artisan.rating || 0;
  const reviewCount = artisan.review_count || 0;

  // Dynamic SEO meta for artisan profile
  const seoTitle = `${artisan.business_name} - ${artisan.category?.name || "Artisan"} à ${artisan.city}`;
  const seoDescription = `Découvrez ${artisan.business_name}, ${artisan.category?.name || "artisan"} à ${artisan.city}. ${rating.toFixed(1)}/5 (${reviewCount} avis). Demandez un devis gratuit.`;
  const seoCanonical = `https://artisansvalides.fr/artisan/${artisan.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isPreviewMode ? `[Aperçu] ${seoTitle}` : seoTitle}
        description={seoDescription}
        canonical={seoCanonical}
        ogImage={artisan.photo_url || undefined}
        ogType="profile"
        noIndex={isPreviewMode}
      />
      <LocalBusinessSchema
        name={artisan.business_name}
        image={artisan.photo_url || undefined}
        city={artisan.city}
        region={artisan.region || undefined}
        rating={rating}
        reviewCount={reviewCount}
        description={artisan.description || undefined}
        googleBusinessUrl={(artisan as any).google_maps_url || undefined}
      />
      <Navbar />

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm font-medium text-center sm:text-left">
              👁️ Aperçu de votre vitrine — En attente de validation par Artisans Validés
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="whitespace-nowrap font-bold"
              onClick={() => window.location.href = `${window.location.origin}/connexion`}
            >
              Activer ma visibilité — 99 €/mois
            </Button>
          </div>
        </div>
      )}

      {/* Urgency Banner removed — replaced by validation banner below */}

      {/* Spacer removed — Navbar component handles it automatically */}

      {/* Mobile Back Button - Full width, minimalist */}
      <div className="lg:hidden border-b bg-muted/30">
        <div className="container mx-auto px-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground py-2 px-0 h-auto text-sm"
            onClick={() => navigate("/trouver-artisan")}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Voir tous les artisans
          </Button>
        </div>
      </div>

      {/* Profile Navigation - Desktop only (lg and up), sticky */}
      <div className="hidden lg:block sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b py-4">
        <div className="container mx-auto px-4">
          <ProfileNavigation visibleSections={visibleSections} />
        </div>
      </div>

      {/* Main Content */}
      <section className="py-4 md:py-8">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-8">
            {/* Mobile Contact Card - REMOVED: Now using MobileBottomNavbar */}

            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-8">
              {/* Profile Header */}
              <Card>
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Photo & Badge */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative" onClick={() => hasActiveStories && setStoryViewerOpen(true)}>
                        <Avatar
                          className={cn(
                            "h-32 w-32 ring-4",
                            hasActiveStories ? "ring-green-500 cursor-pointer animate-story-pulse" : "ring-primary/20",
                          )}
                        >
                          <AvatarImage src={artisan.photo_url || undefined} alt={artisan.business_name} />
                          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                            <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                          </AvatarFallback>
                        </Avatar>
                        {artisan.is_verified && (
                          <div className="absolute -bottom-2 -right-2 gold-metallic-bg text-white rounded-full p-1.5 shadow-lg glow-gold-badge">
                            <Shield className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      {(artisan.subscription_tier === "artisan_valide" || artisan.subscription_tier === "boost_annuel") && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                          <Shield className="h-3 w-3 mr-1" />
                          Artisan Validé
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold title-editorial">{artisan.business_name}</h1>
                        {artisan.status === "active" && (
                          <Badge className="bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 gap-1 self-center md:self-auto">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Partenaire Certifié
                          </Badge>
                        )}
                      </div>

                      {/* Catégorie principale - avec badge stylé */}
                      {artisan.category?.name && (
                        <Link
                          to={`/trouver-artisan?category=${encodeURIComponent(artisan.category.name.toLowerCase())}`}
                          className="mb-3 inline-flex justify-center md:justify-start w-full"
                        >
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors">
                            <CategoryIcon iconName={artisan.category?.icon} size={14} className="text-primary" />
                            <span className="text-sm font-medium text-primary">{artisan.category.name}</span>
                          </div>
                        </Link>
                      )}

                      {/* Ville + Rayon d'intervention */}
                      <div className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground mb-4 flex-wrap text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {artisan.city}
                          {artisan.postal_code && !artisan.city?.includes(artisan.postal_code) && (
                            <> ({artisan.postal_code})</>
                          )}
                          {artisan.region ? `, ${artisan.region}` : ""}
                        </span>
                        {artisan.intervention_radius && artisan.intervention_radius > 0 && (
                          <>
                            <span className="text-muted-foreground/50 mx-1">•</span>
                            <span>Intervient dans un rayon de {artisan.intervention_radius} km</span>
                          </>
                        )}
                      </div>

                      {/* Social Links */}
                      <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                        {artisan.facebook_url && (
                          <a
                            href={ensureHttps(artisan.facebook_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors group"
                            title="Facebook"
                          >
                            <Facebook className="h-5 w-5 text-[#1877F2] group-hover:text-white" />
                          </a>
                        )}
                        {artisan.instagram_url && (
                          <a
                            href={ensureHttps(artisan.instagram_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-gradient-to-br from-[#F58529]/10 via-[#DD2A7B]/10 to-[#8134AF]/10 flex items-center justify-center hover:bg-gradient-to-br hover:from-[#F58529] hover:via-[#DD2A7B] hover:to-[#8134AF] hover:text-white transition-colors group"
                            title="Instagram"
                          >
                            <Instagram className="h-5 w-5 text-[#DD2A7B] group-hover:text-white" />
                          </a>
                        )}
                        {artisan.linkedin_url && (
                          <a
                            href={ensureHttps(artisan.linkedin_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-[#0A66C2]/10 flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-colors group"
                            title="LinkedIn"
                          >
                            <Linkedin className="h-5 w-5 text-[#0A66C2] group-hover:text-white" />
                          </a>
                        )}
                        {artisan.website_url && (
                          <a
                            href={ensureHttps(artisan.website_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                            title="Site web"
                          >
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                        {(artisan as any).google_maps_url && (
                          <a
                            href={ensureHttps((artisan as any).google_maps_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-border shadow-sm hover:shadow-md hover:border-[#4285F4]/30 transition-all group"
                            title="Voir les avis Google"
                          >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <span className="text-sm font-medium text-foreground group-hover:text-[#4285F4] transition-colors">Voir les avis Google</span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-[#4285F4] transition-colors" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile Contact Section - Visible on mobile/tablet */}
              <div className="xl:hidden">
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col gap-2">
                      {/* Message pour les artisans en attente */}
                      {(artisan.status === "pending" || artisan.status === "suspended") && (
                        <div className="text-center mb-2 pb-3 border-b">
                          <p className="text-sm font-medium text-orange-600">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Dossier en cours de validation finale
                          </p>
                        </div>
                      )}

                      {/* Bouton Revendiquer pour les prospects SANS user_id (vitrines non réclamées) */}
                      {artisan.status === "prospect" && !(artisan as any).user_id && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="text-center mb-2 pb-3 border-b cursor-pointer">
                              <p className="text-xs text-muted-foreground mb-1">Vous êtes cet artisan ?</p>
                              <p className="text-sm font-bold text-amber-600 mb-2">Revendiquez votre fiche</p>
                              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white gap-2">
                                <UserPlus className="h-4 w-4" />
                                Revendiquer cette fiche
                              </Button>
                            </div>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-amber-500" />
                                Revendiquer cette fiche
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-muted-foreground">
                                Vous êtes <strong>{artisan.business_name}</strong> ? C'est votre entreprise ?
                              </p>
                              <p className="text-muted-foreground">
                                Pour activer votre fiche et gérer votre profil, contactez-nous directement :
                              </p>
                              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                <a
                                  href="tel:0353632999"
                                  className="flex items-center gap-3 text-primary hover:underline font-medium"
                                >
                                  <Phone className="h-5 w-5" />
                                  03 53 63 29 99
                                </a>
                                <a
                                  href="mailto:contact@artisansvalides.fr"
                                  className="flex items-center gap-3 text-primary hover:underline font-medium"
                                >
                                  <Mail className="h-5 w-5" />
                                  contact@artisansvalides.fr
                                </a>
                              </div>
                              <p className="text-xs text-muted-foreground text-center">
                                Notre équipe vérifiera votre identité et activera votre compte.
                              </p>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      {/* Bouton Revendiquer pour les artisans DISPONIBLE */}
                      {artisan.status === "disponible" && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="text-center mb-2 pb-3 border-b cursor-pointer">
                              <p className="text-xs text-muted-foreground mb-1">Cette place est disponible</p>
                              <Button className="w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white" size="lg">
                                <UserPlus className="h-4 w-4" />
                                Revendiquer cette place
                              </Button>
                            </div>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Info className="h-5 w-5 text-primary" />
                                Revendiquer cette place
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-muted-foreground">
                                Vous souhaitez apparaître en tant que <strong>{artisan.category?.name || "artisan"}</strong> à <strong>{artisan.city}</strong> ?
                              </p>
                              <p className="text-muted-foreground">
                                Contactez-nous pour activer cette fiche :
                              </p>
                              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                                <a href="tel:0353632999" className="flex items-center gap-3 text-primary hover:underline font-medium">
                                  <Phone className="h-5 w-5" />
                                  03 53 63 29 99
                                </a>
                                <a href="mailto:contact@artisansvalides.fr" className="flex items-center gap-3 text-primary hover:underline font-medium">
                                  <Mail className="h-5 w-5" />
                                  contact@artisansvalides.fr
                                </a>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.info("Connectez-vous pour demander un devis");
                            navigate("/auth");
                            return;
                          }
                          setChatOpen(true);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                        Demander un devis
                      </Button>
                      {artisanContact.phone && (
                        <a href={`tel:${artisanContact.phone}`} className="w-full">
                          <Button variant="outline" className="w-full gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700">
                            <Phone className="h-4 w-4" />
                            Appeler
                          </Button>
                        </a>
                      )}
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          if (!isAuthenticated) {
                            toast.info("Connectez-vous pour voir les coordonnées");
                            navigate("/auth");
                            return;
                          }
                          setShowMobileContactDialog(true);
                        }}
                      >
                        <Mail className="h-4 w-4" />
                        Voir les coordonnées
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Audit Report - Only when is_audited is true */}
              {(artisan as any).is_audited && (
                <AuditReportSection
                  businessName={artisan.business_name}
                  city={artisan.city}
                  category={artisan.category?.name}
                />
              )}

              {/* Le mot de l'artisan */}
              <Card id="description">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <MessageSquare className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Le mot de l'artisan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-muted-foreground italic leading-relaxed text-sm md:text-base">
                      "
                      {artisan.description ||
                        "Artisan passionné par mon métier, je mets tout mon savoir-faire au service de mes clients. Qualité, ponctualité et satisfaction sont mes priorités. N'hésitez pas à me contacter pour discuter de votre projet et obtenir un devis personnalisé adapté à vos besoins."}
                      "
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Pourquoi cet artisan est validé - Colorful badges */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Pourquoi cet artisan est validé ?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3">
                    {/* Identité vérifiée */}
                     <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary border border-emerald-500/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                       <span className="text-xs font-medium text-white leading-tight">Identité vérifiée</span>
                     </div>

                     {/* SIRET contrôlé */}
                     <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary border border-blue-500/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-2">
                        <FileCheck className="h-5 w-5 text-white" />
                      </div>
                       <span className="text-xs font-medium text-white leading-tight">SIRET & assurances</span>
                     </div>

                     {/* Expérience */}
                     {artisan.experience_years && artisan.experience_years > 0 && (
                       <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary border border-amber-500/30 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
                          <Award className="h-5 w-5 text-white" />
                        </div>
                         <span className="text-xs font-medium text-white leading-tight">
                           {artisan.experience_years} ans d'expérience
                         </span>
                       </div>
                     )}

                     {/* Avis authentifiés */}
                     <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary border border-purple-500/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-2">
                        <Star className="h-5 w-5 text-white" />
                      </div>
                       <span className="text-xs font-medium text-white leading-tight">Avis authentifiés</span>
                     </div>

                     {/* Charte qualité */}
                     <div className="flex flex-col items-center text-center p-3 rounded-xl bg-secondary border border-rose-500/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mb-2">
                        <ThumbsUp className="h-5 w-5 text-white" />
                      </div>
                       <span className="text-xs font-medium text-white leading-tight">Charte qualité signée</span>
                     </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compétences secondaires - liste verticale avec coches vertes */}
              {(() => {
                const secondarySkills =
                  (artisan as any).categories?.filter((cat: { id: string }) => cat.id !== artisan.category?.id) || [];

                if (secondarySkills.length === 0) return null;

                return (
                  <Card id="competences">
                    <CardHeader className="p-4 md:p-6">
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Award className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        Compétences secondaires
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-2">
                        {secondarySkills.map((skill: { id: string; name: string }) => (
                          <Link
                            key={skill.id}
                            to={`/trouver-artisan?category=${encodeURIComponent(skill.name.toLowerCase())}`}
                            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="text-sm md:text-base font-medium">{skill.name}</span>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Services Section - Always visible (no accordion) */}
              <Card id="prestations">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Wrench className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Prestations proposées
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                  {servicesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-16 md:h-20 rounded-lg" />
                      ))}
                    </div>
                  ) : services && services.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                      {services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-secondary border border-primary/20 hover:border-primary/40 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm md:text-base truncate text-white">{service.title}</p>
                            {service.duration && (
                              <p className="text-xs md:text-sm text-slate-400">
                                <Clock className="h-3 w-3 inline mr-1 text-primary" />
                                {service.duration}
                              </p>
                            )}
                          </div>
                          {service.price ? (
                            <Badge variant="secondary" className="font-semibold shrink-0 ml-2 text-xs md:text-sm border border-primary/20 text-primary">
                              {service.price}€
                            </Badge>
                          ) : (
                            <Badge className="bg-primary/10 text-primary border-primary/20 font-semibold shrink-0 ml-2 text-xs md:text-sm">
                              Sur Devis
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">Aucune prestation renseignée</p>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio Section - Photos */}
              <Card id="realisations">
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <FileCheck className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    Mes réalisations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolio.length > 0 ? (
                    <PortfolioCarousel
                      items={portfolio}
                      type="image"
                      onItemClick={(image, index) => {
                        setSelectedImage(image);
                        setSelectedImageIndex(index);
                      }}
                      artisanContext={{
                        businessName: artisan.business_name,
                        city: artisan.city,
                        category: artisan.category?.name,
                        department: artisan.department || artisan.postal_code?.substring(0, 2),
                      }}
                    />
                  ) : (
                    <PortfolioPlaceholder
                      businessName={artisan.business_name}
                      category={artisan.category?.name}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Portfolio Section - Videos with YouTube Embeds */}
              {artisan.portfolio_videos && artisan.portfolio_videos.length > 0 && (
                <Card id="videos">
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Video className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      Mes vidéos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* YouTube embeds displayed inline */}
                    {artisan.portfolio_videos.some(v => isYouTubeUrl(v)) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {artisan.portfolio_videos.filter(v => isYouTubeUrl(v)).map((video, i) => (
                          <div key={i} className="aspect-video rounded-xl overflow-hidden">
                            <YouTubeEmbed
                              url={video}
                              title={`${artisan.business_name} - Vidéo ${i + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Non-YouTube videos in carousel */}
                    {artisan.portfolio_videos.some(v => !isYouTubeUrl(v)) && (
                      <PortfolioCarousel
                        items={artisan.portfolio_videos.filter(v => !isYouTubeUrl(v))}
                        type="video"
                        onItemClick={(video) => setSelectedVideo(video)}
                        artisanContext={{
                          businessName: artisan.business_name,
                          city: artisan.city,
                          category: artisan.category?.name,
                          department: artisan.department || artisan.postal_code?.substring(0, 2),
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Working Hours & Infos pratiques - Side by side layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Working Hours Card */}
                {(artisan as any).working_hours && Object.keys((artisan as any).working_hours).length > 0 && (
                  <Card id="horaires">
                    <CardHeader className="p-4 md:p-6">
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        Heures de travail
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {[
                          { key: "lundi", label: "Lundi" },
                          { key: "mardi", label: "Mardi" },
                          { key: "mercredi", label: "Mercredi" },
                          { key: "jeudi", label: "Jeudi" },
                          { key: "vendredi", label: "Vendredi" },
                          { key: "samedi", label: "Samedi" },
                          { key: "dimanche", label: "Dimanche" },
                        ].map((day) => {
                          const hours = (artisan as any).working_hours?.[day.key];
                          if (!hours) return null;

                          const isEnabled = hours.enabled !== false;
                          const displayTime = isEnabled
                            ? `${hours.start || "08:00"} - ${hours.end || "18:00"}`
                            : "Fermé";

                          const today = new Date().toLocaleDateString("fr-FR", { weekday: "long" }).toLowerCase();
                          const isToday = day.key === today;

                          return (
                            <div key={day.key} className={cn(
                              "flex items-center justify-between py-2.5 px-3 rounded-lg transition-colors",
                              isToday ? "bg-primary/10 border border-primary/30" : "border border-transparent"
                            )}>
                              <span className={cn(
                                "text-sm md:text-base font-medium",
                                isToday ? "text-primary font-bold" : "text-foreground"
                              )}>{day.label}</span>
                              <span
                                className={cn(
                                  "text-xs md:text-sm font-semibold",
                                  !isEnabled ? "text-red-500" : isToday ? "text-primary" : "text-slate-300",
                                )}
                              >
                                {displayTime}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Infos pratiques Card */}
                <Card
                  id="infos-pratiques"
                  className="bg-gradient-to-br from-secondary to-card"
                >
                  <CardHeader className="p-4 md:p-6">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <Info className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      Infos pratiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TooltipProvider delayDuration={200}>
                      <div className="space-y-4">
                        {/* Zone d'intervention */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-primary/10 cursor-help transition-colors hover:border-primary/30">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <MapPin className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Zone d'intervention</p>
                                <p className="font-semibold">
                                  {artisan.city}
                                  {artisan.postal_code && ` (${artisan.postal_code})`}
                                  {artisan.intervention_radius && artisan.intervention_radius > 0 && (
                                    <span className="text-primary ml-1">+ {artisan.intervention_radius} km</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>Zone géographique où l'artisan peut se déplacer pour réaliser ses interventions.</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* SIRET - always visible */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-primary/10 cursor-help transition-colors hover:border-primary/30">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <FileCheck className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">N° SIRET</p>
                                <p className="font-semibold font-mono tracking-wide">
                                  {(artisan as any).siret || (
                                    <span className="text-muted-foreground italic">En attente</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>
                              Numéro d'identification unique de l'entreprise, garantissant son existence légale en
                              France.
                            </p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Dernière vérification - only for active artisans */}
                        {artisan.status === "active" && artisan.updated_at && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-primary/10 cursor-help transition-colors hover:border-primary/30">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                  <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Dernière vérification Artisan Validé</p>
                                  <p className="font-semibold">
                                    {format(new Date(artisan.updated_at), "MMMM yyyy", { locale: fr })}
                                  </p>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>
                                Date à laquelle notre équipe a vérifié et validé le profil et les documents de cet
                                artisan.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Documents vérifiés */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary border border-primary/10 cursor-help transition-colors hover:border-primary/30">
                              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Shield className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Documents légaux</p>
                                <p className="font-semibold">Vérifiés par la plateforme</p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>RC Pro, garantie décennale et KBIS vérifiés par notre équipe de modération.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </CardContent>
                </Card>
              </div>

              {/* Certifications */}
              {artisan.qualifications && artisan.qualifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Certifications & Labels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {artisan.qualifications.map((cert, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                        >
                          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <Award className="h-5 w-5 text-emerald-600" />
                          </div>
                          <span className="font-medium">{cert}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommandations Section - Hidden if empty */}
              {hasRecommendations && (
                <div id="recommandations">
                  <RecommendationsSection
                    artisanId={artisan.id}
                    artisanName={artisan.business_name}
                    isLoggedIn={isAuthenticated}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Contact Card - Hidden on mobile (shown as sticky bar) */}
            <div className="hidden lg:block lg:col-span-1 space-y-6">
              {/* Message for pending/suspended artisans (EN ATTENTE) */}
              {(artisan.status === "pending" || artisan.status === "suspended") && (
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardContent className="p-6 text-center">
                    <Clock className="h-8 w-8 text-orange-500 mx-auto mb-3" />
                    <p className="font-semibold text-orange-700 text-lg mb-1">Dossier en cours de validation finale</p>
                    <p className="text-sm text-orange-600/70">Notre équipe procède aux dernières vérifications.</p>
                  </CardContent>
                </Card>
              )}

              {/* Revendiquer button for DISPONIBLE status */}
              {artisan.status === "disponible" && (
                <Dialog>
                  <Card className="min-h-[200px] flex flex-col justify-center border-primary/20">
                    <CardContent className="p-6">
                      <div className="text-center mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Cette place est disponible</p>
                        <p className="text-lg font-bold text-primary">Revendiquez cette place</p>
                      </div>
                      <p className="text-sm text-muted-foreground text-center mb-3">
                        Prenez cette visibilité premium pour votre entreprise et recevez des demandes de clients.
                      </p>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" size="lg">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Revendiquer cette place
                        </Button>
                      </DialogTrigger>
                    </CardContent>
                  </Card>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-primary" />
                        Revendiquer cette place
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Vous souhaitez apparaître en tant que <strong>{artisan.category?.name || "artisan"}</strong> à <strong>{artisan.city}</strong> ?
                      </p>
                      <p className="text-muted-foreground">
                        Contactez-nous pour activer cette fiche :
                      </p>
                      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                        <a href="tel:0353632999" className="flex items-center gap-3 text-primary hover:underline font-medium">
                          <Phone className="h-5 w-5" />
                          03 53 63 29 99
                        </a>
                        <a href="mailto:contact@artisansvalides.fr" className="flex items-center gap-3 text-primary hover:underline font-medium">
                          <Mail className="h-5 w-5" />
                          contact@artisansvalides.fr
                        </a>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* 1. SECTION REVENDICATION - Pop-up contact (uniquement prospect SANS user_id) */}
              {artisan.status === "prospect" && !(artisan as any).user_id && (
                <Dialog>
                  <Card className="min-h-[280px] flex flex-col justify-center">
                    <CardContent className="p-6">
                      <div className="text-center mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Vous êtes cet artisan ?</p>
                        <p className="text-lg font-bold text-amber-600">Revendiquez votre fiche</p>
                      </div>
                      <p className="text-sm text-muted-foreground text-center mb-3">
                        Cette fiche a été créée pour vous. Réclamez-la pour gérer votre profil et recevoir des demandes
                        de clients.
                      </p>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white" size="lg">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Revendiquer cette fiche
                        </Button>
                      </DialogTrigger>
                    </CardContent>
                  </Card>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5 text-amber-500" />
                        Revendiquer cette fiche
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        Vous êtes <strong>{artisan.business_name}</strong> ? C'est votre entreprise ?
                      </p>
                      <p className="text-muted-foreground">
                        Pour activer votre fiche et gérer votre profil, contactez-nous directement :
                      </p>
                      <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                        <a
                          href="tel:0353632999"
                          className="flex items-center gap-3 text-primary hover:underline font-medium"
                        >
                          <Phone className="h-5 w-5" />
                          03 53 63 29 99
                        </a>
                        <a
                          href="mailto:contact@artisansvalides.fr"
                          className="flex items-center gap-3 text-primary hover:underline font-medium"
                        >
                          <Mail className="h-5 w-5" />
                          contact@artisansvalides.fr
                        </a>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Notre équipe vérifiera votre identité et activera votre compte.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              {/* 2. SECTION CONTACT */}
              <ArtisanContactForm
                artisanId={artisan.id}
                artisanName={artisan.business_name}
                artisanEmail={artisanContact.email}
                artisanPhone={artisanContact.phone}
                artisanCity={artisan.city}
                isAudited={artisan.is_audited === true}
              />

              {/* 3. SECTION ZONE D'INTERVENTION - Non-sticky, EN DERNIER */}
              {artisan.latitude &&
                artisan.longitude &&
                artisan.intervention_radius &&
                artisan.intervention_radius > 0 && (
                  <InterventionMap
                    latitude={artisan.latitude}
                    longitude={artisan.longitude}
                    interventionRadius={artisan.intervention_radius}
                    city={artisan.city || ""}
                  />
                )}
            </div>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Previous Arrow */}
          {portfolio.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = selectedImageIndex === 0 ? portfolio.length - 1 : selectedImageIndex - 1;
                setSelectedImageIndex(newIndex);
                setSelectedImage(portfolio[newIndex]);
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          <img
            src={selectedImage}
            alt={`${artisan.category?.name || "Réalisation"} par ${artisan.business_name} à ${artisan.city}${artisan.department ? ` (${artisan.department})` : artisan.postal_code ? ` (${artisan.postal_code.substring(0, 2)})` : ""} - Photo ${selectedImageIndex + 1}`}
            className="max-w-full max-h-[90vh] rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next Arrow */}
          {portfolio.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newIndex = selectedImageIndex === portfolio.length - 1 ? 0 : selectedImageIndex + 1;
                setSelectedImageIndex(newIndex);
                setSelectedImage(portfolio[newIndex]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}

          {/* Image Counter */}
          {portfolio.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
              {selectedImageIndex + 1} / {portfolio.length}
            </div>
          )}
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>
          <div className="w-full max-w-4xl aspect-video" onClick={(e) => e.stopPropagation()}>
            {selectedVideo.startsWith("blob:") ? (
              <video src={selectedVideo} controls autoPlay className="w-full h-full rounded-lg" />
            ) : selectedVideo.includes("youtube") || selectedVideo.includes("youtu.be") ? (
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)?.[1]}?autoplay=1`}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Vidéo"
              />
            ) : selectedVideo.includes("vimeo") ? (
              <iframe
                src={`https://player.vimeo.com/video/${selectedVideo.match(/vimeo\.com\/(\d+)/)?.[1]}?autoplay=1`}
                className="w-full h-full rounded-lg"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Vidéo"
              />
            ) : (
              <video src={selectedVideo} controls autoPlay className="w-full h-full rounded-lg" />
            )}
          </div>
        </div>
      )}

      {/* Similar Artisans Carousel */}
      <SimilarArtisansCarousel
        currentArtisanId={artisan.id}
        categoryId={artisan.category_id}
        trade={artisan.category?.name || ""}
      />

      {/* Breadcrumb - Bottom of page */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              Accueil
            </Link>
            <span>/</span>
            <Link to="/trouver-artisan" className="hover:text-foreground transition-colors">
              Artisans
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold italic truncate max-w-[200px] sm:max-w-none">
              {artisan.business_name}
            </span>
          </nav>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="w-full sm:w-auto gap-2"
          >
            <ArrowUp className="h-4 w-4" />
            Retour en haut
          </Button>
        </div>
      </div>

      {/* CTA Section */}
      <section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Besoin d'un {artisan.category?.name?.toLowerCase() || "artisan"} de confiance ?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {artisan.business_name} répond en moyenne en moins de 2 heures. Demandez un devis gratuit et sans
            engagement.
          </p>
          <Button size="lg" className="px-8" onClick={() => setChatOpen(true)}>
            Demander un devis gratuit
          </Button>
        </div>
      </section>

      {/* Chat Widget Logic:
          - Non-authenticated: Show widget (it will invite to login)
          - Authenticated: Show on desktop always, on mobile only when chatOpen 
      */}
      {!isAuthenticated ? (
        // Non-connected: Widget visible with login invitation
        <div className="xl:hidden">
          <ChatWidget />
        </div>
      ) : (
        // Connected: Widget controlled by navbar on mobile, always visible on desktop
        <div className={chatOpen ? "block" : "hidden xl:block"}>
          <ChatWidget
            defaultOpen={chatOpen}
            defaultArtisanId={artisan.id || undefined}
            defaultArtisanName={artisan.business_name}
            defaultArtisanPhoto={artisan.photo_url || undefined}
          />
        </div>
      )}

      {/* Mobile Contact Dialog - For authenticated users */}
      <Dialog open={showMobileContactDialog} onOpenChange={setShowMobileContactDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Coordonnées de {artisan.business_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {artisanContact.phone ? (
              <a
                href={`tel:${artisanContact.phone}`}
                className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors text-emerald-700"
              >
                <Phone className="h-5 w-5" />
                <span className="font-medium">{artisanContact.phone}</span>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted text-muted-foreground">
                <Phone className="h-5 w-5" />
                <span>Téléphone non renseigné</span>
              </div>
            )}
            {artisanContact.email ? (
              <a
                href={`mailto:${artisanContact.email}`}
                className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-blue-700"
              >
                <Mail className="h-5 w-5" />
                <span className="font-medium">{artisanContact.email}</span>
              </a>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted text-muted-foreground">
                <Mail className="h-5 w-5" />
                <span>Email non renseigné</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Story Viewer */}
      <StoryViewer
        stories={stories}
        artisanName={artisan.business_name}
        artisanPhoto={artisan.photo_url}
        highlightCity={artisan.city}
        isOpen={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
      />

      {/* Owner Closing Tunnel — activated via ?view=owner — delay 0 for test */}
      {isOwnerView && (
        <OwnerClosingTunnel
          artisanName={artisan.business_name}
          city={artisan.city}
          artisanEmail={(artisan as any).email || null}
          artisanId={artisan.id!}
          delaySeconds={0}
        />
      )}

      {/* ═══ VALIDATION BANNER + FOOTER CONVERSION — for non-active artisans ═══ */}
      {isOwnerView && !isPreviewMode && artisan.status !== "active" && (
        <>
          {/* Fixed top status banner — Navy/Or, institutional tone */}
          <div
            className="fixed top-0 left-0 right-0 z-[65] py-3 px-4 text-center"
            style={{
              background: "linear-gradient(90deg, #0A192F, #122a4a)",
              borderBottom: "1px solid rgba(255,184,0,0.25)",
            }}
          >
            <p className="text-xs md:text-sm font-bold tracking-wide" style={{ color: "#FFB800" }}>
              📋 Dossier en cours de validation finale. Notre équipe procède aux dernières vérifications.
            </p>
          </div>

          {/* Footer conversion block — solemn decision area */}
          <div
            className="fixed bottom-0 left-0 right-0 z-[999999]"
            style={{
              background: "linear-gradient(180deg, #0A192F 0%, #0d1f3c 100%)",
              borderTop: "2px solid #FFB800",
              boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div className="container mx-auto px-4 py-4 md:py-5 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* GOLD CTA */}
                <button
                  onClick={() => {
                    const email = ownerEmail || sessionStorage.getItem("owner_email") || "";
                    const slug = artisan.slug || "";
                    const params = new URLSearchParams();
                    if (email) params.set("email", email);
                    if (slug) params.set("slug", slug);
                    if (artisan.business_name) params.set("nom", artisan.business_name);
                    if (artisan.city) params.set("ville", artisan.city);
                    window.location.href = `/devenir-artisan?${params.toString()}`;
                  }}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-black text-sm md:text-base uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #FFB800, #f0a500)",
                    color: "#0A192F",
                    boxShadow: "0 8px 30px rgba(255,184,0,0.35)",
                    fontFamily: "'Montserrat',sans-serif",
                  }}
                >
                  <span className="relative z-10">✅ OUI, JE VEUX MES ACCÈS ET MES CHANTIERS</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                </button>

                {/* Grey refuse link */}
                <button
                  onClick={() => {
                    if (confirm(`Attention : Cette action est irréversible et libère vos chantiers réservés sur ${artisan.city}. Confirmer la suppression ?`)) {
                      toast.info("Votre demande de suppression a été enregistrée.");
                      window.location.href = "/";
                    }
                  }}
                  className="text-xs underline transition-colors"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(239,68,68,0.7)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                >
                  Non, supprimer ma fiche et céder à mon concurrent
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <Footer />

      {/* Sticky Mobile CTA */}
      <StickyMobileCTA
        artisanName={artisan.business_name}
        onRequestQuote={() => {
          const contactSection = document.querySelector('[class*="ArtisanContactForm"], [data-contact-form]');
          if (contactSection) {
            contactSection.scrollIntoView({ behavior: "smooth" });
          } else {
            // Scroll to the contact form area (roughly 2/3 down the right column)
            window.scrollTo({ top: 600, behavior: "smooth" });
          }
        }}
      />
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};
export default ArtisanPublicProfile;
