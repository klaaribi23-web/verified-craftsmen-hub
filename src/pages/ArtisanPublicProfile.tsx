import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  MapPin, 
  Phone, 
  Mail,
  Star, 
  Shield, 
  Clock, 
  CheckCircle2, 
  FileCheck, 
  Calendar as CalendarIcon,
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
  Copy
} from "lucide-react";
import { Link } from "react-router-dom";
import ReviewForm from "@/components/artisan-profile/ReviewForm";
import SimilarArtisansCarousel from "@/components/artisan-search/SimilarArtisansCarousel";
import { fr } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { useArtisanById, useArtisanServices, useArtisanReviews } from "@/hooks/usePublicData";

const ArtisanPublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showContactInfo, setShowContactInfo] = useState(false);

  // Fetch dynamic data
  const { data: artisan, isLoading: artisanLoading } = useArtisanById(id || "");
  const { data: services, isLoading: servicesLoading } = useArtisanServices(id || "");
  const { data: reviews, isLoading: reviewsLoading } = useArtisanReviews(id || "");

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
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? "fill-amber-400 text-amber-400"
            : i < rating
            ? "fill-amber-400/50 text-amber-400"
            : "text-muted-foreground/30"
        }`}
      />
    ));
  };

  // Parse availability from JSON
  const getAvailability = () => {
    if (!artisan?.availability) {
      return {
        lundi: "8h - 18h",
        mardi: "8h - 18h",
        mercredi: "8h - 18h",
        jeudi: "8h - 18h",
        vendredi: "8h - 18h",
        samedi: "9h - 17h",
        dimanche: "Fermé"
      };
    }
    return artisan.availability as Record<string, string>;
  };

  // Loading state
  if (artisanLoading) {
    return (
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  // Not found state
  if (!artisan) {
    return (
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  const availability = getAvailability();
  const portfolio = artisan.portfolio_images || [];
  const rating = artisan.rating || 0;
  const reviewCount = artisan.review_count || 0;

  return (
    <div className="min-h-screen bg-background">
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
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Profile Header */}
              <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Photo & Badge */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-32 w-32 ring-4 ring-primary/20">
                          <AvatarImage src={artisan.photo_url || undefined} alt={artisan.business_name} />
                          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                            {artisan.business_name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {artisan.is_verified && (
                          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg">
                            <Shield className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      {artisan.is_verified && (
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">
                          <Shield className="h-3 w-3 mr-1" />
                          Artisan Validé
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                          {artisan.business_name}
                        </h1>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 w-fit mx-auto md:mx-0">
                          <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                          Disponible
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                        {artisan.category?.name && (
                          <Link to={`/trouver-artisan?category=${encodeURIComponent(artisan.category.name.toLowerCase())}`}>
                            <Badge variant="secondary" className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                              <Wrench className="h-3 w-3 mr-1" />
                              {artisan.category.name}
                            </Badge>
                          </Link>
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
                        <p className="mt-4 text-muted-foreground leading-relaxed">
                          {artisan.description}
                        </p>
                      )}

                      {/* Social Links */}
                      <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                        {artisan.facebook_url && (
                          <a 
                            href={artisan.facebook_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {artisan.instagram_url && (
                          <a 
                            href={artisan.instagram_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {artisan.linkedin_url && (
                          <a 
                            href={artisan.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                        {artisan.website_url && (
                          <a 
                            href={artisan.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Globe className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    Prestations proposées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {servicesLoading ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[1,2,3,4].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))}
                    </div>
                  ) : services && services.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {services.map((service) => (
                        <div 
                          key={service.id}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <p className="font-medium">{service.title}</p>
                            {service.duration && (
                              <p className="text-sm text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {service.duration}
                              </p>
                            )}
                          </div>
                          {service.price && (
                            <Badge variant="secondary" className="font-semibold">
                              {service.price}€
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Aucune prestation renseignée
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Portfolio Section */}
              {portfolio.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      Mes réalisations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {portfolio.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(image)}
                          className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
                        >
                          <img
                            src={image}
                            alt={`Réalisation ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ExternalLink className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Zones & Availability */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Zone d'intervention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="py-1.5">{artisan.city}</Badge>
                      {artisan.department && (
                        <Badge variant="outline" className="py-1.5">{artisan.department}</Badge>
                      )}
                      {artisan.region && (
                        <Badge variant="outline" className="py-1.5">{artisan.region}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Heures de travail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {Object.entries(availability).map(([day, hours]) => (
                        <div key={day} className="flex justify-between py-1 border-b border-border/50 last:border-0">
                          <span className="capitalize text-muted-foreground">{day}</span>
                          <span className={hours === "Fermé" ? "text-muted-foreground" : "font-medium"}>
                            {hours}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Certifications & Legal */}
              <div className="grid md:grid-cols-2 gap-6">
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

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Informations légales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {artisan.siret && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">SIRET</p>
                        <p className="font-medium">{artisan.siret}</p>
                      </div>
                    )}
                    {artisan.insurance_number && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">Assurance décennale</p>
                        <p className="font-medium">N° {artisan.insurance_number}</p>
                      </div>
                    )}
                    {artisan.is_verified && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm">Documents vérifiés par notre équipe</span>
                      </div>
                    )}
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
                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[1,2,3].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                      ))}
                    </div>
                  ) : reviews && reviews.length > 0 ? (
                    <div className="space-y-6">
                      {reviews.map((review: any) => {
                        const authorName = review.client 
                          ? `${review.client.first_name || ""} ${review.client.last_name?.charAt(0) || ""}.`
                          : "Client";
                        const timeAgo = formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: fr,
                        });

                        return (
                          <div key={review.id} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
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
                            {review.job_type && (
                              <Badge variant="outline" className="mb-2 text-xs">
                                {review.job_type}
                              </Badge>
                            )}
                            {review.comment && (
                              <p className="text-muted-foreground">{review.comment}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun avis pour le moment
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Leave Review */}
              <ReviewForm 
                artisanName={artisan.business_name}
                isLoggedIn={false}
                onSubmit={(review) => {
                  console.log("Nouvel avis:", review);
                }}
              />
            </div>

            {/* Right Column - Contact Card */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-xl bg-card">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center mb-2">
                    <p className="text-sm text-muted-foreground mb-1">Besoin d'un devis ?</p>
                    <p className="text-2xl font-bold text-primary">Contactez-moi</p>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate(`/client/messagerie?artisan=${artisan.id}&name=${encodeURIComponent(artisan.business_name)}`)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Demander un devis
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    size="lg"
                    onClick={() => setShowContactInfo(!showContactInfo)}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    {showContactInfo ? "Masquer les contacts" : "Voir le téléphone"}
                  </Button>

                  {/* Contact Info revealed */}
                  {showContactInfo && (
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Téléphone</p>
                          <p className="font-medium text-primary">Connectez-vous pour voir</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium text-primary">Connectez-vous pour voir</p>
                        </div>
                      </div>
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
                    {artisan.hourly_rate && (
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ThumbsUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{artisan.hourly_rate}€/h</p>
                          <p className="text-muted-foreground text-xs">tarif horaire</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Share Section */}
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-3 flex items-center justify-center gap-2">
                      <Share2 className="h-4 w-4" />
                      Partager ce profil
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleShare('facebook')}
                        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors"
                        title="Partager sur Facebook"
                      >
                        <Facebook className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-[#25D366] hover:text-white transition-colors"
                        title="Partager sur WhatsApp"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                        title="Partager sur X"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleShare('linkedin')}
                        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-colors"
                        title="Partager sur LinkedIn"
                      >
                        <Linkedin className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                        title="Copier le lien"
                      >
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
                  <Calendar
                    mode="single"
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    locale={fr}
                    className="rounded-md border pointer-events-auto [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full"
                    disabled={(date) => date < new Date()}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Réalisation" 
            className="max-w-full max-h-[90vh] rounded-lg"
          />
        </div>
      )}

      {/* Similar Artisans Carousel */}
      <SimilarArtisansCarousel 
        currentArtisanId={artisan.id} 
        categoryId={artisan.category_id} 
        trade={artisan.category?.name || ""} 
      />

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
          <Button size="lg" className="px-8" onClick={() => navigate(`/client/messagerie?artisan=${artisan.id}&name=${encodeURIComponent(artisan.business_name)}`)}>
            Demander un devis gratuit
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ArtisanPublicProfile;
