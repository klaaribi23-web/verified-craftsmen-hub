import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
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
  Copy,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Link } from "react-router-dom";
import ReviewForm from "@/components/artisan-profile/ReviewForm";
import SimilarArtisansCarousel from "@/components/artisan-search/SimilarArtisansCarousel";
import { fr } from "date-fns/locale";

// Données fictives pour la démo
const artisanData = {
  id: "1",
  firstName: "Jean-Pierre",
  lastName: "Martin",
  photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face",
  trade: "Plombier",
  specialty: "Chauffagiste",
  city: "Paris 15ème",
  region: "Île-de-France",
  rating: 4.8,
  reviewCount: 127,
  responseTime: "< 2h",
  completedJobs: 342,
  yearsExperience: 15,
  isVerified: true,
  isAvailable: true,
  description: "Plombier chauffagiste expérimenté avec plus de 15 ans d'expérience dans le domaine. Spécialisé dans l'installation et la maintenance de systèmes de chauffage, la réparation de fuites, et tous travaux de plomberie générale. Je m'engage à fournir un travail de qualité avec des délais respectés.",
  phone: "06 XX XX XX XX",
  email: "contact@jp-plomberie.fr",
  siret: "123 456 789 00012",
  insuranceCompany: "AXA Professionnels",
  insuranceNumber: "POL-2024-XXXXX",
  socialLinks: {
    facebook: "https://facebook.com/jp-plomberie",
    instagram: "https://instagram.com/jp_plomberie",
    linkedin: "https://linkedin.com/in/jp-martin",
    website: "https://jp-plomberie.fr"
  },
  certifications: [
    { name: "RGE QualiPAC", icon: Award },
    { name: "Qualibat", icon: Shield },
    { name: "Professionnel du Gaz", icon: CheckCircle2 }
  ],
  services: [
    { name: "Dépannage plomberie", price: "À partir de 60€", duration: "1-2h" },
    { name: "Installation chauffe-eau", price: "À partir de 250€", duration: "2-4h" },
    { name: "Réparation fuite", price: "À partir de 80€", duration: "1-2h" },
    { name: "Installation chauffage", price: "Sur devis", duration: "1-3 jours" },
    { name: "Débouchage canalisation", price: "À partir de 90€", duration: "1-2h" },
    { name: "Remplacement robinetterie", price: "À partir de 70€", duration: "1h" }
  ],
  serviceAreas: ["Paris 15ème", "Paris 14ème", "Paris 16ème", "Boulogne-Billancourt", "Issy-les-Moulineaux", "Vanves"],
  availability: {
    lundi: "8h - 19h",
    mardi: "8h - 19h",
    mercredi: "8h - 19h",
    jeudi: "8h - 19h",
    vendredi: "8h - 19h",
    samedi: "9h - 17h",
    dimanche: "Fermé"
  },
  portfolio: [
    "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558618047-f4b511afd745?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop"
  ],
  reviews: [
    {
      id: 1,
      author: "Marie L.",
      rating: 5,
      date: "Il y a 2 jours",
      comment: "Excellent travail ! Jean-Pierre est intervenu rapidement pour une fuite urgente. Très professionnel, ponctuel et tarifs honnêtes. Je recommande vivement.",
      jobType: "Réparation fuite",
      photos: [
        "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop"
      ]
    },
    {
      id: 2,
      author: "Thomas B.",
      rating: 5,
      date: "Il y a 1 semaine",
      comment: "Installation d'un nouveau chauffe-eau thermodynamique. Travail soigné, explications claires et chantier laissé propre. Parfait !",
      jobType: "Installation chauffe-eau",
      photos: [
        "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=200&h=200&fit=crop",
        "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=200&h=200&fit=crop"
      ]
    },
    {
      id: 3,
      author: "Sophie M.",
      rating: 4,
      date: "Il y a 2 semaines",
      comment: "Très bon professionnel. Intervention rapide pour un débouchage. Seul petit bémol : un léger retard à l'arrivée, mais prévenu par téléphone.",
      jobType: "Débouchage canalisation",
      photos: []
    },
    {
      id: 4,
      author: "Pierre D.",
      rating: 5,
      date: "Il y a 3 semaines",
      comment: "Jean-Pierre a installé tout notre système de chauffage. Un travail remarquable, dans les délais et le budget annoncés. Très satisfait !",
      jobType: "Installation chauffage",
      photos: [
        "https://images.unsplash.com/photo-1558618047-f4b511afd745?w=200&h=200&fit=crop"
      ]
    }
  ],
  calendarAvailability: {
    available: [3, 4, 5, 6, 10, 11, 12, 17, 18, 19, 20, 24, 25, 26, 27],
    unavailable: [7, 8, 13, 14, 15, 21, 22, 28, 29]
  }
};

