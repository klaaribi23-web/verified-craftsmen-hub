import { useState, useRef, useEffect } from "react";
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
import { 
  Search, 
  MapPin, 
  Euro,
  Calendar,
  Users,
  Droplets,
  Zap,
  Flame,
  Paintbrush,
  Key,
  Construction,
  Hammer,
  Wrench,
  Send,
  RotateCcw,
  User
} from "lucide-react";
import { regions, departments, getCitiesByDepartment } from "@/data/frenchLocations";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { icon: Droplets, title: "Plombier" },
  { icon: Zap, title: "Électricien" },
  { icon: Flame, title: "Chauffagiste" },
  { icon: Paintbrush, title: "Peintre" },
  { icon: Key, title: "Serrurier" },
  { icon: Construction, title: "Maçon" },
  { icon: Hammer, title: "Menuisier" },
  { icon: Wrench, title: "Carreleur" },
];

// Dummy missions data
const allMissions = [
  {
    id: 1,
    clientName: "Marie Dupont",
    title: "Changement de fenêtres",
    description: "Remplacement de 4 fenêtres double vitrage dans un appartement",
    budget: 2500,
    city: "Paris",
    department: "75",
    category: "Menuisier",
    postedDate: "2025-01-03",
    applicants: 12,
    status: "active"
  },
  {
    id: 2,
    clientName: "Jean Martin",
    title: "Rénovation salle de bain",
    description: "Rénovation complète salle de bain 8m²",
    budget: 8000,
    city: "Lyon",
    department: "69",
    category: "Plombier",
    postedDate: "2025-01-02",
    applicants: 8,
    status: "active"
  },
  {
    id: 3,
    clientName: "Sophie Leroy",
    title: "Installation tableau électrique",
    description: "Mise aux normes tableau électrique maison 120m²",
    budget: 3500,
    city: "Marseille",
    department: "13",
    category: "Électricien",
    postedDate: "2025-01-01",
    applicants: 15,
    status: "active"
  },
  {
    id: 4,
    clientName: "Pierre Bernard",
    title: "Peinture appartement",
    description: "Peinture complète appartement 60m² (3 pièces)",
    budget: 2000,
    city: "Bordeaux",
    department: "33",
    category: "Peintre",
    postedDate: "2024-12-28",
    applicants: 22,
    status: "active"
  },
  {
    id: 5,
    clientName: "Lucie Moreau",
    title: "Installation chaudière",
    description: "Remplacement chaudière gaz par chaudière à condensation",
    budget: 5500,
    city: "Toulouse",
    department: "31",
    category: "Chauffagiste",
    postedDate: "2024-12-27",
    applicants: 6,
    status: "active"
  },
  {
    id: 6,
    clientName: "Thomas Petit",
    title: "Pose carrelage cuisine",
    description: "Pose de 20m² de carrelage dans cuisine neuve",
    budget: 1800,
    city: "Nice",
    department: "06",
    category: "Carreleur",
    postedDate: "2024-12-26",
    applicants: 9,
    status: "active"
  },
  {
    id: 7,
    clientName: "Emma Roux",
    title: "Ouverture porte blindée",
    description: "Ouverture porte blindée claquée + changement serrure",
    budget: 350,
    city: "Nantes",
    department: "44",
    category: "Serrurier",
    postedDate: "2024-12-25",
    applicants: 4,
    status: "active"
  },
  {
    id: 8,
    clientName: "Lucas Simon",
    title: "Construction mur clôture",
    description: "Construction mur de clôture en parpaings 15m linéaires",
    budget: 4200,
    city: "Strasbourg",
    department: "67",
    category: "Maçon",
    postedDate: "2024-12-24",
    applicants: 7,
    status: "active"
  },
  {
    id: 9,
    clientName: "Camille Faure",
    title: "Réparation fuite toiture",
    description: "Réparation urgente fuite toiture après tempête",
    budget: 1200,
    city: "Lille",
    department: "59",
    category: "Maçon",
    postedDate: "2024-12-23",
    applicants: 11,
    status: "active"
  },
  {
    id: 10,
    clientName: "Hugo Lambert",
    title: "Création cuisine sur mesure",
    description: "Fabrication et installation cuisine sur mesure 12m²",
    budget: 15000,
    city: "Montpellier",
    department: "34",
    category: "Menuisier",
    postedDate: "2024-12-22",
    applicants: 18,
    status: "active"
  },
  {
    id: 11,
    clientName: "Clara Dubois",
    title: "Rénovation électrique complète",
    description: "Mise aux normes électrique appartement ancien 80m²",
    budget: 6500,
    city: "Rennes",
    department: "35",
    category: "Électricien",
    postedDate: "2024-12-21",
    applicants: 14,
    status: "active"
  },
  {
    id: 12,
    clientName: "Antoine Mercier",
    title: "Installation plancher chauffant",
    description: "Pose plancher chauffant hydraulique 45m²",
    budget: 7200,
    city: "Grenoble",
    department: "38",
    category: "Chauffagiste",
    postedDate: "2024-12-20",
    applicants: 5,
    status: "active"
  },
];

