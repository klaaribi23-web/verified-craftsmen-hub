import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
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
import { MapPin, Phone, Mail, Star, Shield, Clock, CheckCircle2, FileCheck, MessageSquare, Wrench, Award, ThumbsUp, Facebook, Instagram, Linkedin, Globe, ExternalLink, Share2, Copy, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, UserPlus, Info, ShieldCheck, ArrowUp } from "lucide-react";
import CategoryIcon from "@/components/categories/CategoryIcon";
import RecommendationsSection from "@/components/artisan-profile/RecommendationsSection";
import { PortfolioCarousel } from "@/components/artisan-profile/PortfolioCarousel";
import { Video } from "lucide-react";
import SimilarArtisansCarousel from "@/components/artisan-search/SimilarArtisansCarousel";
import { fr } from "date-fns/locale";
import { formatDistanceToNow, format } from "date-fns";
import { useArtisanBySlug, useArtisanServices, useArtisanReviews } from "@/hooks/usePublicData";
import ChatWidget from "@/components/chat/ChatWidget";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePublicArtisanStories } from "@/hooks/usePublicArtisanStories";
import { cn, DEFAULT_AVATAR } from "@/lib/utils";
import StoryViewer from "@/components/stories/StoryViewer";
import { InterventionMap } from "@/components/artisan-profile/InterventionMap";
import ProfileNavigation from "@/components/artisan-profile/ProfileNavigation";

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
  
  // Determine which sections are visible for navigation (must be before early returns)
  const secondarySkills = (artisan as any)?.categories?.filter(
    (cat: { id: string }) => cat.id !== artisan?.category?.id
  ) || [];
  const hasWorkingHours = (artisan as any)?.working_hours && Object.keys((artisan as any).working_hours).length > 0;
  const portfolio = artisan?.portfolio_images || [];
  
  const visibleSections = useMemo(() => {
    if (!artisan) return [];
    const sections: string[] = ["description"]; // Always show description
    if (secondarySkills.length > 0) sections.push("competences");
    sections.push("prestations"); // Always show prestations
    if (portfolio.length > 0) sections.push("realisations");
    if (artisan.portfolio_videos && artisan.portfolio_videos.length > 0) sections.push("videos");
    if (hasWorkingHours) sections.push("horaires");
    sections.push("avis"); // Always show avis
    sections.push("recommandations"); // Always show
    return sections;
  }, [artisan, secondarySkills.length, portfolio.length, hasWorkingHours]);
  
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
      <LocalBusinessSchema
        name={artisan.business_name}
        image={artisan.photo_url || undefined}
        city={artisan.city}
        region={artisan.region || undefined}
        rating={rating}
        reviewCount={reviewCount}
        description={artisan.description || undefined}
      />
      <Navbar />
      
      {/* Spacer for navbar */}
      <div className="pt-20" />

      {/* Profile Navigation - Full width, sticky */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-sm border-b py-4">
        <div className="container mx-auto px-3 md:px-4">
          <ProfileNavigation visibleSections={visibleSections} />
        </div>
      </div>

      {/* Main Content */}
      <section className="py-4 md:py-8">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 md:gap-8">
            
            {/* Mobile Contact Card - Sticky at top on mobile */}
            <div className="lg:hidden sticky top-16 z-30 -mx-3 px-3 py-2 bg-background/95 backdrop-blur-sm border-b">
              <div className="space-y-2">
                {/* Bouton revendication si prospect */}
                {artisan.status === 'prospect' && (
                  <Button 
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white" 
                    size="sm" 
                    onClick={() => navigate(`/devenir-artisan?claim=${artisan.slug}`)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Revendiquer cette fiche
                  </Button>
                )}
                {/* Boutons contact - toujours visibles */}
                <div className="flex items-center justify-between gap-2">
                  <Button className="flex-1" size="sm" onClick={() => setChatOpen(true)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Demander un devis
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowContactInfo(!showContactInfo)}>
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-4 md:space-y-8">
              
              {/* Profile Header */}
              <Card>
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

                      {/* Stats Row */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          {renderStars(rating)}
                          <span className="font-semibold ml-1">{rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({reviewCount} avis)</span>
                        </div>
                      </div>


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

              {/* Le mot de l'artisan */}
              <Card id="description">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Le mot de l'artisan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <p className="text-muted-foreground italic leading-relaxed text-sm md:text-base">
                      "{artisan.description || "Artisan passionné par mon métier, je mets tout mon savoir-faire au service de mes clients. Qualité, ponctualité et satisfaction sont mes priorités. N'hésitez pas à me contacter pour discuter de votre projet et obtenir un devis personnalisé adapté à vos besoins."}"
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Pourquoi cet artisan est validé - Colorful badges */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Pourquoi cet artisan est validé ?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Identité vérifiée */}
                    <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/80 dark:bg-white/10 border border-emerald-200 dark:border-emerald-500/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mb-2">
                        <CheckCircle2 className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight">Identité vérifiée</span>
                    </div>

                    {/* SIRET contrôlé */}
                    <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/80 dark:bg-white/10 border border-blue-200 dark:border-blue-500/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center mb-2">
                        <FileCheck className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight">SIRET & assurances</span>
                    </div>

                    {/* Expérience */}
                    {artisan.experience_years && artisan.experience_years > 0 && (
                      <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/80 dark:bg-white/10 border border-amber-200 dark:border-amber-500/30 shadow-sm hover:shadow-md transition-shadow">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-2">
                          <Award className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xs font-medium text-foreground leading-tight">{artisan.experience_years} ans d'expérience</span>
                      </div>
                    )}

                    {/* Avis authentifiés */}
                    <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/80 dark:bg-white/10 border border-purple-200 dark:border-purple-500/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center mb-2">
                        <Star className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight">Avis authentifiés</span>
                    </div>

                    {/* Charte qualité */}
                    <div className="flex flex-col items-center text-center p-3 rounded-xl bg-white/80 dark:bg-white/10 border border-rose-200 dark:border-rose-500/30 shadow-sm hover:shadow-md transition-shadow">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center mb-2">
                        <ThumbsUp className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-foreground leading-tight">Charte qualité signée</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Compétences secondaires - liste verticale avec coches vertes */}
              {(() => {
                const secondarySkills = (artisan as any).categories?.filter(
                  (cat: { id: string }) => cat.id !== artisan.category?.id
                ) || [];
                
                if (secondarySkills.length === 0) return null;
                
                return (
                  <Card id="competences">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
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
                            <span className="font-medium">{skill.name}</span>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Services Section - Collapsible on mobile */}
              <Collapsible defaultOpen className="md:block">
                <Card id="prestations">
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
              {portfolio.length > 0 && <Card id="realisations">
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
              {artisan.portfolio_videos && artisan.portfolio_videos.length > 0 && <Card id="videos">
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

              {/* Working Hours & Infos pratiques - Side by side layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Working Hours Card */}
                {(artisan as any).working_hours && Object.keys((artisan as any).working_hours).length > 0 && (
                  <Card id="horaires">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
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
                        ].map(day => {
                          const hours = (artisan as any).working_hours?.[day.key];
                          if (!hours) return null;
                          
                          const isEnabled = hours.enabled !== false;
                          const displayTime = isEnabled 
                            ? `${hours.start || "08:00"} - ${hours.end || "18:00"}`
                            : "Fermé";
                          
                          return (
                            <div 
                              key={day.key} 
                              className="flex items-center justify-between py-2"
                            >
                              <span className="font-medium">{day.label}</span>
                              <span className={cn(
                                "text-sm font-semibold",
                                isEnabled ? "text-primary" : "text-red-500"
                              )}>
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
                <Card id="infos-pratiques" className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-background">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Infos pratiques
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TooltipProvider delayDuration={200}>
                      <div className="space-y-4">
                        {/* Zone d'intervention */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 cursor-help transition-colors hover:bg-blue-500/10">
                              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                <MapPin className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Zone d'intervention</p>
                                <p className="font-semibold">
                                  {artisan.city}
                                  {artisan.postal_code && ` (${artisan.postal_code})`}
                                  {artisan.intervention_radius && artisan.intervention_radius > 0 && (
                                    <span className="text-primary ml-1">
                                      + {artisan.intervention_radius} km
                                    </span>
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
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 cursor-help transition-colors hover:bg-emerald-500/10">
                              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <FileCheck className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">N° SIRET</p>
                                <p className="font-semibold font-mono tracking-wide">
                                  {(artisan as any).siret || <span className="text-muted-foreground italic">En attente</span>}
                                </p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>Numéro d'identification unique de l'entreprise, garantissant son existence légale en France.</p>
                          </TooltipContent>
                        </Tooltip>

                        {/* Dernière vérification - only for active artisans */}
                        {artisan.status === 'active' && artisan.updated_at && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 cursor-help transition-colors hover:bg-amber-500/10">
                                <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                  <ShieldCheck className="h-5 w-5 text-amber-600" />
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
                              <p>Date à laquelle notre équipe a vérifié et validé le profil et les documents de cet artisan.</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {/* Documents vérifiés */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/20 cursor-help transition-colors hover:bg-purple-500/10">
                              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                                <Shield className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Documents légaux</p>
                                <p className="font-semibold">Vérifiés par la plateforme</p>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p>RC Pro, garantie décennale, KBIS et pièce d'identité vérifiés par notre équipe de modération.</p>
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
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
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

              {/* Google Reviews Section */}
              {(artisan as any).google_rating && (artisan as any).google_rating > 0 && (
                <Card className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/30 dark:to-background border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <CardTitle className="flex items-center gap-2">
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Avis Google
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {renderStars((artisan as any).google_rating)}
                        <span className="font-bold text-lg">{((artisan as any).google_rating as number).toFixed(1)}</span>
                        <span className="text-muted-foreground">({(artisan as any).google_review_count || 0} avis)</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {(artisan as any).google_maps_url && (
                      <a 
                        href={(artisan as any).google_maps_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Voir tous les avis sur Google
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Reviews Section */}
              <Card id="avis">
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

              {/* Recommandations Section */}
              <div id="recommandations">
                <RecommendationsSection
                  artisanId={artisan.id}
                  artisanName={artisan.business_name}
                  isLoggedIn={isAuthenticated}
                />
              </div>
            </div>

            {/* Right Column - Contact Card - Hidden on mobile (shown as sticky bar) */}
            <div className="hidden lg:block lg:col-span-1 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  {/* Encart Revendication - Uniquement pour prospect */}
                  {artisan.status === 'prospect' && (
                    <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
                      <div className="text-center mb-3">
                        <p className="text-sm text-muted-foreground mb-1">Vous êtes cet artisan ?</p>
                        <p className="text-lg font-bold text-amber-600">Revendiquez votre fiche</p>
                      </div>
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
                  )}

                  {/* Boutons Contact - Pour TOUS les artisans (prospect + active + pending) */}
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

              {/* Mini-carte zone d'intervention */}
              {artisan.latitude && artisan.longitude && artisan.intervention_radius && artisan.intervention_radius > 0 && (
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

      {/* Breadcrumb - Bottom of page */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Accueil</Link>
            <span>/</span>
            <Link to="/trouver-artisan" className="hover:text-foreground transition-colors">Artisans</Link>
            <span>/</span>
            <span className="text-foreground font-semibold italic">{artisan.business_name}</span>
          </nav>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="gap-2"
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