import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Shield, 
  Clock, 
  CheckCircle2, 
  FileCheck, 
  Calendar,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Euro,
  Wrench,
  Award,
  ThumbsUp
} from "lucide-react";
import { Link } from "react-router-dom";
import ReviewForm from "@/components/artisan-profile/ReviewForm";

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
    monday: "8h - 19h",
    tuesday: "8h - 19h",
    wednesday: "8h - 19h",
    thursday: "8h - 19h",
    friday: "8h - 19h",
    saturday: "9h - 17h",
    sunday: "Fermé"
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
      jobType: "Réparation fuite"
    },
    {
      id: 2,
      author: "Thomas B.",
      rating: 5,
      date: "Il y a 1 semaine",
      comment: "Installation d'un nouveau chauffe-eau thermodynamique. Travail soigné, explications claires et chantier laissé propre. Parfait !",
      jobType: "Installation chauffe-eau"
    },
    {
      id: 3,
      author: "Sophie M.",
      rating: 4,
      date: "Il y a 2 semaines",
      comment: "Très bon professionnel. Intervention rapide pour un débouchage. Seul petit bémol : un léger retard à l'arrivée, mais prévenu par téléphone.",
      jobType: "Débouchage canalisation"
    },
    {
      id: 4,
      author: "Pierre D.",
      rating: 5,
      date: "Il y a 3 semaines",
      comment: "Jean-Pierre a installé tout notre système de chauffage. Un travail remarquable, dans les délais et le budget annoncés. Très satisfait !",
      jobType: "Installation chauffage"
    }
  ]
};

const ArtisanPublicProfile = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === artisanData.portfolio.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? artisanData.portfolio.length - 1 : prev - 1
    );
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 pt-24 pb-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/" className="hover:text-primary transition-colors">Accueil</Link>
            <span>/</span>
            <Link to="/trouver-artisan" className="hover:text-primary transition-colors">Artisans</Link>
            <span>/</span>
            <span className="text-foreground">{artisanData.firstName} {artisanData.lastName}</span>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Info Card */}
            <div className="lg:col-span-2">
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
                        <Badge variant="secondary" className="text-sm">
                          <Wrench className="h-3 w-3 mr-1" />
                          {artisanData.trade}
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                          {artisanData.specialty}
                        </Badge>
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
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* CTA Card */}
            <div className="lg:col-span-1">
              <Card className="border-0 shadow-xl bg-card sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Besoin d'un devis ?</p>
                    <p className="text-2xl font-bold text-primary">Contactez-moi</p>
                  </div>
                  
                  <Link to="/demande-devis">
                    <Button className="w-full" size="lg">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Demander un devis gratuit
                    </Button>
                  </Link>
                  
                  <Button variant="outline" className="w-full" size="lg">
                    <Phone className="h-4 w-4 mr-2" />
                    Voir le téléphone
                  </Button>

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
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="services" className="w-full">
            <TabsList className="w-full md:w-auto flex flex-wrap justify-start gap-1 h-auto p-1 bg-muted/50">
              <TabsTrigger value="services" className="flex-1 md:flex-none">Prestations</TabsTrigger>
              <TabsTrigger value="portfolio" className="flex-1 md:flex-none">Réalisations</TabsTrigger>
              <TabsTrigger value="reviews" className="flex-1 md:flex-none">Avis ({artisanData.reviewCount})</TabsTrigger>
              <TabsTrigger value="info" className="flex-1 md:flex-none">Informations</TabsTrigger>
            </TabsList>

            {/* Services Tab */}
            <TabsContent value="services" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-primary" />
                      Prestations proposées
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {artisanData.services.map((service, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {service.duration}
                            </p>
                          </div>
                          <Badge variant="secondary" className="font-semibold">
                            <Euro className="h-3 w-3 mr-1" />
                            {service.price}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

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
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        Disponibilités
                      </h4>
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mes réalisations</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Main Image */}
                  <div className="relative rounded-lg overflow-hidden mb-4 aspect-video bg-muted">
                    <img
                      src={artisanData.portfolio[currentImageIndex]}
                      alt={`Réalisation ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm p-2 rounded-full hover:bg-background transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {artisanData.portfolio.length}
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="grid grid-cols-6 gap-2">
                    {artisanData.portfolio.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden ${
                          currentImageIndex === index 
                            ? "ring-2 ring-primary" 
                            : "opacity-70 hover:opacity-100"
                        } transition-all`}
                      >
                        <img
                          src={image}
                          alt={`Miniature ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="mt-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Reviews List */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Avis clients</CardTitle>
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
                            <p className="text-muted-foreground">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                      
                      <Button variant="outline" className="w-full mt-6">
                        Voir tous les avis
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Review Form */}
                <div className="lg:col-span-1">
                  <div className="sticky top-24">
                    <ReviewForm 
                      artisanName={`${artisanData.firstName} ${artisanData.lastName}`}
                      isLoggedIn={false} // À connecter avec l'auth plus tard
                      onSubmit={(review) => {
                        console.log("Nouvel avis:", review);
                      }}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Info Tab */}
            <TabsContent value="info" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
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
            </TabsContent>
          </Tabs>
        </div>
      </section>

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
          <Link to="/demande-devis">
            <Button size="lg" className="px-8">
              Demander un devis gratuit
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ArtisanPublicProfile;
