import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import ArtisanFilters from "@/components/artisan-search/ArtisanFilters";
import ArtisanCard from "@/components/artisan-search/ArtisanCard";
import FeaturedArtisansCarousel from "@/components/artisan-search/FeaturedArtisansCarousel";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  Search, 
  MapPin, 
  Droplets,
  Zap,
  Flame,
  Paintbrush,
  Key,
  Construction,
  Hammer,
  Wrench,
  ArrowRight
} from "lucide-react";

const categories = [
  { icon: Droplets, title: "Plombier", count: 847, href: "/artisans/plombier" },
  { icon: Zap, title: "Électricien", count: 623, href: "/artisans/electricien" },
  { icon: Flame, title: "Chauffagiste", count: 412, href: "/artisans/chauffagiste" },
  { icon: Paintbrush, title: "Peintre", count: 956, href: "/artisans/peintre" },
  { icon: Key, title: "Serrurier", count: 234, href: "/artisans/serrurier" },
  { icon: Construction, title: "Maçon", count: 378, href: "/artisans/macon" },
  { icon: Hammer, title: "Menuisier", count: 289, href: "/artisans/menuisier" },
  { icon: Wrench, title: "Carreleur", count: 445, href: "/artisans/carreleur" },
];

const categoryNames = categories.map(c => c.title);

const cities = [
  { name: "Paris", code: "75" },
  { name: "Marseille", code: "13" },
  { name: "Lyon", code: "69" },
  { name: "Toulouse", code: "31" },
  { name: "Nice", code: "06" },
  { name: "Nantes", code: "44" },
  { name: "Strasbourg", code: "67" },
  { name: "Montpellier", code: "34" },
  { name: "Bordeaux", code: "33" },
  { name: "Lille", code: "59" },
  { name: "Rennes", code: "35" },
  { name: "Grenoble", code: "38" },
  { name: "Dijon", code: "21" },
  { name: "Angers", code: "49" },
  { name: "Nîmes", code: "30" },
  { name: "Toulon", code: "83" },
  { name: "Le Havre", code: "76" },
  { name: "Clermont-Ferrand", code: "63" },
  { name: "Reims", code: "51" },
  { name: "Saint-Étienne", code: "42" },
];

