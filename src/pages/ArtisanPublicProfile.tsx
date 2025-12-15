import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, Phone, Mail, Star, Shield, Clock, CheckCircle2, FileCheck, Calendar as CalendarIcon, MessageSquare, Wrench, Award, ThumbsUp, Facebook, Instagram, Linkedin, Globe, ExternalLink, Share2, Copy, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import ReviewForm from "@/components/artisan-profile/ReviewForm";
import { PortfolioCarousel } from "@/components/artisan-profile/PortfolioCarousel";
import { Video } from "lucide-react";
import SimilarArtisansCarousel from "@/components/artisan-search/SimilarArtisansCarousel";
import { fr } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { useArtisanBySlug, useArtisanServices, useArtisanReviews } from "@/hooks/usePublicData";
import ChatWidget from "@/components/chat/ChatWidget";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePublicArtisanStories } from "@/hooks/usePublicArtisanStories";
import { cn, DEFAULT_AVATAR } from "@/lib/utils";
import StoryViewer from "@/components/stories/StoryViewer";

const ArtisanPublicProfile = () => {
  const {
    slug
  } = useParams<{
    slug: string;
  }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showContactInfo, setShowContactInfo] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [artisanContact, setArtisanContact] = useState<{ phone: string | null; email: string | null }>({ phone: null, email: null });
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);

  // Fetch dynamic data using slug
  const {
    data: artisan,
    isLoading: artisanLoading
  } = useArtisanBySlug(slug || "");
  
  // Use artisan.id for services and reviews (they need the actual ID)
  const artisanId = artisan?.id || "";
  const {
    data: services,
    isLoading: servicesLoading
  } = useArtisanServices(artisanId);
  const {
    data: reviews,
    isLoading: reviewsLoading
  } = useArtisanReviews(artisanId);
  
  // Check for active stories
  const { stories, hasActiveStories } = usePublicArtisanStories(artisanId);
  
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleShare = (platform: string) => {
    if (!artisan) return;
    const shareText = `Découvrez ${artisan.business_name}, ${artisan.category?.name || "Artisan"} sur Artisans Validés`;
    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(currentUrl);
        toast.success("Lien copié dans le presse-papier");
        break;
    }
  };
  const renderStars = (rating: number) => {
    return Array.from({
      length: 5
    }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : i < rating ? "fill-amber-400/50 text-amber-400" : "text-muted-foreground/30"}`} />);
  };

  // Parse availability from JSON
  const getAvailability = () => {
    const defaultAvailability = {
      lundi: "8h - 18h",
      mardi: "8h - 18h",
      mercredi: "8h - 18h",
      jeudi: "8h - 18h",
      vendredi: "8h - 18h",
      samedi: "9h - 17h",
      dimanche: "Fermé"
    };

    if (!artisan?.availability) {
      return defaultAvailability;
    }

    const rawAvailability = artisan.availability as Record<string, unknown>;
    const result: Record<string, string> = {};

    for (const [day, value] of Object.entries(rawAvailability)) {
      if (typeof value === 'string') {
        result[day] = value;
      } else if (value && typeof value === 'object') {
        // Handle object format with {start, end, enabled}
        const scheduleObj = value as { start?: string; end?: string; enabled?: boolean };
        if (scheduleObj.enabled === false) {
          result[day] = "Fermé";
        } else if (scheduleObj.start && scheduleObj.end) {
          result[day] = `${scheduleObj.start} - ${scheduleObj.end}`;
        } else {
          result[day] = "Non renseigné";
        }
      } else {
        result[day] = "Non renseigné";
      }
    }

    return result;
  };

  // Fetch artisan contact info when authenticated and showContactInfo is true
  // Priority: artisans.phone/email (imported data) > profiles.phone/email (user updated)
  useEffect(() => {
    const fetchArtisanContact = async () => {
      if (!isAuthenticated || !artisan?.id || !showContactInfo) return;
      
      // Get the artisan's direct contact info (phone, email) and profile_id
      const { data: artisanData, error: artisanError } = await supabase
        .from('artisans')
        .select('phone, email, profile_id')
        .eq('id', artisan.id)
        .single();
      
      if (artisanError) return;
      
      // Use artisan's direct phone/email first (imported data)
      let phone = artisanData?.phone || null;
      let email = artisanData?.email || null;
      
      // If artisan has a profile_id and missing contact info, fallback to profiles table
      if (artisanData?.profile_id && (!phone || !email)) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('phone, email')
          .eq('id', artisanData.profile_id)
          .single();
        
        if (!profileError && profileData) {
          phone = phone || profileData.phone;
          email = email || profileData.email;
        }
      }
      
      setArtisanContact({ phone, email });
    };
    
    fetchArtisanContact();
  }, [isAuthenticated, artisan?.id, showContactInfo]);

  // Loading state
  if (artisanLoading) {
    return <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-24 pb-8">
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
      </div>;
  }

  // Not found state
  if (!artisan) {
    return <div className="min-h-screen bg-background">
        <Navbar />
        <section className="pt-24 pb-8">
          <div className="container mx-auto px-4 text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Artisan non trouvé</h1>
            <p className="text-muted-foreground mb-6">Cet artisan n'existe pas ou n'est plus disponible.</p>
            <Button onClick={() => navigate('/trouver-artisan')}>
              Retour à la recherche
            </Button>
          </div>
        </section>
        <Footer />
      </div>;
  }
  const availability = getAvailability();
  const portfolio = artisan.portfolio_images || [];
  const rating = artisan.rating || 0;
  const reviewCount = artisan.review_count || 0;
  
  // Dynamic SEO meta for artisan profile
  const seoTitle = `${artisan.business_name} - ${artisan.category?.name || "Artisan"} à ${artisan.city}`;
  const seoDescription = `Découvrez ${artisan.business_name}, ${artisan.category?.name || "artisan"} à ${artisan.city}. ${rating.toFixed(1)}/5 (${reviewCount} avis). Demandez un devis gratuit.`;
  const seoCanonical = `https://artisansvalides.fr/artisan/${artisan.slug}`;
  
  return <div className="min-h-screen bg-background">
      <SEOHead 
        title={seoTitle}
        description={seoDescription}
        canonical={seoCanonical}
        ogImage={artisan.photo_url || undefined}
        ogType="profile"
      />
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-white/90 bg-navy rounded-lg px-4 py-2.5 w-fit mt-8">
            <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
            <span className="text-white/60">/</span>
            <Link to="/trouver-artisan" className="hover:text-white transition-colors">Artisans</Link>
            <span className="text-white/60">/</span>
            <span className="text-white font-medium">{artisan.business_name}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-4 md:py-8">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-8">
            
            {/* Mobile Contact Card - Sticky at top on mobile */}
            <div className="lg:hidden sticky top-16 z-30 -mx-3 px-3 py-2 bg-background/95 backdrop-blur-sm border-b">
              {artisan.status === 'prospect' ? (
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" 
                    size="sm" 
                    onClick={() => navigate(`/devenir-artisan?claim=${artisan.slug}`)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Revendiquer cette fiche
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <Button className="flex-1" size="sm" onClick={() => setChatOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Demander un devis
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowContactInfo(!showContactInfo)}>
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-8">
              
              {/* Profile Header */}
              <Card className="border-0 shadow-lg md:shadow-xl bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Photo & Badge */}
                    <div className="flex flex-col items-center gap-3">
                      <div 
                        className="relative"
                        onClick={() => hasActiveStories && setStoryViewerOpen(true)}
                      >
                        <Avatar className={cn(
                          "h-32 w-32 ring-4",
                          hasActiveStories ? "ring-green-500 cursor-pointer animate-story-pulse" : "ring-primary/20"
                        )}>
                          <AvatarImage src={artisan.photo_url || undefined} alt={artisan.business_name} />
                          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                            <img src={DEFAULT_AVATAR} alt="Avatar" className="w-full h-full object-cover" />
                          </AvatarFallback>
                        </Avatar>
                        {artisan.is_verified && <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg">
                            <Shield className="h-5 w-5" />
                          </div>}
                      </div>
                      {artisan.is_verified && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                          <Shield className="h-3 w-3 mr-1" />
                          Artisan Validé
                        </Badge>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                          {artisan.business_name}
                        </h1>
                        
                      </div>
                      
                      {/* Quick category badges in header - show first 2 only */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                        {((artisan as any).categories?.slice(0, 2) || (artisan.category ? [artisan.category] : [])).map((cat: { id: string; name: string }) => (
                          <Link key={cat.id} to={`/trouver-artisan?category=${encodeURIComponent(cat.name.toLowerCase())}`}>
                            <Badge variant="secondary" className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                              <Wrench className="h-3 w-3 mr-1" />
                              {cat.name}
                            </Badge>
                          </Link>
                        ))}
                        {(artisan as any).categories?.length > 2 && (
                          <Badge variant="outline" className="text-sm">
                            +{(artisan as any).categories.length - 2} autres
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>{artisan.city}{artisan.region ? `, ${artisan.region}` : ""}</span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          {renderStars(rating)}
                          <span className="font-semibold ml-1">{rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({reviewCount} avis)</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Répond en {"< 2h"}</span>
                        </div>
                      </div>

                      {artisan.description && (
                        <div className="mt-4">
                          <p className="text-muted-foreground leading-relaxed">
                            {descriptionExpanded || artisan.description.length <= 200
                              ? artisan.description
                              : `${artisan.description.slice(0, 200)}...`}
                          </p>
                          {artisan.description.length > 200 && (
                            <Button 
                              variant="link" 
                              className="px-0 h-auto text-primary"
                              onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                            >
                              {descriptionExpanded ? (
                                <>
                                  Voir moins <ChevronUp className="h-4 w-4 ml-1" />
                                </>
                              ) : (
                                <>
                                  Voir plus <ChevronDown className="h-4 w-4 ml-1" />
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Social Links */}
                      <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                        {artisan.facebook_url && <a href={artisan.facebook_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Facebook className="h-5 w-5" />
                          </a>}
                        {artisan.instagram_url && <a href={artisan.instagram_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Instagram className="h-5 w-5" />
                          </a>}
                        {artisan.linkedin_url && <a href={artisan.linkedin_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Linkedin className="h-5 w-5" />
                          </a>}
                        {artisan.website_url && <a href={artisan.website_url} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Globe className="h-5 w-5" />
                          </a>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categories Section */}
              {((artisan as any).categories?.length > 0 || artisan.category) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-primary" />
                      Catégories de l'artisan
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {/* Show multiple categories if available */}
                      {(artisan as any).categories?.length > 0 ? (
                        (artisan as any).categories.map((cat: { id: string; name: string }) => (
                          <Link 
                            key={cat.id} 
                            to={`/trouver-artisan?category=${encodeURIComponent(cat.name.toLowerCase())}`}
                          >
                            <Badge 
                              variant="secondary" 
                              className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3"
                            >
                              <Wrench className="h-3 w-3 mr-1.5" />
                              {cat.name}
                            </Badge>
                          </Link>
                        ))
                      ) : artisan.category?.name ? (
                        <Link to={`/trouver-artisan?category=${encodeURIComponent(artisan.category.name.toLowerCase())}`}>
                          <Badge 
                            variant="secondary" 
                            className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-1.5 px-3"
                          >
                            <Wrench className="h-3 w-3 mr-1.5" />
                            {artisan.category.name}
                          </Badge>
                        </Link>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Services Section - Collapsible on mobile */}
              <Collapsible defaultOpen className="md:block">
                <Card>
                  <CollapsibleTrigger className="w-full md:cursor-default">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary" />
                        Prestations proposées
                      </CardTitle>
                      <ChevronDown className="h-5 w-5 text-muted-foreground md:hidden transition-transform data-[state=open]:rotate-180" />
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 md:pt-0">
                      {servicesLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 md:h-20 rounded-lg" />)}
                        </div> : services && services.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                          {services.map(service => <div key={service.id} className="flex items-center justify-between p-3 md:p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm md:text-base truncate">{service.title}</p>
                                {service.duration && <p className="text-xs md:text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3 inline mr-1" />
                                    {service.duration}
                                  </p>}
                              </div>
                              {service.price ? (
                                <Badge variant="secondary" className="font-semibold shrink-0 ml-2 text-xs md:text-sm">
                                  {service.price}€
                                </Badge>
                              ) : (
                                <Badge className="bg-accent/10 text-accent border-accent/20 font-semibold shrink-0 ml-2 text-xs md:text-sm">
                                  Sur Devis
                                </Badge>
                              )}
                            </div>)}
                        </div> : <p className="text-muted-foreground text-center py-4">
                          Aucune prestation renseignée
                        </p>}
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Portfolio Section - Photos */}
              {portfolio.length > 0 && <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      Mes réalisations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PortfolioCarousel items={portfolio} type="image" onItemClick={(image, index) => {
                      setSelectedImage(image);
                      setSelectedImageIndex(index);
                    }} />
                  </CardContent>
                </Card>}

              {/* Portfolio Section - Videos */}
              {artisan.portfolio_videos && artisan.portfolio_videos.length > 0 && <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      Mes vidéos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PortfolioCarousel items={artisan.portfolio_videos} type="video" onItemClick={video => setSelectedVideo(video)} />
                  </CardContent>
                </Card>}

              {/* Zones & Availability - Collapsible on mobile */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                <Card>
                  <CardHeader className="pb-2 md:pb-4">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <MapPin className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                      Zone d'intervention
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                      <Badge variant="outline" className="py-1 md:py-1.5 text-xs md:text-sm">{artisan.city}</Badge>
                      {artisan.department && <Badge variant="outline" className="py-1 md:py-1.5 text-xs md:text-sm">{artisan.department}</Badge>}
                      {artisan.region && <Badge variant="outline" className="py-1 md:py-1.5 text-xs md:text-sm">{artisan.region}</Badge>}
                    </div>
                  </CardContent>
                </Card>

                <Collapsible defaultOpen className="md:block">
                  <Card>
                    <CollapsibleTrigger className="w-full md:cursor-default">
                      <CardHeader className="pb-2 md:pb-4 flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                          <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                          Heures de travail
                        </CardTitle>
                        <ChevronDown className="h-5 w-5 text-muted-foreground md:hidden" />
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="space-y-1.5 md:space-y-2 text-xs md:text-sm">
                          {[
                            { key: "lundi", label: "Lun" },
                            { key: "mardi", label: "Mar" },
                            { key: "mercredi", label: "Mer" },
                            { key: "jeudi", label: "Jeu" },
                            { key: "vendredi", label: "Ven" },
                            { key: "samedi", label: "Sam" },
                            { key: "dimanche", label: "Dim" },
                          ].map(({ key, label }) => {
                            const hours = availability[key] || "Non renseigné";
                            return (
                              <div key={key} className="flex justify-between py-0.5 md:py-1 border-b border-border/50 last:border-0">
                                <span className="text-muted-foreground">{label}</span>
                                <span className={hours === "Fermé" ? "text-muted-foreground" : "font-medium"}>
                                  {hours}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>

              {/* Certifications & Legal */}
              <div className="grid md:grid-cols-2 gap-6">
                {artisan.qualifications && artisan.qualifications.length > 0 && <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Certifications & Labels
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {artisan.qualifications.map((cert, index) => <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                              <Award className="h-5 w-5 text-emerald-600" />
                            </div>
                            <span className="font-medium">{cert}</span>
                          </div>)}
                      </div>
                    </CardContent>
                  </Card>}

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Informations légales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* SIRET and insurance_number are now protected and not exposed in public view */}
                    {artisan.is_verified && <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm">Documents vérifiés par notre équipe</span>
                      </div>}
                  </CardContent>
                </Card>
              </div>

              {/* Reviews Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-primary" />
                      Avis clients
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {renderStars(rating)}
                      <span className="font-bold text-lg">{rating.toFixed(1)}</span>
                      <span className="text-muted-foreground">/ 5</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {reviewsLoading ? <div className="space-y-4">
                      {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
                    </div> : reviews && reviews.length > 0 ? <div className="space-y-6">
                      {reviews.map((review: any) => {
                    const authorName = review.client ? `${review.client.first_name || ""} ${review.client.last_name?.charAt(0) || ""}.` : "Client";
                    const timeAgo = formatDistanceToNow(new Date(review.created_at), {
                      addSuffix: true,
                      locale: fr
                    });
                    return <div key={review.id} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                      {authorName.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{authorName}</p>
                                    <p className="text-xs text-muted-foreground">{timeAgo}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {renderStars(review.rating)}
                              </div>
                            </div>
                            {review.job_type && <Badge variant="outline" className="mb-2 text-xs">
                                {review.job_type}
                              </Badge>}
                            {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
                          </div>;
                  })}
                    </div> : <p className="text-center text-muted-foreground py-8">
                      Aucun avis pour le moment
                    </p>}
                </CardContent>
              </Card>

              {/* Leave Review */}
              <ReviewForm artisanName={artisan.business_name} isLoggedIn={false} onSubmit={review => {
              console.log("Nouvel avis:", review);
            }} />
            </div>

            {/* Right Column - Contact Card - Hidden on mobile (shown as sticky bar) */}
            <div className="hidden lg:block lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-xl bg-card">
                <CardContent className="p-6 space-y-4">
                  {artisan.status === 'prospect' ? (
                    <>
                      <div className="text-center mb-2">
                        <p className="text-sm text-muted-foreground mb-1">Vous êtes cet artisan ?</p>
                        <p className="text-2xl font-bold text-amber-600">Revendiquez votre fiche</p>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-sm text-muted-foreground text-center mb-3">
                          Cette fiche a été créée pour vous. Réclamez-la pour gérer votre profil et recevoir des demandes de clients.
                        </p>
                        <Button 
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white" 
                          size="lg" 
                          onClick={() => navigate(`/devenir-artisan?claim=${artisan.slug}`)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Revendiquer cette fiche
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center mb-2">
                        <p className="text-sm text-muted-foreground mb-1">Besoin d'un devis ?</p>
                        <p className="text-2xl font-bold text-primary">Contactez-moi</p>
                      </div>
                      
                      <Button className="w-full" size="lg" onClick={() => setChatOpen(true)}>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Demander un devis
                      </Button>
                      
                      <Button variant="outline" className="w-full" size="lg" onClick={() => setShowContactInfo(!showContactInfo)}>
                        <Phone className="h-4 w-4 mr-2" />
                        {showContactInfo ? "Masquer les contacts" : "Voir le téléphone"}
                      </Button>
                    </>
                  )}

                  {/* Contact Info revealed */}
                  {showContactInfo && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                      {isAuthenticated ? (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Phone className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Téléphone</p>
                              <p className="font-medium text-primary">
                                {artisanContact.phone || "Non renseigné"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Mail className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Email</p>
                              <p className="font-medium text-primary">
                                {artisanContact.email || "Non renseigné"}
                              </p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            Connectez-vous pour voir les coordonnées
                          </p>
                          <Button variant="outline" size="sm" onClick={() => navigate('/auth')}>
                            Se connecter
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{artisan.missions_completed || 0} interventions</p>
                        <p className="text-muted-foreground text-xs">réalisées sur la plateforme</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{artisan.experience_years || 0} ans d'expérience</p>
                        <p className="text-muted-foreground text-xs">dans le métier</p>
                      </div>
                    </div>
                    {artisan.hourly_rate}
                  </div>

                  {/* Share Section */}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3 flex items-center justify-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Partager ce profil
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleShare('facebook')} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors" title="Partager sur Facebook">
                        <Facebook className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleShare('whatsapp')} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors" title="Partager sur WhatsApp">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleShare('twitter')} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-black hover:text-white transition-colors" title="Partager sur X">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </button>
                      <button onClick={() => handleShare('linkedin')} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-colors" title="Partager sur LinkedIn">
                        <Linkedin className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleShare('copy')} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors" title="Copier le lien">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Availability Calendar */}
              <Card className="border-0 shadow-xl bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Disponibilités
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 sm:p-4">
                  <Calendar mode="single" month={calendarMonth} onMonthChange={setCalendarMonth} locale={fr} className="rounded-md border pointer-events-auto [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full" disabled={date => date < new Date()} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
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
            alt={`Réalisation ${selectedImageIndex + 1}`} 
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
      {selectedVideo && <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedVideo(null)}>
          <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10">
            <X className="h-6 w-6" />
          </button>
          <div className="w-full max-w-4xl aspect-video" onClick={e => e.stopPropagation()}>
            {selectedVideo.startsWith('blob:') ? <video src={selectedVideo} controls autoPlay className="w-full h-full rounded-lg" /> : selectedVideo.includes('youtube') || selectedVideo.includes('youtu.be') ? <iframe src={`https://www.youtube.com/embed/${selectedVideo.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/)?.[1]}?autoplay=1`} className="w-full h-full rounded-lg" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Vidéo" /> : selectedVideo.includes('vimeo') ? <iframe src={`https://player.vimeo.com/video/${selectedVideo.match(/vimeo\.com\/(\d+)/)?.[1]}?autoplay=1`} className="w-full h-full rounded-lg" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen title="Vidéo" /> : <video src={selectedVideo} controls autoPlay className="w-full h-full rounded-lg" />}
          </div>
        </div>}

      {/* Similar Artisans Carousel */}
      <SimilarArtisansCarousel currentArtisanId={artisan.id} categoryId={artisan.category_id} trade={artisan.category?.name || ""} />

      {/* CTA Section */}
      <section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Besoin d'un {artisan.category?.name?.toLowerCase() || "artisan"} de confiance ?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {artisan.business_name} répond en moyenne en moins de 2 heures. 
            Demandez un devis gratuit et sans engagement.
          </p>
          <Button size="lg" className="px-8" onClick={() => setChatOpen(true)}>
            Demander un devis gratuit
          </Button>
        </div>
      </section>

      {/* Chat Widget */}
      <ChatWidget defaultOpen={chatOpen} defaultArtisanId={artisan.id || undefined} defaultArtisanName={artisan.business_name} defaultArtisanPhoto={artisan.photo_url || undefined} />

      {/* Story Viewer */}
      <StoryViewer
        stories={stories}
        artisanName={artisan.business_name}
        artisanPhoto={artisan.photo_url}
        isOpen={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
      />

      <Footer />
    </div>;
};
export default ArtisanPublicProfile;