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
import { Skeleton } from "@/components/ui/skeleton";
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
import { regions, departments, getCitiesByDepartment } from "@/data/frenchLocations";
import { usePublicArtisans } from "@/hooks/usePublicData";
import { useCategoriesHierarchy, CategoryWithChildren } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/categories/CategoryIcon";

const ITEMS_PER_PAGE = 21;

const TrouverArtisan = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: "",
    categoryName: "",
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

  // Fetch dynamic data
  const { data: artisansData, isLoading: artisansLoading } = usePublicArtisans();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategoriesHierarchy();

  // Flatten categories for display (parent categories + their subcategories as needed)
  const categories = useMemo(() => {
    if (!categoriesData) return [];
    // Return parent categories with their icons
    return categoriesData.map((cat) => ({
      id: cat.id,
      icon: cat.icon,
      title: cat.name,
      count: cat.children?.length || 0,
      children: cat.children || [],
    }));
  }, [categoriesData]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(cat => 
      cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, categories]);

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
    (newFilters: { category: string; categoryName: string; city: string; interventionDate: Date | undefined; interventionTime: string }) => {
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
    if (!artisansData) return [];
    
    return artisansData.filter((artisan) => {
      // Filter by category from hero search or sidebar - use categoryName (not ID) for comparison
      const categoryFilter = filters.categoryName || searchQuery;
      if (categoryFilter && categoryFilter !== "all") {
        const filterLower = categoryFilter.toLowerCase();
        
        // Check main category
        const mainCategoryMatch = artisan.category?.name?.toLowerCase().includes(filterLower);
        
        // Check multiple categories from junction table
        const multipleCategoriesMatch = artisan.categories?.some(
          cat => cat.name?.toLowerCase().includes(filterLower)
        );
        
        if (!mainCategoryMatch && !multipleCategoriesMatch) {
          return false;
        }
      }

      // Filter by city from hero search or sidebar
      const cityFilter = filters.city || locationSearch;
      if (cityFilter) {
        const cityName = cityFilter.split(" ")[0].toLowerCase();
        const artisanCity = artisan.city?.toLowerCase() || "";
        const artisanDept = artisan.department?.toLowerCase() || "";
        const artisanRegion = artisan.region?.toLowerCase() || "";
        
        if (!artisanCity.includes(cityName) && 
            !artisanDept.includes(cityName) && 
            !artisanRegion.includes(cityName)) {
          return false;
        }
      }


      return true;
    });
  }, [artisansData, filters, searchQuery, locationSearch]);

  // Paginate filtered artisans
  const totalPages = Math.ceil(filteredArtisans.length / ITEMS_PER_PAGE);
  const paginatedArtisans = filteredArtisans.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Get total artisan count
  const totalArtisans = artisansData?.length || 0;

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
                Plus de {totalArtisans} artisans vérifiés à votre service
              </p>
            </motion.div>

            {/* Dynamic Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-card rounded-2xl p-3 shadow-floating flex flex-col md:flex-row gap-3 relative">
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
                </div>

                {/* Category Dropdown - Full width across entire search bar */}
                {showCategorySuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 p-6">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">Catégories principales</h3>
                    {categoriesLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                        {[1,2,3,4,5,6,7,8,9].map((i) => (
                          <Skeleton key={i} className="h-14 rounded-xl" />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                          {categories.slice(0, 15).map((cat) => (
                            <button
                              key={cat.id}
                              onClick={() => {
                                setSearchQuery(cat.title);
                                setShowCategorySuggestions(false);
                              }}
                              className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-gold/10 hover:border-gold/30 border border-transparent transition-all text-left group"
                            >
                              <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                <CategoryIcon iconName={cat.icon} className="w-5 h-5 text-gold" />
                              </div>
                              <span className="text-foreground text-sm font-medium leading-tight">{cat.title}</span>
                            </button>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-border flex justify-center">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowCategorySuggestions(false);
                              resultsRef.current?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="gap-2"
                          >
                            Voir plus de catégories
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* City Search with Region Accordion */}
                <div className="flex-1 relative" ref={cityInputRef}>
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
                  <Input
                    placeholder="Région, département ou ville"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onFocus={() => setShowCitySuggestions(true)}
                    className="pl-12 h-12 border-0 bg-muted text-base"
                  />
                  {/* Location Dropdown with regions accordion */}
                  {showCitySuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 max-h-96 overflow-auto">
                      <Accordion type="multiple" className="w-full">
                        {regions.map((region) => {
                          const regionDepts = departments.filter(d => d.region === region.id);
                          return (
                            <AccordionItem key={region.id} value={region.id} className="border-b border-border last:border-0">
                              <AccordionTrigger className="px-4 py-3 hover:bg-muted text-foreground text-sm">
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
                                            setLocationSearch(`${dept.name} (${dept.code})`);
                                            setShowCitySuggestions(false);
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
                                                  setLocationSearch(city.name);
                                                  setShowCitySuggestions(false);
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

                <Button variant="gold" size="lg" className="h-12 px-8" onClick={handleSearch}>
                  <Search className="w-5 h-5 mr-2" />
                  Rechercher
                </Button>
              </div>
            </motion.div>
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
                {artisansLoading ? (
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1,2,3,4,5,6].map((i) => (
                      <Skeleton key={i} className="h-80 rounded-2xl" />
                    ))}
                  </div>
                ) : paginatedArtisans.length > 0 ? (
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
                          <ArtisanCard
                            id={artisan.id}
                            slug={artisan.slug}
                            name={artisan.business_name}
                            profession={artisan.category?.name || "Artisan"}
                            location={artisan.city}
                            rating={artisan.rating || 0}
                            reviews={artisan.review_count || 0}
                            verified={artisan.is_verified || false}
                            experience={`${artisan.experience_years || 0} ans`}
                            profileImage={artisan.photo_url || undefined}
                            portfolio={artisan.portfolio_images || undefined}
                          />
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