// All artisans data (dummy data for pagination demo)
const allArtisansData = [
  { id: 4, name: "Pierre Lefebvre", profession: "Plombier", location: "Bordeaux (33)", rating: 4.7, reviews: 98, verified: true, experience: "8 ans", hourlyRate: "42€" },
  { id: 5, name: "Marie Dupont", profession: "Électricien", location: "Nantes (44)", rating: 4.6, reviews: 67, verified: true, experience: "6 ans", hourlyRate: "48€" },
  { id: 6, name: "Lucas Bernard", profession: "Chauffagiste", location: "Toulouse (31)", rating: 4.9, reviews: 134, verified: true, experience: "14 ans", hourlyRate: "55€" },
  { id: 7, name: "Emma Moreau", profession: "Peintre", location: "Nice (06)", rating: 4.8, reviews: 89, verified: true, experience: "9 ans", hourlyRate: "38€" },
  { id: 8, name: "Thomas Petit", profession: "Serrurier", location: "Lyon (69)", rating: 4.5, reviews: 45, verified: true, experience: "5 ans", hourlyRate: "52€" },
  { id: 9, name: "Camille Roux", profession: "Maçon", location: "Marseille (13)", rating: 4.7, reviews: 78, verified: true, experience: "11 ans", hourlyRate: "50€" },
  { id: 10, name: "Antoine Girard", profession: "Menuisier", location: "Strasbourg (67)", rating: 4.9, reviews: 112, verified: true, experience: "15 ans", hourlyRate: "58€" },
  { id: 11, name: "Julie Fontaine", profession: "Carreleur", location: "Montpellier (34)", rating: 4.6, reviews: 56, verified: true, experience: "7 ans", hourlyRate: "44€" },
  { id: 12, name: "Nicolas Lambert", profession: "Plombier", location: "Lille (59)", rating: 4.8, reviews: 91, verified: true, experience: "10 ans", hourlyRate: "46€" },
  { id: 13, name: "Laura Michel", profession: "Électricien", location: "Rennes (35)", rating: 4.7, reviews: 73, verified: true, experience: "8 ans", hourlyRate: "49€" },
  { id: 14, name: "Julien Mercier", profession: "Chauffagiste", location: "Grenoble (38)", rating: 4.5, reviews: 42, verified: true, experience: "6 ans", hourlyRate: "53€" },
  { id: 15, name: "Claire Bonnet", profession: "Peintre", location: "Dijon (21)", rating: 4.9, reviews: 145, verified: true, experience: "12 ans", hourlyRate: "41€" },
  { id: 16, name: "Maxime Dumont", profession: "Serrurier", location: "Angers (49)", rating: 4.6, reviews: 58, verified: true, experience: "7 ans", hourlyRate: "50€" },
  { id: 17, name: "Sarah Leroy", profession: "Maçon", location: "Nîmes (30)", rating: 4.8, reviews: 87, verified: true, experience: "9 ans", hourlyRate: "48€" },
  { id: 18, name: "David Simon", profession: "Menuisier", location: "Toulon (83)", rating: 4.7, reviews: 69, verified: true, experience: "10 ans", hourlyRate: "56€" },
  { id: 19, name: "Léa Martin", profession: "Carreleur", location: "Le Havre (76)", rating: 4.5, reviews: 38, verified: true, experience: "5 ans", hourlyRate: "43€" },
  { id: 20, name: "Romain Faure", profession: "Plombier", location: "Clermont-Ferrand (63)", rating: 4.9, reviews: 118, verified: true, experience: "13 ans", hourlyRate: "47€" },
  { id: 21, name: "Pauline Blanc", profession: "Électricien", location: "Reims (51)", rating: 4.6, reviews: 52, verified: true, experience: "6 ans", hourlyRate: "51€" },
  { id: 22, name: "Sébastien Garnier", profession: "Chauffagiste", location: "Saint-Étienne (42)", rating: 4.8, reviews: 94, verified: true, experience: "11 ans", hourlyRate: "54€" },
  { id: 23, name: "Manon Perrin", profession: "Peintre", location: "Paris (75)", rating: 4.7, reviews: 76, verified: true, experience: "8 ans", hourlyRate: "39€" },
  { id: 24, name: "Florian Morel", profession: "Serrurier", location: "Bordeaux (33)", rating: 4.5, reviews: 41, verified: true, experience: "5 ans", hourlyRate: "49€" },
  { id: 25, name: "Océane Rousseau", profession: "Maçon", location: "Lyon (69)", rating: 4.9, reviews: 129, verified: true, experience: "14 ans", hourlyRate: "52€" },
  { id: 26, name: "Hugo Chevalier", profession: "Menuisier", location: "Nantes (44)", rating: 4.6, reviews: 63, verified: true, experience: "7 ans", hourlyRate: "57€" },
  { id: 27, name: "Chloé Muller", profession: "Carreleur", location: "Toulouse (31)", rating: 4.8, reviews: 85, verified: true, experience: "9 ans", hourlyRate: "45€" },
  { id: 28, name: "Alexandre Fournier", profession: "Plombier", location: "Nice (06)", rating: 4.7, reviews: 71, verified: true, experience: "10 ans", hourlyRate: "44€" },
  { id: 29, name: "Mathilde Giraud", profession: "Électricien", location: "Marseille (13)", rating: 4.5, reviews: 47, verified: true, experience: "6 ans", hourlyRate: "50€" },
  { id: 30, name: "Vincent Andre", profession: "Chauffagiste", location: "Strasbourg (67)", rating: 4.9, reviews: 136, verified: true, experience: "15 ans", hourlyRate: "56€" },
  { id: 31, name: "Amélie Henry", profession: "Peintre", location: "Montpellier (34)", rating: 4.6, reviews: 59, verified: true, experience: "7 ans", hourlyRate: "40€" },
  { id: 32, name: "Théo Robert", profession: "Serrurier", location: "Lille (59)", rating: 4.8, reviews: 88, verified: true, experience: "9 ans", hourlyRate: "51€" },
  { id: 33, name: "Inès David", profession: "Maçon", location: "Rennes (35)", rating: 4.7, reviews: 74, verified: true, experience: "10 ans", hourlyRate: "49€" },
  { id: 34, name: "Quentin Bertrand", profession: "Menuisier", location: "Grenoble (38)", rating: 4.5, reviews: 39, verified: true, experience: "5 ans", hourlyRate: "55€" },
  { id: 35, name: "Charlotte Morin", profession: "Carreleur", location: "Dijon (21)", rating: 4.9, reviews: 121, verified: true, experience: "12 ans", hourlyRate: "46€" },
  { id: 36, name: "Adrien Laurent", profession: "Plombier", location: "Angers (49)", rating: 4.6, reviews: 54, verified: true, experience: "6 ans", hourlyRate: "43€" },
  { id: 37, name: "Élodie Clément", profession: "Électricien", location: "Nîmes (30)", rating: 4.8, reviews: 92, verified: true, experience: "11 ans", hourlyRate: "52€" },
  { id: 38, name: "Baptiste Garcia", profession: "Chauffagiste", location: "Toulon (83)", rating: 4.7, reviews: 68, verified: true, experience: "8 ans", hourlyRate: "53€" },
  { id: 39, name: "Marion Roche", profession: "Peintre", location: "Le Havre (76)", rating: 4.5, reviews: 43, verified: true, experience: "5 ans", hourlyRate: "37€" },
  { id: 40, name: "Dylan Lemaire", profession: "Serrurier", location: "Clermont-Ferrand (63)", rating: 4.9, reviews: 115, verified: true, experience: "13 ans", hourlyRate: "54€" },
  { id: 41, name: "Anaïs Picard", profession: "Maçon", location: "Reims (51)", rating: 4.6, reviews: 57, verified: true, experience: "7 ans", hourlyRate: "47€" },
  { id: 42, name: "Clément Dubois", profession: "Menuisier", location: "Saint-Étienne (42)", rating: 4.8, reviews: 83, verified: true, experience: "9 ans", hourlyRate: "59€" },
  { id: 43, name: "Juliette Renard", profession: "Carreleur", location: "Paris (75)", rating: 4.7, reviews: 70, verified: true, experience: "8 ans", hourlyRate: "48€" },
  { id: 44, name: "Valentin Arnaud", profession: "Plombier", location: "Bordeaux (33)", rating: 4.5, reviews: 46, verified: true, experience: "6 ans", hourlyRate: "41€" },
  { id: 45, name: "Lucie Marchand", profession: "Électricien", location: "Lyon (69)", rating: 4.9, reviews: 132, verified: true, experience: "14 ans", hourlyRate: "53€" },
];