const ArtisanPublicProfile = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [reviewPhotoIndex, setReviewPhotoIndex] = useState<Record<number, number>>({});
  const [showContactInfo, setShowContactInfo] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = (platform: string) => {
    const shareText = `Découvrez ${artisanData.firstName} ${artisanData.lastName}, ${artisanData.trade} sur Artisans Validés`;
    
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

  const isDateAvailable = (date: Date) => {
    const day = date.getDate();
    return artisanData.calendarAvailability.available.includes(day);
  };

  const isDateUnavailable = (date: Date) => {
    const day = date.getDate();
    return artisanData.calendarAvailability.unavailable.includes(day);
  };

  const nextReviewPhoto = (reviewId: number, totalPhotos: number) => {
    setReviewPhotoIndex(prev => ({
      ...prev,
      [reviewId]: ((prev[reviewId] || 0) + 1) % totalPhotos
    }));
  };

  const prevReviewPhoto = (reviewId: number, totalPhotos: number) => {
    setReviewPhotoIndex(prev => ({
      ...prev,
      [reviewId]: ((prev[reviewId] || 0) - 1 + totalPhotos) % totalPhotos
    }));
  };

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
            <span className="text-white font-medium">{artisanData.firstName} {artisanData.lastName}</span>
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
                          <AvatarImage src={artisanData.photo} alt={artisanData.firstName} />
                          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                            {artisanData.firstName[0]}{artisanData.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        {artisanData.isVerified && (
                          <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white rounded-full p-1.5 shadow-lg">
                            <Shield className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      {artisanData.isVerified && (
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
                          {artisanData.firstName} {artisanData.lastName}
                        </h1>
                        {artisanData.isAvailable && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 w-fit mx-auto md:mx-0">
                            <span className="h-2 w-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                            Disponible
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
                        <Link to={`/trouver-artisan?categorie=${encodeURIComponent(artisanData.trade.toLowerCase())}`}>
                          <Badge variant="secondary" className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                            <Wrench className="h-3 w-3 mr-1" />
                            {artisanData.trade}
                          </Badge>
                        </Link>
                        <Link to={`/trouver-artisan?categorie=${encodeURIComponent(artisanData.specialty.toLowerCase())}`}>
                          <Badge variant="outline" className="text-sm cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                            {artisanData.specialty}
                          </Badge>
                        </Link>
                      </div>

                      <div className="flex items-center justify-center md:justify-start gap-1 text-muted-foreground mb-4">
                        <MapPin className="h-4 w-4" />
                        <span>{artisanData.city}, {artisanData.region}</span>
                      </div>

                      {/* Stats Row */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          {renderStars(artisanData.rating)}
                          <span className="font-semibold ml-1">{artisanData.rating}</span>
                          <span className="text-muted-foreground">({artisanData.reviewCount} avis)</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Répond en {artisanData.responseTime}</span>
                        </div>
                      </div>

                      <p className="mt-4 text-muted-foreground leading-relaxed">
                        {artisanData.description}
                      </p>

                      {/* Social Links */}
                      <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
                        {artisanData.socialLinks.facebook && (
                          <a 
                            href={artisanData.socialLinks.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                        {artisanData.socialLinks.instagram && (
                          <a 
                            href={artisanData.socialLinks.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {artisanData.socialLinks.linkedin && (
                          <a 
                            href={artisanData.socialLinks.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                        {artisanData.socialLinks.website && (
                          <a 
                            href={artisanData.socialLinks.website} 
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
                  <div className="grid sm:grid-cols-2 gap-3">
                    {artisanData.services.map((service, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {service.duration}
                          </p>
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {service.price}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Section - Grid 6 photos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    Mes réalisations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {artisanData.portfolio.map((image, index) => (
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

              {/* Zones & Availability */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Zones d'intervention
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {artisanData.serviceAreas.map((area, index) => (
                        <Badge key={index} variant="outline" className="py-1.5">
                          {area}
                        </Badge>
                      ))}
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
                      {Object.entries(artisanData.availability).map(([day, hours]) => (
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Certifications & Labels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {artisanData.certifications.map((cert, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20"
                        >
                          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <cert.icon className="h-5 w-5 text-emerald-600" />
                          </div>
                          <span className="font-medium">{cert.name}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Informations légales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">SIRET</p>
                      <p className="font-medium">{artisanData.siret}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">Assurance décennale</p>
                      <p className="font-medium">{artisanData.insuranceCompany}</p>
                      <p className="text-sm text-muted-foreground">N° {artisanData.insuranceNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="text-sm">Documents vérifiés par notre équipe</span>
                    </div>
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
                      {renderStars(artisanData.rating)}
                      <span className="font-bold text-lg">{artisanData.rating}</span>
                      <span className="text-muted-foreground">/ 5</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {artisanData.reviews.map((review) => (
                      <div key={review.id} className="border-b border-border/50 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {review.author.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{review.author}</p>
                                <p className="text-xs text-muted-foreground">{review.date}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <Badge variant="outline" className="mb-2 text-xs">
                          {review.jobType}
                        </Badge>
                        <p className="text-muted-foreground mb-3">{review.comment}</p>
                        
                        {/* Photos de preuves du client - 3 par 3 */}
                        {review.photos && review.photos.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {review.photos.slice(0, 3).map((photo, idx) => (
                                <div 
                                  key={idx} 
                                  className="relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => setSelectedImage(photo)}
                                >
                                  <img
                                    src={photo}
                                    alt={`Photo ${idx + 1} de ${review.author}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                              {review.photos.length > 3 && (
                                <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground">
                                  +{review.photos.length - 3} photos
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground mt-2 block">
                              {review.photos.length} photo{review.photos.length > 1 ? 's' : ''} du client
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button variant="outline" className="w-full mt-6">
                    Voir tous les avis
                  </Button>
                </CardContent>
              </Card>

              {/* Leave Review */}
              <ReviewForm 
                artisanName={`${artisanData.firstName} ${artisanData.lastName}`}
                isLoggedIn={false}
                onSubmit={(review) => {
                  console.log("Nouvel avis:", review);
                }}
              />
            </div>

            {/* Right Column - Contact Card (not sticky anymore) */}
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
                      onClick={() => navigate('/artisan/messaging')}
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
                            <a href={`tel:${artisanData.phone.replace(/\s/g, '')}`} className="font-medium text-primary hover:underline">
                              {artisanData.phone}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <a href={`mailto:${artisanData.email}`} className="font-medium text-primary hover:underline">
                              {artisanData.email}
                            </a>
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
                          <p className="font-medium">{artisanData.completedJobs} interventions</p>
                          <p className="text-muted-foreground text-xs">réalisées sur la plateforme</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Award className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{artisanData.yearsExperience} ans d'expérience</p>
                          <p className="text-muted-foreground text-xs">dans le métier</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ThumbsUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">98% de clients satisfaits</p>
                          <p className="text-muted-foreground text-xs">recommandent cet artisan</p>
                        </div>
                      </div>
                    </div>

                    {/* Social Links in Contact Card */}
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-3 text-center">Suivez-moi</p>
                      <div className="flex items-center justify-center gap-2">
                        {artisanData.socialLinks.facebook && (
                          <a 
                            href={artisanData.socialLinks.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-[#1877F2] hover:text-white transition-colors"
                          >
                            <Facebook className="h-4 w-4" />
                          </a>
                        )}
                        {artisanData.socialLinks.instagram && (
                          <a 
                            href={artisanData.socialLinks.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-gradient-to-br hover:from-[#833AB4] hover:via-[#FD1D1D] hover:to-[#F77737] hover:text-white transition-colors"
                          >
                            <Instagram className="h-4 w-4" />
                          </a>
                        )}
                        {artisanData.socialLinks.linkedin && (
                          <a 
                            href={artisanData.socialLinks.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-[#0A66C2] hover:text-white transition-colors"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                        )}
                        {artisanData.socialLinks.website && (
                          <a 
                            href={artisanData.socialLinks.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-9 w-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Globe className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Share Section - moved here below social links */}
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
                      Disponibilités de l'artisan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2 sm:p-4">
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-emerald-500"></span>
                        <span>Disponible</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-muted-foreground/30 relative">
                          <span className="absolute inset-0 flex items-center justify-center">
                            <span className="w-full h-0.5 bg-red-500 rotate-45"></span>
                          </span>
                        </span>
                        <span>Indisponible</span>
                      </div>
                    </div>
                    <Calendar
                      mode="single"
                      month={calendarMonth}
                      onMonthChange={setCalendarMonth}
                      locale={fr}
                      className="rounded-md border pointer-events-auto [&_.rdp-months]:w-full [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-head_row]:flex [&_.rdp-head_row]:w-full [&_.rdp-head_row]:justify-between [&_.rdp-row]:flex [&_.rdp-row]:w-full [&_.rdp-row]:justify-between [&_.rdp-cell]:flex-1 [&_.rdp-head_cell]:flex-1 [&_.rdp-day]:w-full"
                      modifiers={{
                        available: (date) => isDateAvailable(date),
                        unavailable: (date) => isDateUnavailable(date)
                      }}
                      modifiersStyles={{
                        available: { 
                          backgroundColor: 'hsl(142.1 76.2% 36.3%)', 
                          color: 'white',
                          borderRadius: '6px'
                        },
                        unavailable: { 
                          backgroundColor: 'hsl(0 0% 90%)', 
                          color: 'hsl(0 0% 60%)',
                          textDecoration: 'line-through',
                          borderRadius: '6px'
                        }
                      }}
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
      <SimilarArtisansCarousel currentArtisanId={artisanData.id} trade={artisanData.trade} />

      {/* CTA Section */}
      <section className="py-12 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Besoin d'un {artisanData.trade.toLowerCase()} de confiance ?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {artisanData.firstName} répond en moyenne en moins de 2 heures. 
            Demandez un devis gratuit et sans engagement.
          </p>
          <Button size="lg" className="px-8" onClick={() => navigate('/artisan/messaging')}>
            Demander un devis gratuit
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ArtisanPublicProfile;
