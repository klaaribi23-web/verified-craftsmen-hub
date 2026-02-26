import { useState, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import ArtisanFilters from "@/components/artisan-search/ArtisanFilters";
import ArtisanCard from "@/components/artisan-search/ArtisanCard";
import FeaturedArtisansCarousel from "@/components/artisan-search/FeaturedArtisansCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ArrowRight } from "lucide-react";
import { usePublicArtisans } from "@/hooks/usePublicData";
import { useCategoriesHierarchy } from "@/hooks/useCategories";

import { calculateDistance } from "@/lib/geoDistance";
import { useCityCoordinatesCache } from "@/hooks/useCityCoordinatesCache";
import DynamicFAQ from "@/components/artisan-search/DynamicFAQ";
import ExpertFAQSection from "@/components/artisan-search/ExpertFAQSection";

const ITEMS_PER_PAGE = 21;
const TrouverArtisan = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [urgencyFilter, setUrgencyFilter] = useState(false);
  const [rgeFilter, setRgeFilter] = useState(false);
  const [filters, setFilters] = useState({
    category: "",
    categoryName: "",
    city: "",
    cityInput: "",
    radius: 0,
    coordinates: null as { lat: number; lng: number } | null
  });

  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch dynamic data
  const {
    data: artisansData,
    isLoading: artisansLoading
  } = usePublicArtisans();

  const { data: categoriesHierarchy } = useCategoriesHierarchy();

  // Build a map: parent category name -> set of child category IDs (includes parent itself)
  const parentChildMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!categoriesHierarchy) return map;
    categoriesHierarchy.forEach(parent => {
      const childIds = new Set<string>([parent.id, ...parent.children.map(c => c.id)]);
      map.set(parent.name.toLowerCase(), childIds);
    });
    return map;
  }, [categoriesHierarchy]);

  const handleFiltersChange = useCallback((newFilters: {
    category: string;
    categoryName: string;
    city: string;
    cityInput: string;
    radius: number;
    coordinates: { lat: number; lng: number } | null;
    urgency?: boolean;
    rge?: boolean;
  }) => {
    setFilters(newFilters);
    if (newFilters.urgency !== undefined) setUrgencyFilter(newFilters.urgency);
    if (newFilters.rge !== undefined) setRgeFilter(newFilters.rge);
    setCurrentPage(1);
  }, []);

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

    // Get "Dépannage Urgent" child IDs for urgency filter
    const depannageChildIds = parentChildMap.get("dépannage urgent");
    
    const filtered = artisansData.filter(artisan => {
      // Hide artisans with payment_failed subscription status
      if ((artisan as any).subscription_status === 'payment_failed') return false;

      // RGE filter
      if (rgeFilter) {
        if (!(artisan as any).is_rge) return false;
      }

      // Urgency filter
      if (urgencyFilter) {
        const isAvailableUrgent = (artisan as any).available_urgent === true;
        const isDepannageCategory = depannageChildIds && (
          (artisan.category_id && depannageChildIds.has(artisan.category_id)) ||
          artisan.categories?.some(cat => depannageChildIds.has(cat.id))
        );
        if (!isAvailableUrgent && !isDepannageCategory) return false;
      }

      // Filter by category from hero search or sidebar
      const categoryFilter = filters.categoryName;
      if (categoryFilter && categoryFilter !== "all") {
        const filterLower = categoryFilter.toLowerCase();

        // Check if it's a parent category — match all children
        const matchingChildIds = parentChildMap.get(filterLower);
        if (matchingChildIds) {
          const mainMatch = artisan.category_id && matchingChildIds.has(artisan.category_id);
          const multiMatch = artisan.categories?.some(cat => matchingChildIds.has(cat.id));
          if (!mainMatch && !multiMatch) return false;
        } else {
          // Direct name match (child category selected)
          const mainCategoryMatch = artisan.category?.name?.toLowerCase().includes(filterLower);
          const multipleCategoriesMatch = artisan.categories?.some(cat => cat.name?.toLowerCase().includes(filterLower));
          if (!mainCategoryMatch && !multipleCategoriesMatch) return false;
        }
      }

      const artisanCity = artisan.city || "";

      // Ville sélectionnée avec coordonnées GPS
      if (filters.city && filters.coordinates) {
        const artisanCoords = getCoordinates(artisanCity);
        
        if (filters.radius === 0) {
          const normalizedArtisanCity = normalizeCity(artisanCity);
          const normalizedSelectedCity = normalizeCity(filters.city);
          
          if (normalizedArtisanCity !== normalizedSelectedCity) {
            return false;
          }
          
          if (artisanCoords) {
            const distance = calculateDistance(
              filters.coordinates.lat, filters.coordinates.lng,
              artisanCoords.lat, artisanCoords.lng
            );
            distances.set(artisan.id, distance);
          }
        } else {
          if (!artisanCoords) return false;
          
          const distance = calculateDistance(
            filters.coordinates.lat, filters.coordinates.lng,
            artisanCoords.lat, artisanCoords.lng
          );
          distances.set(artisan.id, distance);
          
          if (distance > filters.radius) return false;
        }
      } else if (filters.cityInput && filters.cityInput.length >= 2 && !filters.city) {
        const normalizedArtisanCity = normalizeCity(artisanCity);
        const normalizedFilter = normalizeCity(filters.cityInput);
        
        if (!normalizedArtisanCity.includes(normalizedFilter)) {
          return false;
        }
      }
      
      return true;
    });
    
    return { filteredArtisans: filtered, artisanDistances: distances };
  }, [artisansData, filters, getCoordinates, parentChildMap, urgencyFilter, rgeFilter]);

  // Sort: by distance if available, then available_urgent, then audited, then premium, then rating
  const sortedArtisans = useMemo(() => {
    return [...filteredArtisans].sort((a, b) => {
      // 0. If distance available, sort by distance first
      const aDist = artisanDistances.get(a.id);
      const bDist = artisanDistances.get(b.id);
      if (aDist !== undefined && bDist !== undefined) {
        if (aDist !== bDist) return aDist - bDist;
      }
      // Put artisans with distance before those without
      if (aDist !== undefined && bDist === undefined) return -1;
      if (aDist === undefined && bDist !== undefined) return 1;

      // 1. Available urgent first
      const aUrgent = (a as any).available_urgent ? 1 : 0;
      const bUrgent = (b as any).available_urgent ? 1 : 0;
      if (bUrgent !== aUrgent) return bUrgent - aUrgent;

      // 2. Audited first
      const aAudited = a.is_audited ? 1 : 0;
      const bAudited = b.is_audited ? 1 : 0;
      if (bAudited !== aAudited) return bAudited - aAudited;
      
      // 3. Premium tier next
      const tierOrder = (tier: string | null | undefined) => {
        if (tier === 'premium') return 2;
        if (tier === 'standard') return 1;
        return 0;
      };
      const aTier = tierOrder(a.subscription_tier);
      const bTier = tierOrder(b.subscription_tier);
      if (bTier !== aTier) return bTier - aTier;
      
      // 4. By rating
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [filteredArtisans, artisanDistances]);

  // Paginate sorted artisans
  const totalPages = Math.ceil(sortedArtisans.length / ITEMS_PER_PAGE);
  const paginatedArtisans = sortedArtisans.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  
  return <div className="min-h-screen" style={{ backgroundColor: '#0A192F' }}>
      <SEOHead 
        title="Trouver un artisan qualifié"
        description="Trouvez et comparez les meilleurs artisans vérifiés près de chez vous. Plombiers, électriciens, peintres et plus. Devis gratuit en 24h."
        canonical="https://artisansvalides.fr/trouver-artisan"
      />
      <Navbar />
      
      <main>
        {/* Hero Search */}
        <section className="py-10 md:py-16 lg:py-24 border-b border-[#D4AF37]/10" style={{ backgroundColor: '#0A192F' }}>
          <div className="container mx-auto px-4 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6 md:mb-10">
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3 md:mb-4 font-['DM_Sans'] leading-tight">
                Les artisans que vous <span style={{ color: '#D4AF37' }}>méritez</span>.<br className="hidden md:block" />
                Vérifiés, audités, exclusifs.
              </h1>
              <p className="text-base md:text-lg text-white/70 max-w-2xl mx-auto px-4 leading-relaxed">
                Chaque artisan a passé l'audit Andrea. Assurances contrôlées, SIRET vérifié, avis authentiques. Vous échangez en sécurité — vos coordonnées restent privées jusqu'à ce que vous décidiez.
              </p>
            </motion.div>

            {/* Dynamic Search Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-4xl mx-auto">
              <ArtisanFilters onFiltersChange={handleFiltersChange} />
            </motion.div>

            {/* Reassurance Bar */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="max-w-4xl mx-auto mt-5">
              <div className="rounded-xl py-3 px-4 flex items-center justify-center gap-4 md:gap-6 flex-wrap" style={{ backgroundColor: '#0D1F35' }}>
                {[
                  "87% des artisans refusés à l'audit",
                  "Vos coordonnées protégées",
                  "Zéro commission",
                  "Réponse sous 2h",
                ].map((text, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs md:text-sm text-white/90 font-medium whitespace-nowrap">
                    <span style={{ color: '#D4AF37' }}>✓</span>
                    {text}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>


        {/* Featured Artisans Carousel */}
        <section className="py-10 md:py-16" style={{ backgroundColor: '#0D1F35' }}>
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-extrabold text-white text-center md:text-left font-['DM_Sans']">
                L'élite <span style={{ color: '#D4AF37' }}>vérifiée</span> — et seulement l'élite
              </h2>
              <p className="text-sm text-white/60 mt-1 text-center md:text-left">
                Pas de quantité. De la qualité. Chaque artisan audité sur le terrain par notre équipe.
              </p>
            </div>
            <FeaturedArtisansCarousel />
          </div>
        </section>

        {/* All Artisans with Filters */}
        <section className="py-10 md:py-16" ref={resultsRef} id="artisans-results" style={{ backgroundColor: '#0A192F' }}>
          <div className="container mx-auto px-4 lg:px-8">
            <div className="mb-6 md:mb-8">
              <h2 className="text-xl md:text-2xl font-extrabold text-white font-['DM_Sans']">Tous nos <span style={{ color: '#D4AF37' }}>artisans</span></h2>
              <p className="text-sm text-white/60 mt-1">
                Chaque artisan visible ici a passé notre audit — 87% des candidats ont été refusés
              </p>
            </div>

            {/* Artisans Grid */}
            <div>
              {artisansLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-80 rounded-2xl" />)}
                </div> : paginatedArtisans.length > 0 ? <>
                  <div className="mb-4 text-sm text-muted-foreground">
                    {filteredArtisans.length} artisan{filteredArtisans.length > 1 ? "s" : ""} trouvé{filteredArtisans.length > 1 ? "s" : ""}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch gap-4 md:gap-6 mb-8">
                    {paginatedArtisans.map(artisan => <motion.div key={artisan.id} className="h-full" initial={{
                  opacity: 0,
                  y: 20
                }} animate={{
                  opacity: 1,
                  y: 0
                }}>
                        <ArtisanCard id={artisan.id} slug={artisan.slug} name={artisan.business_name} profession={artisan.category?.name || "Artisan"} location={artisan.city} rating={artisan.rating || 0} reviews={artisan.review_count || 0} verified={artisan.is_verified || false} experience={`${artisan.experience_years || 0} ans`} profileImage={artisan.photo_url || undefined} portfolio={artisan.portfolio_images || undefined} portfolioVideos={artisan.portfolio_videos || undefined} distance={artisanDistances.get(artisan.id) ?? null} subscriptionTier={artisan.subscription_tier} phone={undefined} siret={undefined} facebookUrl={artisan.facebook_url} instagramUrl={artisan.instagram_url} linkedinUrl={artisan.linkedin_url} websiteUrl={artisan.website_url} isAudited={artisan.is_audited || false} availableUrgent={(artisan as any).available_urgent || false} isRge={(artisan as any).is_rge || false} />
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
              </> : <div className="text-center py-16 px-4">
                  <div className="max-w-md mx-auto">
                    <p className="text-lg font-extrabold text-white mb-2 font-['DM_Sans']">Aucun expert ne correspond à ces critères pour le moment.</p>
                    <p className="text-[#8892B0] mb-6">
                      Nos auditeurs sont sur le terrain. Laissez votre demande, nous vous recontacterons.
                    </p>
                    <Button asChild variant="default" size="lg">
                      <Link to="/demande-devis">
                        Déposer une demande de devis
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>}
            </div>
          </div>
        </section>

        {/* Dynamic FAQ */}
        <DynamicFAQ 
          city={filters.city || undefined} 
          category={filters.categoryName || undefined} 
        />

        {/* Expert AI FAQ */}
        <ExpertFAQSection
          category={filters.categoryName || "Artisan du bâtiment"}
          city={filters.city || undefined}
        />

        {/* CTA */}
        <section className="py-10 md:py-16" style={{ backgroundColor: '#060C18' }}>
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