const ITEMS_PER_PAGE = 9;

const NosMissions = () => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedMission, setSelectedMission] = useState<typeof allMissions[0] | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isLoggedIn] = useState(true); // Simulated login state
  const [showLocationAccordion, setShowLocationAccordion] = useState(false);
  
  const locationRef = useRef<HTMLDivElement>(null);

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
  const filteredMissions = allMissions.filter(mission => {
    if (categoryFilter && categoryFilter !== "all" && mission.category !== categoryFilter) {
      return false;
    }
    if (locationFilter) {
      const searchLower = locationFilter.toLowerCase();
      if (!mission.city.toLowerCase().includes(searchLower) && 
          !mission.department.includes(locationFilter)) {
        return false;
      }
    }
    return mission.status === "active";
  });

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
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
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
            <h2 className="text-2xl font-bold text-foreground mb-8">Toutes les missions disponibles</h2>
            
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
                          {categories.map((cat) => (
                            <SelectItem key={cat.title} value={cat.title}>
                              <div className="flex items-center gap-2">
                                <cat.icon className="w-4 h-4 text-gold" />
                                {cat.title}
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
                <div className="mb-4 text-sm text-muted-foreground">
                  {filteredMissions.length} mission{filteredMissions.length > 1 ? "s" : ""} disponible{filteredMissions.length > 1 ? "s" : ""}
                </div>

                {paginatedMissions.length > 0 ? (
                  <>
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                      {paginatedMissions.map((mission, index) => (
                        <motion.div
                          key={mission.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="h-full hover:shadow-md transition-shadow flex flex-col">
                            <CardContent className="p-5 flex-1 flex flex-col">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <Badge variant="secondary" className="text-xs">{mission.category}</Badge>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="w-3 h-3" />
                                  {mission.applicants}
                                </span>
                              </div>

                              {/* Title */}
                              <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                                {mission.title}
                              </h3>
                              
                              {/* Description */}
                              <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                                {mission.description}
                              </p>
                              
                              {/* Info */}
                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-foreground">{mission.clientName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Euro className="w-4 h-4 text-gold" />
                                  <span className="text-gold font-semibold">{mission.budget.toLocaleString()} €</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <MapPin className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">{mission.city} ({mission.department})</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">Mise en ligne : {formatDate(mission.postedDate)}</span>
                                </div>
                              </div>
                              
                              {/* Action */}
                              <Button 
                                variant="gold"
                                className="w-full"
                                onClick={() => setSelectedMission(mission)}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Postuler
                              </Button>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={currentPage === page}
                                className="cursor-pointer"
                              >
                                {page}
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
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <p className="text-muted-foreground">Aucune mission ne correspond à vos critères</p>
                      <Button variant="outline" className="mt-4" onClick={resetFilters}>
                        Réinitialiser les filtres
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Application Dialog */}
      <Dialog open={!!selectedMission} onOpenChange={() => setSelectedMission(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Postuler à cette mission</DialogTitle>
            <DialogDescription>
              {selectedMission?.title} - Budget : {selectedMission?.budget.toLocaleString()} €
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Votre message de motivation
              </label>
              <Textarea
                placeholder="Présentez votre expérience et expliquez pourquoi vous êtes le bon artisan pour cette mission..."
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                rows={5}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Votre profil complet sera envoyé avec votre candidature.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedMission(null)}>
              Annuler
            </Button>
            <Button 
              variant="gold" 
              onClick={handleApply}
              disabled={!applicationMessage.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Envoyer ma candidature
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default NosMissions;
