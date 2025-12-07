import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown
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
];

const ITEMS_PER_PAGE = 10;

const NosMissions = () => {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [selectedMission, setSelectedMission] = useState<typeof allMissions[0] | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isLoggedIn] = useState(true); // Simulated login state
  
  const categoryRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter missions
  const filteredMissions = allMissions.filter(mission => {
    if (categoryFilter && !mission.category.toLowerCase().includes(categoryFilter.toLowerCase())) {
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
              className="text-center mb-10"
            >
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Trouvez votre prochaine <span className="text-gradient-gold">mission</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Consultez les demandes de travaux des particuliers et postulez directement
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card rounded-2xl p-3 shadow-floating flex flex-col md:flex-row gap-3">
                {/* Category Search */}
                <div className="flex-1 relative" ref={categoryRef}>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    placeholder="Catégorie de mission"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    onFocus={() => setShowCategoryDropdown(true)}
                    className="pl-12 h-12 border-0 bg-muted text-base"
                  />
                  {/* Category Dropdown with icons in 2 columns */}
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat.title}
                            onClick={() => {
                              setCategoryFilter(cat.title);
                              setShowCategoryDropdown(false);
                              setCurrentPage(1);
                            }}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <cat.icon className="w-5 h-5 text-gold" />
                            <span className="text-foreground">{cat.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Location Search */}
                <div className="flex-1 relative" ref={locationRef}>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    placeholder="Région, département ou ville"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    onFocus={() => setShowLocationDropdown(true)}
                    className="pl-12 h-12 border-0 bg-muted text-base"
                  />
                  {/* Location Dropdown with regions accordion */}
                  {showLocationDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-auto">
                      <Accordion type="multiple" className="w-full">
                        {regions.map((region) => {
                          const regionDepts = departments.filter(d => d.region === region.id);
                          return (
                            <AccordionItem key={region.id} value={region.id} className="border-b border-border last:border-0">
                              <AccordionTrigger className="px-4 py-3 hover:bg-muted text-foreground">
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
                                            setShowLocationDropdown(false);
                                            setCurrentPage(1);
                                          }}
                                          className="w-full text-left px-3 py-2 hover:bg-muted rounded-lg text-sm font-medium text-foreground"
                                        >
                                          {dept.name} ({dept.code})
                                        </button>
                                        {deptCities.length > 0 && (
                                          <div className="pl-4">
                                            {deptCities.slice(0, 5).map((city) => (
                                              <button
                                                key={city.name}
                                                onClick={() => {
                                                  setLocationFilter(city.name);
                                                  setShowLocationDropdown(false);
                                                  setCurrentPage(1);
                                                }}
                                                className="w-full text-left px-3 py-1.5 hover:bg-muted rounded text-sm text-muted-foreground"
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

                <Button 
                  variant="gold" 
                  size="lg" 
                  className="h-12 px-8"
                  onClick={() => {
                    setShowCategoryDropdown(false);
                    setShowLocationDropdown(false);
                    setCurrentPage(1);
                  }}
                >
                  <Search className="w-5 h-5 mr-2" />
                  Rechercher
                </Button>
              </div>

              {/* Active filters */}
              {(categoryFilter || locationFilter) && (
                <div className="flex items-center gap-2 mt-4 justify-center">
                  {categoryFilter && (
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
              )}
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

        {/* Missions List */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Toutes les missions disponibles</h2>
              <p className="text-muted-foreground">
                {filteredMissions.length} mission{filteredMissions.length > 1 ? "s" : ""} disponible{filteredMissions.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="space-y-4">
              {paginatedMissions.map((mission, index) => (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg text-foreground">{mission.title}</h3>
                            <Badge variant="secondary">{mission.category}</Badge>
                          </div>
                          
                          <p className="text-muted-foreground text-sm mb-4">
                            {mission.description}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-foreground">
                              <span className="font-medium">Client :</span> {mission.clientName}
                            </span>
                            <span className="flex items-center gap-1 text-gold font-semibold">
                              <Euro className="w-4 h-4" />
                              Budget : {mission.budget.toLocaleString()} €
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-4 h-4" />
                              {mission.city} ({mission.department})
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" />
                              Mise en ligne : {formatDate(mission.postedDate)}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Users className="w-4 h-4" />
                              {mission.applicants} postulant{mission.applicants > 1 ? "s" : ""}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <Button 
                            variant="gold"
                            onClick={() => setSelectedMission(mission)}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Postuler
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {paginatedMissions.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <p className="text-muted-foreground">Aucune mission ne correspond à vos critères</p>
                  </CardContent>
                </Card>
              )}
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
              </div>
            )}
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
