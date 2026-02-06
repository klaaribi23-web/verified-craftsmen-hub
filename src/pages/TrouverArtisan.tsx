import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import ArtisanFilters from "@/components/artisan-search/ArtisanFilters";
import ArtisanCard from "@/components/artisan-search/ArtisanCard";
import FeaturedArtisansCarousel from "@/components/artisan-search/FeaturedArtisansCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MapPin, Droplets, Zap, Flame, Paintbrush, Key, Construction, Hammer, Wrench, ArrowRight } from "lucide-react";
import { usePublicArtisans } from "@/hooks/usePublicData";
import { useCategoriesHierarchy, CategoryWithChildren } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { calculateDistance } from "@/lib/geoDistance";
import { useCityCoordinatesCache } from "@/hooks/useCityCoordinatesCache";

const ITEMS_PER_PAGE = 21;
const TrouverArtisan = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: "",
    categoryName: "",
    city: "",
    cityInput: "",
    radius: 0,
    coordinates: null as { lat: number; lng: number } | null
  });

  // Suggestions state
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const categoryInputRef = useRef<HTMLDivElement>(null);
  const cityInputRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic data
  const {
    data: artisansData,
    isLoading: artisansLoading
  } = usePublicArtisans();
  const {
    data: categoriesData,
    isLoading: categoriesLoading
  } = useCategoriesHierarchy();

  // Flatten categories for display (parent categories + their subcategories as needed)
  const categories = useMemo(() => {
    if (!categoriesData) return [];
    // Return parent categories with their icons
    return categoriesData.map(cat => ({
      id: cat.id,
      icon: cat.icon,
      title: cat.name,
      count: cat.children?.length || 0,
      children: cat.children || []
    }));
  }, [categoriesData]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    return categories.filter(cat => cat.title.toLowerCase().includes(searchQuery.toLowerCase()));
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
  const handleFiltersChange = useCallback((newFilters: {
    category: string;
    categoryName: string;
    city: string;
    cityInput: string;
    radius: number;
    coordinates: { lat: number; lng: number } | null;
  }) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);
  const handleSearch = () => {
    // Update filters with search values
    setFilters(prev => ({
      ...prev,
      category: searchQuery,
      city: locationSearch
    }));
    setHasSearched(true);
    setCurrentPage(1);

    // Scroll to results
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth"
      });
    }, 100);
  };

  // Extract artisan cities for preloading coordinates
  const artisanCities = useMemo(() => {
    return artisansData?.map(a => a.city).filter(Boolean) || [];
  }, [artisansData]);

  // Use the coordinates cache hook
  const { getCoordinates } = useCityCoordinatesCache(artisanCities);

  // Normalize city name for comparison
  const normalizeCity = (city: string): string => {
    return city
      .split("(")[0]
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  // Filter artisans based on filters + hero search and calculate distances
  const { filteredArtisans, artisanDistances } = useMemo(() => {
    if (!artisansData) return { filteredArtisans: [], artisanDistances: new Map<string, number>() };
    
    const distances = new Map<string, number>();
    
    const filtered = artisansData.filter(artisan => {
      // Filter by category from hero search or sidebar - use categoryName (not ID) for comparison
      const categoryFilter = filters.categoryName || searchQuery;
      if (categoryFilter && categoryFilter !== "all") {
        const filterLower = categoryFilter.toLowerCase();

        // Check main category
        const mainCategoryMatch = artisan.category?.name?.toLowerCase().includes(filterLower);

        // Check multiple categories from junction table
        const multipleCategoriesMatch = artisan.categories?.some(cat => cat.name?.toLowerCase().includes(filterLower));
        if (!mainCategoryMatch && !multipleCategoriesMatch) {
          return false;
        }
      }

      const artisanCity = artisan.city || "";

      // Ville sélectionnée avec coordonnées GPS
      if (filters.city && filters.coordinates) {
        const artisanCoords = getCoordinates(artisanCity);
        
        if (filters.radius === 0) {
          // Rayon 0 = correspondance stricte par nom de ville
          const normalizedArtisanCity = normalizeCity(artisanCity);
          const normalizedSelectedCity = normalizeCity(filters.city);
          
          if (normalizedArtisanCity !== normalizedSelectedCity) {
            return false;
          }
          
          // Calculer la distance pour l'affichage
          if (artisanCoords) {
            const distance = calculateDistance(
              filters.coordinates.lat, filters.coordinates.lng,
              artisanCoords.lat, artisanCoords.lng
            );
            distances.set(artisan.id, distance);
          }
        } else {
          // Rayon > 0 = filtrage par distance
          if (!artisanCoords) return false;
          
          const distance = calculateDistance(
            filters.coordinates.lat, filters.coordinates.lng,
            artisanCoords.lat, artisanCoords.lng
          );
          distances.set(artisan.id, distance);
          
          if (distance > filters.radius) return false;
        }
      } else if (filters.cityInput && filters.cityInput.length >= 2 && !filters.city) {
        // Texte tapé sans sélection = filtrage dynamique par texte
        const normalizedArtisanCity = normalizeCity(artisanCity);
        const normalizedFilter = normalizeCity(filters.cityInput);
        
        if (!normalizedArtisanCity.includes(normalizedFilter)) {
          return false;
        }
      }
      
      return true;
    });
    
    return { filteredArtisans: filtered, artisanDistances: distances };
  }, [artisansData, filters, searchQuery, getCoordinates]);

  // Paginate filtered artisans
  const totalPages = Math.ceil(filteredArtisans.length / ITEMS_PER_PAGE);
  const paginatedArtisans = filteredArtisans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Get total artisan count
  const totalArtisans = artisansData?.length || 0;
  return <div className="min-h-screen bg-background">
      <SEOHead 
        title="Trouver un artisan qualifié"
        description="Trouvez et comparez les meilleurs artisans vérifiés près de chez vous. Plombiers, électriciens, peintres et plus. Devis gratuit en 24h."
        canonical="https://artisansvalides.fr/trouver-artisan"
      />
      <Navbar />
      
      <main className="pt-28 lg:pt-20">
        {/* Hero Search */}
        <section className="bg-navy py-10 md:py-16 lg:py-24">
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} className="text-center mb-6 md:mb-10">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4">
                Trouvez votre <span className="text-gradient-gold">artisan</span>
              </h1>
              <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto px-4">
                Plus de {totalArtisans} artisans vérifiés à votre service
              </p>
            </motion.div>

            {/* Dynamic Search Bar */}
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            delay: 0.1
          }} className="max-w-4xl mx-auto">
              
            </motion.div>
          </div>
        </section>


        {/* Featured Artisans Carousel */}
        <section className="py-10 md:py-16 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-foreground text-center md:text-left">Artisans recommandés</h2>
            </div>
            <FeaturedArtisansCarousel />
          </div>
        </section>

        {/* All Artisans with Filters */}
        <section className="py-10 md:py-16 bg-card" ref={resultsRef}>
          <div className="container mx-auto px-4 lg:px-8">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6 md:mb-8">Tous nos artisans</h2>
            
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Filters - Left Column */}
              <aside className="lg:w-80 flex-shrink-0" aria-label="Filtres de recherche">
                <ArtisanFilters onFiltersChange={handleFiltersChange} />
              </aside>

              {/* Artisans Grid - Right Column */}
              <div className="flex-1">
                {artisansLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
                  </div> : paginatedArtisans.length > 0 ? <>
                    <div className="mb-4 text-sm text-muted-foreground">
                      {filteredArtisans.length} artisan{filteredArtisans.length > 1 ? "s" : ""} trouvé{filteredArtisans.length > 1 ? "s" : ""}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8">
                      {paginatedArtisans.map(artisan => <motion.div key={artisan.id} initial={{
                    opacity: 0,
                    y: 20
                  }} animate={{
                    opacity: 1,
                    y: 0
                  }}>
                          <ArtisanCard id={artisan.id} slug={artisan.slug} name={artisan.business_name} profession={artisan.category?.name || "Artisan"} location={artisan.city} rating={artisan.rating || 0} reviews={artisan.review_count || 0} verified={artisan.is_verified || false} experience={`${artisan.experience_years || 0} ans`} profileImage={artisan.photo_url || undefined} portfolio={artisan.portfolio_images || undefined} portfolioVideos={artisan.portfolio_videos || undefined} distance={artisanDistances.get(artisan.id) ?? null} subscriptionTier={artisan.subscription_tier} phone={artisan.phone} siret={artisan.siret} facebookUrl={artisan.facebook_url} instagramUrl={artisan.instagram_url} linkedinUrl={artisan.linkedin_url} websiteUrl={artisan.website_url} />
                        </motion.div>)}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && <Pagination>
                        <PaginationContent className="flex-wrap gap-1">
                          <PaginationItem>
                            <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} min-h-[44px]`} />
                          </PaginationItem>
                          
                          {Array.from({
                      length: totalPages
                    }, (_, i) => i + 1).slice(
                      Math.max(0, currentPage - 3),
                      Math.min(totalPages, currentPage + 2)
                    ).map(page => <PaginationItem key={page}>
                              <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer min-h-[44px] min-w-[44px]">
                                {page}
                              </PaginationLink>
                            </PaginationItem>)}
                          
                          <PaginationItem>
                            <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} min-h-[44px]`} />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>}
                  </> : <div className="text-center py-12">
                    <p className="text-muted-foreground">Aucun artisan ne correspond à vos critères</p>
                  </div>}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 md:py-16 bg-muted">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="bg-gradient-gold rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-12 text-center">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-navy-dark mb-3 md:mb-4">
                Vous ne trouvez pas ce que vous cherchez ?
              </h2>
              <p className="text-navy-dark/70 mb-6 md:mb-8 max-w-xl mx-auto text-sm md:text-base">
                Décrivez votre projet et nous vous mettrons en relation avec les artisans les plus adaptés.
              </p>
              <Button variant="default" size="lg" asChild className="w-full sm:w-auto">
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
    </div>;
};
export default TrouverArtisan;