const ITEMS_PER_PAGE = 21;

const TrouverArtisan = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    budget: [0, 1500],
    category: "",
    city: "",
    interventionDate: undefined as Date | undefined,
    interventionTime: "",
  });
  
  // Suggestions state
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const categoryInputRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categoryNames;
    return categoryNames.filter(cat => 
      cat.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!locationSearch) return cities;
    return cities.filter(city => 
      city.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
      city.code.includes(locationSearch)
    );
  }, [locationSearch]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryInputRef.current && !categoryInputRef.current.contains(event.target as Node)) {
        setShowCategorySuggestions(false);
      }
      if (cityInputRef.current && !cityInputRef.current.contains(event.target as Node)) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFiltersChange = useCallback(
    (newFilters: { budget: number[]; category: string; city: string; interventionDate: Date | undefined; interventionTime: string }) => {
      setFilters(newFilters);
      setCurrentPage(1);
    },
    []
  );

  const handleSearch = () => {
    // Update filters with search values
    setFilters(prev => ({
      ...prev,
      category: searchQuery,
      city: locationSearch,
    }));
    setHasSearched(true);
    setCurrentPage(1);
    
    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Filter artisans based on filters + hero search
  const filteredArtisans = useMemo(() => {
    return allArtisansData.filter((artisan) => {
      // Filter by category from hero search or sidebar
      const categoryFilter = filters.category || searchQuery;
      if (categoryFilter && categoryFilter !== "all") {
        if (!artisan.profession.toLowerCase().includes(categoryFilter.toLowerCase())) {
          return false;
        }
      }

      // Filter by city from hero search or sidebar
      const cityFilter = filters.city || locationSearch;
      if (cityFilter) {
        const cityName = cityFilter.split(" ")[0].toLowerCase();
        if (!artisan.location.toLowerCase().includes(cityName)) {
          return false;
        }
      }

      // Filter by budget (hourly rate)
      const rate = parseInt(artisan.hourlyRate.replace("€", ""));
      if (rate < filters.budget[0] || rate > filters.budget[1]) {
        return false;
      }

      return true;
    });
  }, [filters, searchQuery, locationSearch]);

  // Paginate filtered artisans
  const totalPages = Math.ceil(filteredArtisans.length / ITEMS_PER_PAGE);
  const paginatedArtisans = filteredArtisans.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
                Trouvez votre <span className="text-gradient-gold">artisan</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto">
                Plus de 5000 artisans vérifiés à votre service
              </p>
            </motion.div>

            {/* Dynamic Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card rounded-2xl p-3 shadow-floating flex flex-col md:flex-row gap-3">
                {/* Category Search */}
                <div className="flex-1 relative" ref={categoryInputRef}>
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    placeholder="Quel artisan recherchez-vous ?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowCategorySuggestions(true)}
                    className="pl-12 h-12 border-0 bg-muted text-base"
                  />
                  {/* Category Suggestions */}
                  {showCategorySuggestions && filteredCategories.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                      {filteredCategories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSearchQuery(cat);
                            setShowCategorySuggestions(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                        >
                          <span className="text-foreground">{cat}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* City Search */}
                <div className="flex-1 relative" ref={cityInputRef}>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    placeholder="Ville ou code postal"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onFocus={() => setShowCitySuggestions(true)}
                    className="pl-12 h-12 border-0 bg-muted text-base"
                  />
                  {/* City Suggestions */}
                  {showCitySuggestions && filteredCities.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                      {filteredCities.map((city) => (
                        <button
                          key={city.code}
                          onClick={() => {
                            setLocationSearch(`${city.name} (${city.code})`);
                            setShowCitySuggestions(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                        >
                          <span className="text-foreground">{city.name}</span>
                          <span className="text-muted-foreground ml-2">({city.code})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <Button variant="gold" size="lg" className="h-12 px-8" onClick={handleSearch}>
                  <Search className="w-5 h-5 mr-2" />
                  Rechercher
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">Parcourir par métier</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.map((category, index) => (
                <motion.div
                  key={category.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={category.href}
                    className="group flex items-center gap-4 p-4 rounded-xl border border-border hover:border-gold/30 hover:shadow-soft transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                      <category.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-gold transition-colors">
                        {category.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.count} artisans
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Artisans Carousel */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-foreground">Artisans recommandés</h2>
            </div>
            <FeaturedArtisansCarousel />
          </div>
        </section>

        {/* All Artisans with Filters */}
        <section className="py-16 bg-card" ref={resultsRef}>
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-2xl font-bold text-foreground mb-8">Tous nos artisans</h2>
            
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Filters - Left Column */}
              <div className="lg:w-80 flex-shrink-0">
                <ArtisanFilters onFiltersChange={handleFiltersChange} />
              </div>

              {/* Artisans Grid - Right Column */}
              <div className="flex-1">
                {paginatedArtisans.length > 0 ? (
                  <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      {filteredArtisans.length} artisan{filteredArtisans.length > 1 ? "s" : ""} trouvé{filteredArtisans.length > 1 ? "s" : ""}
                    </div>
                    
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                      {paginatedArtisans.map((artisan) => (
                        <motion.div
                          key={artisan.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <ArtisanCard {...artisan} />
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
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucun artisan ne correspond à vos critères</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-gradient-gold rounded-3xl p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-bold text-navy-dark mb-4">
                Vous ne trouvez pas ce que vous cherchez ?
              </h2>
              <p className="text-navy-dark/70 mb-8 max-w-xl mx-auto">
                Décrivez votre projet et nous vous mettrons en relation avec les artisans les plus adaptés.
              </p>
              <Button variant="default" size="lg" asChild>
                <Link to="/demande-devis">
                  Déposer une demande de devis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TrouverArtisan;
