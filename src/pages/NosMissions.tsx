import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import AdCarousel from "@/components/ads/AdCarousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin,
  Euro,
  Calendar,
  Users,
  Send,
  RotateCcw,
  User,
  Eye,
  CheckCircle2,
  LogIn,
  UserPlus
} from "lucide-react";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDemoMissions } from "@/hooks/usePublicData";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import MissionDetailModal from "@/components/missions/MissionDetailModal";
import { calculateDistance } from "@/lib/geoDistance";
import { useCityCoordinatesCache } from "@/hooks/useCityCoordinatesCache";
import { useMissionApplicationLimit } from "@/hooks/useMissionApplicationLimit";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const ITEMS_PER_PAGE = 30;

const NosMissions = () => {
  const { toast } = useToast();
  const { user, role, isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [radiusFilter, setRadiusFilter] = useState(0);
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [detailMission, setDetailMission] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Mission application limit hook
  const { 
    canApply: canApplyLimit, 
    appliedThisMonth, 
    limit: missionLimit, 
    incrementApplicationCount,
    isLoading: limitLoading 
  } = useMissionApplicationLimit();

  // Fetch artisan profile for logged-in artisan
  const { data: artisanProfile } = useQuery({
    queryKey: ["artisan-profile-full", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("artisans")
        .select("id, business_name")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id && role === "artisan",
  });

  const [searchCoordinates, setSearchCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const { data: missions, isLoading: missionsLoading } = useDemoMissions(user?.id, role);
  const { data: categories } = useCategoriesHierarchy();

  // Extract mission cities for preloading coordinates
  const missionCities = useMemo(() => {
    return missions?.map(m => m.city).filter(Boolean) || [];
  }, [missions]);

  // Use the coordinates cache hook
  const { getCoordinates, isLoading: coordinatesLoading } = useCityCoordinatesCache(missionCities);

  // Helper to normalize city name for comparison
  const normalizeCity = (city: string): string => {
    return city
      .split("(")[0] // Remove (XX) suffix
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove accents
  };

  // Filter missions with distance calculation
  const { filteredMissions, missionDistances } = useMemo(() => {
    if (!missions) return { filteredMissions: [], missionDistances: new Map<string, number>() };
    
    const distances = new Map<string, number>();
    
    const filtered = missions.filter(mission => {
      // Category filter
      if (categoryFilter && categoryFilter !== "all" && mission.category?.name !== categoryFilter) {
        return false;
      }
      
      const missionCity = mission.city || "";
      
      // Location filter - City selected with coordinates
      if (selectedCity && searchCoordinates) {
        const missionCoords = getCoordinates(missionCity);
        
        if (radiusFilter === 0) {
          // Radius = 0: strict city match only
          const normalizedMissionCity = normalizeCity(missionCity);
          const normalizedSelectedCity = normalizeCity(selectedCity);
          
          if (normalizedMissionCity !== normalizedSelectedCity) {
            return false;
          }
          
          // Calculate distance for display even with radius 0
          if (missionCoords) {
            const distance = calculateDistance(
              searchCoordinates.lat, searchCoordinates.lng,
              missionCoords.lat, missionCoords.lng
            );
            distances.set(mission.id, distance);
          }
        } else {
          // Radius > 0: filter by distance
          if (!missionCoords) {
            // No coordinates for mission city, exclude
            return false;
          }
          
          const distance = calculateDistance(
            searchCoordinates.lat, searchCoordinates.lng,
            missionCoords.lat, missionCoords.lng
          );
          distances.set(mission.id, distance);
          
          if (distance > radiusFilter) {
            return false;
          }
        }
      } else if (locationFilter && locationFilter.length >= 2 && !selectedCity) {
        // Text filter without confirmed city selection - dynamic text filtering
        const normalizedMissionCity = normalizeCity(missionCity);
        const normalizedFilter = normalizeCity(locationFilter);
        
        if (!normalizedMissionCity.includes(normalizedFilter)) {
          return false;
        }
      }
      
      return true;
    });
    
    return { filteredMissions: filtered, missionDistances: distances };
  }, [missions, categoryFilter, selectedCity, searchCoordinates, radiusFilter, getCoordinates, locationFilter]);

  const totalPages = Math.ceil(filteredMissions.length / ITEMS_PER_PAGE);
  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Generate automatic application message
  const getAutoMessage = () => {
    const artisanName = artisanProfile?.business_name || "un artisan qualifié";
    return `Bonjour, je suis ${artisanName}.\nVotre mission m'intéresse, je suis disponible pour en discuter.`;
  };

  const handleApply = async (mission: any) => {
    if (!isAuthenticated) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour postuler.",
        variant: "destructive",
      });
      return;
    }

    if (role !== "artisan") {
      toast({
        title: "Accès réservé",
        description: "Seuls les artisans peuvent postuler aux missions.",
        variant: "destructive",
      });
      return;
    }

    if (!artisanProfile?.id) {
      toast({
        title: "Profil artisan introuvable",
        description: "Veuillez compléter votre profil artisan avant de postuler.",
        variant: "destructive",
      });
      return;
    }

    // Check mission application limit
    if (!canApplyLimit) {
      toast({
        title: "Limite atteinte",
        description: `Vous avez atteint votre limite de ${missionLimit} mission(s) ce mois-ci. Passez à un abonnement supérieur pour postuler à plus de missions.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const autoMessage = getAutoMessage();
      
      const { error } = await supabase
        .from("mission_applications")
        .insert({
          mission_id: mission.id,
          artisan_id: artisanProfile.id,
          motivation_message: autoMessage,
          status: "pending",
        });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Candidature existante",
            description: "Vous avez déjà postulé à cette mission.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Increment the application count
      await incrementApplicationCount();

      // Send notification to client using secure RPC
      if (mission.client_id) {
        await supabase.rpc("create_notification", {
          p_user_id: mission.client_id,
          p_type: "new_application",
          p_title: "Nouvelle candidature",
          p_message: `Un artisan a postulé à votre mission "${mission.title}"`,
          p_related_id: mission.id
        });
      }

      toast({
        title: "Candidature envoyée !",
        description: `Votre candidature pour "${mission.title}" a été envoyée avec succès.`,
      });
      
      // Close modals
      setSelectedMission(null);
      setDetailMission(null);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer votre candidature.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setCategoryFilter("");
    setLocationFilter("");
    setSelectedCity("");
    setSearchCoordinates(null);
    setRadiusFilter(0);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
  };

  const canApply = isAuthenticated && role === "artisan" && !!artisanProfile?.id && canApplyLimit;

  // Display limit info for artisans
  const showLimitWarning = isAuthenticated && role === "artisan" && artisanProfile?.id && !canApplyLimit;
  const showLimitCounter = isAuthenticated && role === "artisan" && artisanProfile?.id && missionLimit !== "unlimited";

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Missions disponibles pour artisans"
        description="Consultez les demandes de travaux des particuliers et postulez directement. Trouvez votre prochaine mission qualifiée près de chez vous."
        canonical="https://artisansvalides.fr/nos-missions"
      />
      <Navbar />
      
      <main className="pt-32 lg:pt-20">
        {/* Hero Search */}
        <section className="bg-navy py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Trouvez votre prochaine <span className="text-gradient-gold">mission</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Consultez les demandes de travaux des particuliers et postulez directement
              </p>
            </motion.div>
          </div>
        </section>

        {/* Advertising Carousel */}
        <section className="py-12 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">Offres partenaires</h2>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Publicité
              </Badge>
            </div>
            <AdCarousel />
          </div>
        </section>

        {/* Missions List with Filters */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col gap-4 mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Toutes les missions disponibles</h2>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {filteredMissions.length} mission{filteredMissions.length > 1 ? "s" : ""}
                </Badge>
              </div>
              
              {/* Mission limit counter for artisans */}
              {showLimitCounter && !limitLoading && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Candidatures ce mois : {appliedThisMonth}/{missionLimit}
                  </Badge>
                  {!canApplyLimit && (
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                      Limite atteinte
                    </Badge>
                  )}
                </div>
              )}
              
              {/* Warning when limit reached */}
              {showLimitWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Vous avez atteint votre limite de {missionLimit} candidature(s) ce mois-ci. 
                    <a href="/artisan/abonnement" className="underline ml-1 font-medium">
                      Passez à un abonnement supérieur
                    </a> pour postuler à plus de missions.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters - Left Column */}
              <div className="lg:w-80 flex-shrink-0">
                <Card className="sticky top-24">
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Filtres</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={resetFilters}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Réinitialiser
                      </Button>
                    </div>

                    {/* Category Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Catégorie</Label>
                  <CategorySelect 
                    value={categoryFilter === "all" ? "" : categoryFilter}
                    onValueChange={(id, name) => { 
                      setCategoryFilter(name || "all"); 
                      setCurrentPage(1); 
                    }} 
                    placeholder="Toutes les catégories"
                    allowParentSelection={true}
                  />
                    </div>

                    {/* Location Filter with Autocomplete API */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Localisation</Label>
                      <CityAutocompleteAPI
                        value={locationFilter}
                        onChange={(value, coordinates) => {
                          setLocationFilter(value);
                          if (coordinates) {
                            // City selected from list - enable geographic filtering
                            setSelectedCity(value);
                            setSearchCoordinates(coordinates);
                          } else {
                            // Text typed without selection - reset geographic filtering
                            setSelectedCity("");
                            setSearchCoordinates(null);
                            setRadiusFilter(0);
                          }
                          setCurrentPage(1);
                        }}
                        placeholder="Rechercher une ville..."
                      />
                    </div>

                    {/* Radius Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Rayon d'intervention</Label>
                      <div className="space-y-4">
                        <Slider
                          value={[radiusFilter]}
                          onValueChange={(values) => { setRadiusFilter(values[0]); setCurrentPage(1); }}
                          max={200}
                          min={0}
                          step={5}
                          className="w-full"
                          disabled={!selectedCity}
                        />
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-muted-foreground">0 km</span>
                          <span className={cn(
                            "font-medium px-3 py-1 rounded-full",
                            selectedCity ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {radiusFilter} km
                          </span>
                          <span className="text-muted-foreground">200 km</span>
                        </div>
                        {!selectedCity && (
                          <p className="text-xs text-muted-foreground italic">
                            Sélectionnez une ville pour activer le rayon
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Active filters summary */}
                    {(categoryFilter || locationFilter || (radiusFilter > 0 && selectedCity)) && (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">Filtres actifs :</p>
                        <div className="flex flex-wrap gap-2">
                          {categoryFilter && categoryFilter !== "all" && (
                            <Badge 
                              variant="secondary" 
                              className="cursor-pointer"
                              onClick={() => { setCategoryFilter(""); setCurrentPage(1); }}
                            >
                              {categoryFilter} ×
                            </Badge>
                          )}
                          {locationFilter && (
                            <Badge 
                              variant="secondary" 
                              className="cursor-pointer"
                              onClick={() => { setLocationFilter(""); setSelectedCity(""); setSearchCoordinates(null); setRadiusFilter(0); setCurrentPage(1); }}
                            >
                              {locationFilter} ×
                            </Badge>
                          )}
                          {radiusFilter > 0 && selectedCity && (
                            <Badge 
                              variant="secondary" 
                              className="cursor-pointer"
                              onClick={() => { setRadiusFilter(0); setCurrentPage(1); }}
                            >
                              Rayon: {radiusFilter} km ×
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Missions Grid - Right Column */}
              <div className="flex-1">
                {missionsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Card key={i}>
                        <CardContent className="p-6 space-y-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-6 w-full" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-10 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : paginatedMissions.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {paginatedMissions.map((mission) => (
                        <motion.div
                          key={mission.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card className="h-full hover:shadow-lg transition-shadow">
                            <CardContent className="p-6 flex flex-col h-full">
                                {/* Client info */}
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="w-4 h-4 text-primary" />
                                  </div>
                                  <span className="text-sm font-medium text-foreground">{mission.client_name}</span>
                                </div>

                                {/* Mission title */}
                                <h3 className="font-semibold text-lg text-foreground mb-2 line-clamp-2">
                                  {mission.title}
                                </h3>

                                {/* Category */}
                                <Badge variant="secondary" className="w-fit mb-3 gap-1">
                                  <CategoryIcon iconName="arrow-up-right" className="w-3 h-3" />
                                  {mission.category?.name || "Autre"}
                                </Badge>

                                {/* Budget */}
                                {mission.budget && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                    <Euro className="w-4 h-4" />
                                    <span>Budget : <strong className="text-foreground">{mission.budget?.toLocaleString("fr-FR")} €</strong></span>
                                  </div>
                                )}

                                {/* Location */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{mission.city}</span>
                                  {missionDistances.get(mission.id) !== undefined && selectedCity && (
                                    <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
                                      {Math.round(missionDistances.get(mission.id)!)} km
                                    </span>
                                  )}
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                  <Calendar className="w-4 h-4" />
                                  <span>Mise en ligne : {formatDate(mission.created_at)}</span>
                                </div>

                                {/* Spacer */}
                                <div className="flex-1" />

                                {/* Applicants count & Applied status */}
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>{mission.applicants_count || 0} postulant{(mission.applicants_count || 0) > 1 ? "s" : ""}</span>
                                  </div>
                                  {mission.has_applied && (
                                    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Déjà postulé
                                    </Badge>
                                  )}
                                </div>

                                {/* Action buttons */}
                                <div className="flex gap-2 pt-4 border-t">
                                  <Button 
                                    variant="outline"
                                    size="sm" 
                                    onClick={() => {
                                      // Non connecté = modal d'invitation
                                      if (!isAuthenticated) {
                                        setShowAuthModal(true);
                                      } else {
                                        // Client ou Artisan connecté = accès aux détails
                                        setDetailMission(mission);
                                      }
                                    }}
                                    className="flex-1 gap-1"
                                  >
                                    <Eye className="w-4 h-4" />
                                    Détails
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => {
                                      // Non connecté = modal d'invitation
                                      if (!isAuthenticated) {
                                        setShowAuthModal(true);
                                        return;
                                      }
                                      // Client = pas d'action (bouton désactivé)
                                      if (role === "client") {
                                        return;
                                      }
                                      // Artisan = comportement normal
                                      if (canApply && !mission.has_applied) {
                                        setSelectedMission(mission);
                                      }
                                    }}
                                    disabled={
                                      mission.has_applied || 
                                      role === "client" ||
                                      (!canApplyLimit && role === "artisan" && isAuthenticated)
                                    }
                                    variant={mission.has_applied ? "secondary" : "default"}
                                    className={cn(
                                      "flex-1 gap-1",
                                      mission.has_applied && "bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400"
                                    )}
                                    title={
                                      mission.has_applied 
                                        ? "Vous avez déjà postulé" 
                                        : role === "client" 
                                          ? "Réservé aux artisans"
                                          : !canApplyLimit && role === "artisan" 
                                            ? "Limite de candidatures atteinte" 
                                            : ""
                                    }
                                  >
                                    {mission.has_applied ? (
                                      <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Postulé
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-4 h-4" />
                                        Postuler
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-8">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            {Array.from({ length: totalPages }).map((_, i) => (
                              <PaginationItem key={i}>
                                <PaginationLink
                                  onClick={() => setCurrentPage(i + 1)}
                                  isActive={currentPage === i + 1}
                                  className="cursor-pointer"
                                >
                                  {i + 1}
                                </PaginationLink>
                              </PaginationItem>
                            ))}
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16">
                    {selectedCity && radiusFilter === 0 ? (
                      <>
                        <p className="text-muted-foreground text-lg mb-2">
                          Aucune mission trouvée à <strong>{selectedCity.split("(")[0].trim()}</strong>
                        </p>
                        <p className="text-muted-foreground text-sm mb-4">
                          Essayez d'élargir votre recherche avec le rayon d'intervention
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button 
                            variant="outline" 
                            onClick={() => { setRadiusFilter(30); setCurrentPage(1); }}
                          >
                            Élargir à 30 km
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => { setRadiusFilter(50); setCurrentPage(1); }}
                          >
                            Élargir à 50 km
                          </Button>
                        </div>
                      </>
                    ) : selectedCity && radiusFilter > 0 ? (
                      <>
                        <p className="text-muted-foreground text-lg mb-2">
                          Aucune mission trouvée dans un rayon de {radiusFilter} km autour de <strong>{selectedCity.split("(")[0].trim()}</strong>
                        </p>
                        <div className="flex gap-2 justify-center mt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => { setRadiusFilter(Math.min(200, radiusFilter + 50)); setCurrentPage(1); }}
                          >
                            Augmenter le rayon
                          </Button>
                          <Button variant="outline" onClick={resetFilters}>
                            Réinitialiser les filtres
                          </Button>
                        </div>
                      </>
                    ) : locationFilter && !selectedCity ? (
                      <>
                        <p className="text-muted-foreground text-lg mb-2">
                          Aucune mission ne correspond à "{locationFilter}"
                        </p>
                        <p className="text-muted-foreground text-sm mb-4">
                          Sélectionnez une ville dans la liste pour activer la recherche géographique
                        </p>
                        <Button variant="outline" onClick={resetFilters}>
                          Réinitialiser les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="text-muted-foreground text-lg">Aucune mission trouvée avec ces critères</p>
                        <Button variant="outline" onClick={resetFilters} className="mt-4">
                          Réinitialiser les filtres
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Mission Detail Modal */}
      <MissionDetailModal
        mission={detailMission}
        open={!!detailMission}
        onClose={() => setDetailMission(null)}
        onApply={() => {
          if (detailMission) {
            handleApply(detailMission);
          }
        }}
        canApply={canApply}
      />

      {/* Application Confirmation Modal */}
      <Dialog open={!!selectedMission} onOpenChange={() => setSelectedMission(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Postuler à cette mission</DialogTitle>
            <DialogDescription>
              {selectedMission?.title}
            </DialogDescription>
          </DialogHeader>
          
          {!isAuthenticated ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">
                Vous devez être connecté en tant qu'artisan pour postuler à cette mission.
              </p>
              <Link to="/auth">
                <Button>Se connecter</Button>
              </Link>
            </div>
          ) : role !== "artisan" ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">
                Seuls les artisans peuvent postuler aux missions. Vous êtes connecté en tant que client.
              </p>
              <Link to="/devenir-artisan">
                <Button variant="outline">Devenir artisan</Button>
              </Link>
            </div>
          ) : !canApplyLimit ? (
            <div className="py-6 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">
                Limite de candidatures atteinte
              </p>
              <p className="text-muted-foreground mb-4">
                Vous avez utilisé vos {missionLimit} candidature(s) ce mois-ci.
              </p>
              <Link to="/artisan/abonnement">
                <Button>Passer à un abonnement supérieur</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">Votre message de candidature :</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {getAutoMessage()}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ce message sera envoyé automatiquement au client avec votre candidature.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMission(null)}>
                  Annuler
                </Button>
                <Button onClick={() => handleApply(selectedMission)} disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Envoi..." : "Confirmer ma candidature"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Auth Required Modal - For non-authenticated users */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Accès réservé aux artisans
            </DialogTitle>
            <DialogDescription>
              Pour consulter les détails des missions et postuler, vous devez être connecté en tant qu'artisan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <p className="text-center text-muted-foreground">
              Vous avez déjà un compte ? Connectez-vous. Sinon, créez votre profil artisan gratuitement.
            </p>
            
            <div className="flex flex-col gap-3">
              <Link to="/auth" className="w-full" onClick={() => setShowAuthModal(false)}>
                <Button className="w-full gap-2">
                  <LogIn className="w-4 h-4" />
                  Se connecter
                </Button>
              </Link>
              <Link to="/devenir-artisan" className="w-full" onClick={() => setShowAuthModal(false)}>
                <Button variant="outline" className="w-full gap-2">
                  <UserPlus className="w-4 h-4" />
                  Créer un compte artisan
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NosMissions;
