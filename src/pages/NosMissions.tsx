import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import FeaturedArtisansCarousel from "@/components/artisan-search/FeaturedArtisansCarousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  User
} from "lucide-react";
import { regions, departments, getCitiesByDepartment } from "@/data/frenchLocations";
import { useToast } from "@/hooks/use-toast";
import { useDemoMissions } from "@/hooks/usePublicData";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { formatDistanceToNow, format } from "date-fns";
import { fr } from "date-fns/locale";

const ITEMS_PER_PAGE = 9;

const NosMissions = () => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isLoggedIn] = useState(false); // Will be connected to auth later
  const [showLocationAccordion, setShowLocationAccordion] = useState(false);
  
  const locationRef = useRef<HTMLDivElement>(null);

  const { data: missions, isLoading: missionsLoading } = useDemoMissions();
  const { data: categories } = useCategoriesHierarchy();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationAccordion(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter missions
  const filteredMissions = useMemo(() => {
    if (!missions) return [];
    
    return missions.filter(mission => {
      if (categoryFilter && categoryFilter !== "all" && mission.category?.name !== categoryFilter) {
        return false;
      }
      if (locationFilter) {
        const searchLower = locationFilter.toLowerCase();
        if (!mission.city.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [missions, categoryFilter, locationFilter]);

  const totalPages = Math.ceil(filteredMissions.length / ITEMS_PER_PAGE);
  const paginatedMissions = filteredMissions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApply = () => {
    if (!isLoggedIn) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté en tant qu'artisan pour postuler.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Candidature envoyée !",
      description: `Votre candidature pour "${selectedMission?.title}" a été envoyée avec succès.`,
    });
    setSelectedMission(null);
    setApplicationMessage("");
  };

  const resetFilters = () => {
    setCategoryFilter("");
    setLocationFilter("");
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: fr });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
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

        {/* Featured Artisans Carousel */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Nos artisans recommandés</h2>
            </div>
            <FeaturedArtisansCarousel />
          </div>
        </section>

        {/* Missions List with Filters */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Toutes les missions disponibles</h2>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {filteredMissions.length} mission{filteredMissions.length > 1 ? "s" : ""}
              </Badge>
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
                      <Select value={categoryFilter} onValueChange={(value) => { setCategoryFilter(value); setCurrentPage(1); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toutes les catégories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les catégories</SelectItem>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              <div className="flex items-center gap-2">
                                <CategoryIcon iconName={cat.icon} className="w-4 h-4 text-gold" />
                                {cat.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Location Filter */}
                    <div className="space-y-3" ref={locationRef}>
                      <Label className="text-sm font-medium">Localisation</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Région, département ou ville"
                          value={locationFilter}
                          onChange={(e) => { setLocationFilter(e.target.value); setCurrentPage(1); }}
                          onFocus={() => setShowLocationAccordion(true)}
                          className="pl-10"
                        />
                        
                        {/* Location Accordion Dropdown */}
                        {showLocationAccordion && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-80 overflow-auto">
                            <Accordion type="multiple" className="w-full">
                              {regions.map((region) => {
                                const regionDepts = departments.filter(d => d.region === region.id);
                                return (
                                  <AccordionItem key={region.id} value={region.id} className="border-b border-border last:border-0">
                                    <AccordionTrigger className="px-4 py-2 hover:bg-muted text-foreground text-sm">
                                      {region.name}
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-0">
                                      <div className="pl-4 pb-2">
                                        {regionDepts.map((dept) => {
                                          const deptCities = getCitiesByDepartment(dept.code);
                                          return (
                                            <div key={dept.code} className="mb-1">
                                              <button
                                                onClick={() => {
                                                  setLocationFilter(`${dept.name} (${dept.code})`);
                                                  setShowLocationAccordion(false);
                                                  setCurrentPage(1);
                                                }}
                                                className="w-full text-left px-3 py-1.5 hover:bg-muted rounded text-sm font-medium text-foreground"
                                              >
                                                {dept.name} ({dept.code})
                                              </button>
                                              {deptCities.length > 0 && (
                                                <div className="pl-4">
                                                  {deptCities.slice(0, 3).map((city) => (
                                                    <button
                                                      key={city.name}
                                                      onClick={() => {
                                                        setLocationFilter(city.name);
                                                        setShowLocationAccordion(false);
                                                        setCurrentPage(1);
                                                      }}
                                                      className="w-full text-left px-3 py-1 hover:bg-muted rounded text-xs text-muted-foreground"
                                                    >
                                                      {city.name}
                                                    </button>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                );
                              })}
                            </Accordion>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Active filters summary */}
                    {(categoryFilter || locationFilter) && (
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
                              onClick={() => { setLocationFilter(""); setCurrentPage(1); }}
                            >
                              {locationFilter} ×
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
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <Euro className="w-4 h-4" />
                                  <span>Budget : <strong className="text-foreground">{mission.budget?.toLocaleString("fr-FR")} €</strong></span>
                                </div>

                                {/* Location */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{mission.city}</span>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                                  <Calendar className="w-4 h-4" />
                                  <span>Mise en ligne : {formatDate(mission.created_at)}</span>
                                </div>

                                {/* Spacer */}
                                <div className="flex-1" />

                                {/* Applicants + Apply button */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <Users className="w-4 h-4" />
                                    <span>{mission.applicants_count || 0} postulant{(mission.applicants_count || 0) > 1 ? "s" : ""}</span>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    onClick={() => setSelectedMission(mission)}
                                    className="gap-1"
                                  >
                                    <Send className="w-4 h-4" />
                                    Postuler
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
                    <p className="text-muted-foreground text-lg">Aucune mission trouvée avec ces critères</p>
                    <Button variant="outline" onClick={resetFilters} className="mt-4">
                      Réinitialiser les filtres
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Application Modal */}
      <Dialog open={!!selectedMission} onOpenChange={() => setSelectedMission(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Postuler à cette mission</DialogTitle>
            <DialogDescription>
              {selectedMission?.title}
            </DialogDescription>
          </DialogHeader>
          
          {!isLoggedIn ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">
                Vous devez être connecté en tant qu'artisan pour postuler à cette mission.
              </p>
              <Link to="/auth">
                <Button>Se connecter</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Votre message de motivation</Label>
                  <Textarea
                    placeholder="Présentez-vous et expliquez pourquoi vous êtes le meilleur candidat pour cette mission..."
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMission(null)}>
                  Annuler
                </Button>
                <Button onClick={handleApply} disabled={!applicationMessage.trim()}>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer ma demande
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NosMissions;
