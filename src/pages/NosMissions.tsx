import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SEOHead from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
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
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin,
  Euro,
  Calendar,
  Users,
  Send,
  RotateCcw,
  Eye,
  CheckCircle2,
  LogIn,
  UserPlus,
  Search,
  ShieldCheck,
  ArrowRight,
  Briefcase,
  BadgeCheck,
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

// ── Demo missions displayed when DB is empty ──
const BADGES = ["Mission Auditée & Certifiée", "Validation Expertise Métier", "Algorithme de Confiance ✓"] as const;
const randomBadge = (i: number) => BADGES[i % BADGES.length];

const DEMO_MISSIONS = [
  {
    id: "demo-1",
    title: "Remplacement Chaudière Gaz par PAC Air-Eau",
    description: "Maison individuelle 120m². Cherche artisan RGE pour dossier MaPrimeRénov. Budget estimé : 12 000€.",
    city: "Lyon (69)",
    budget: 12000,
    budget_range: "~12 000€",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    category: { id: "c1", name: "Chauffage / Climatisation" },
    client_name: "Client vérifié", applicants_count: 4, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(0),
  },
  {
    id: "demo-2",
    title: "Pose de 5 fenêtres Alu double vitrage",
    description: "Rénovation appartement centre-ville. Isolation phonique haute performance exigée.",
    city: "Bordeaux (33)",
    budget: null, budget_range: "Sur devis",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    category: { id: "c2", name: "Menuiserie" },
    client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(1),
  },
  {
    id: "demo-3",
    title: "Réfection complète toiture ardoise",
    description: "Surface 80m². Travaux prévus pour le printemps. Devis comparatifs souhaités.",
    city: "Rennes (35)",
    budget: null, budget_range: "Sur devis",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    category: { id: "c3", name: "Couverture / Toiture" },
    client_name: "Client vérifié", applicants_count: 5, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: "Urgent",
  },
  {
    id: "demo-4",
    title: "Installation 8 panneaux photovoltaïques",
    description: "Autoconsommation avec revente du surplus. Toit plat disponible.",
    city: "Montpellier (34)",
    budget: null, budget_range: "Sur devis",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    category: { id: "c4", name: "Énergie Solaire" },
    client_name: "Client vérifié", applicants_count: 3, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(2),
  },
  {
    id: "demo-5",
    title: "Mise aux normes NF C 15-100",
    description: "Appartement haussmannien. Changement complet du tableau et des prises.",
    city: "Paris (75)",
    budget: null, budget_range: "Sur devis",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    category: { id: "c5", name: "Électricité" },
    client_name: "Client vérifié", applicants_count: 7, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: "En attente d'artisan",
  },
  {
    id: "demo-6",
    title: "Pose de Velux sur extension bois",
    description: "Extension ossature bois récente. Pose de 2 Velux avec volet roulant solaire. Accès échafaudage possible.",
    city: "Nantes (44)",
    budget: 3500, budget_range: "~3 500€",
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    category: { id: "c6", name: "Menuiserie" },
    client_name: "Client vérifié", applicants_count: 3, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(0),
  },
  {
    id: "demo-7",
    title: "Installation clim réversible appartement",
    description: "T3 de 65m² au 2e étage. Souhait d'un bi-split discret. Balcon disponible pour le groupe extérieur.",
    city: "Marseille (13)",
    budget: 4500, budget_range: "~4 500€",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    category: { id: "c7", name: "Climatisation" },
    client_name: "Client vérifié", applicants_count: 6, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(1),
  },
  {
    id: "demo-8",
    title: "Isolation thermique par l'extérieur (ITE)",
    description: "Maison mitoyenne années 70. Façade 90m² à isoler. Finition enduit gratté souhaité.",
    city: "Strasbourg (67)",
    budget: 18000, budget_range: "~18 000€",
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    category: { id: "c8", name: "Isolation" },
    client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(2),
  },
  {
    id: "demo-9",
    title: "Rénovation complète de salle de bain",
    description: "Remplacement baignoire par douche italienne. Faïence, plomberie, électricité. Surface 7m².",
    city: "Toulouse (31)",
    budget: 8000, budget_range: "~8 000€",
    created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    category: { id: "c9", name: "Plomberie" },
    client_name: "Client vérifié", applicants_count: 8, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(0),
  },
  {
    id: "demo-10",
    title: "Traitement de charpente contre les termites",
    description: "Villa de plain-pied. Diagnostic termites positif. Traitement curatif + préventif nécessaire.",
    city: "Biarritz (64)",
    budget: 5000, budget_range: "~5 000€",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    category: { id: "c10", name: "Charpente / Bois" },
    client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: "Urgent",
  },
  {
    id: "demo-11",
    title: "Installation de borne de recharge VE",
    description: "Maison individuelle avec garage. Installation wallbox 7kW sur tableau existant conforme.",
    city: "Grenoble (38)",
    budget: 1800, budget_range: "~1 800€",
    created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
    category: { id: "c11", name: "Électricité" },
    client_name: "Client vérifié", applicants_count: 4, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(1),
  },
  {
    id: "demo-12",
    title: "Ravalement façade immeuble R+2",
    description: "Copropriété de 6 lots. Nettoyage haute pression, réparation fissures, peinture imperméable.",
    city: "Rouen (76)",
    budget: 25000, budget_range: "~25 000€",
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    category: { id: "c12", name: "Maçonnerie" },
    client_name: "Client vérifié", applicants_count: 3, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(2),
  },
  {
    id: "demo-13",
    title: "Peinture intérieure appartement 4 pièces",
    description: "80m² habitable. Lessivage, enduit de rebouchage, 2 couches de peinture acrylique. Plafonds inclus.",
    city: "Nice (06)",
    budget: 4000, budget_range: "~4 000€",
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    category: { id: "c13", name: "Peinture" },
    client_name: "Client vérifié", applicants_count: 5, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(0),
  },
  {
    id: "demo-14",
    title: "Installation domotique maison neuve",
    description: "Maison RT2012, 140m². Volets, éclairages, chauffage connectés. Système KNX ou équivalent.",
    city: "Reims (51)",
    budget: 12000, budget_range: "~12 000€",
    created_at: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
    category: { id: "c14", name: "Domotique" },
    client_name: "Client vérifié", applicants_count: 2, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(1),
  },
  {
    id: "demo-15",
    title: "Création terrasse bois sur plots",
    description: "Terrasse 30m² en pin Douglas. Sol irrégulier, plots réglables nécessaires. Vue mer.",
    city: "Ajaccio (2A)",
    budget: 6000, budget_range: "~6 000€",
    created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    category: { id: "c15", name: "Menuiserie" },
    client_name: "Client vérifié", applicants_count: 1, has_applied: false, photos: null, status: "published", client_id: "", fake_applicants_count: 0,
    verified_by_andrea: true, trust_badge: randomBadge(2),
  },
];

const formatTimeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Il y a moins d'1h";
  if (hours < 24) return `Il y a ${hours}h`;
  return "Aujourd'hui";
};

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
  const [showTeasingModal, setShowTeasingModal] = useState(false);

  const { 
    canApply: canApplyLimit, 
    appliedThisMonth, 
    limit: missionLimit, 
    incrementApplicationCount,
    isLoading: limitLoading 
  } = useMissionApplicationLimit();

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

  const { data: dbMissions, isLoading: missionsLoading } = useDemoMissions(user?.id, role);
  const { data: categories } = useCategoriesHierarchy();

  // Always show demo missions combined with DB missions for volume
  const missions = useMemo(() => {
    const dbIds = new Set((dbMissions || []).map((m: any) => m.id));
    const demos = DEMO_MISSIONS.filter(d => !dbIds.has(d.id));
    return [...(dbMissions || []), ...demos] as any[];
  }, [dbMissions]);

  const missionCities = useMemo(() => {
    return missions?.map(m => m.city).filter(Boolean) || [];
  }, [missions]);

  const { getCoordinates, isLoading: coordinatesLoading } = useCityCoordinatesCache(missionCities);

  const normalizeCity = (city: string): string => {
    return city
      .split("(")[0]
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const { filteredMissions, missionDistances } = useMemo(() => {
    if (!missions) return { filteredMissions: [], missionDistances: new Map<string, number>() };
    
    const distances = new Map<string, number>();
    
    const filtered = missions.filter(mission => {
      if (categoryFilter && categoryFilter !== "all" && mission.category?.name !== categoryFilter) {
        return false;
      }
      
      const missionCity = mission.city || "";
      
      if (selectedCity && searchCoordinates) {
        const missionCoords = getCoordinates(missionCity);
        
        if (radiusFilter === 0) {
          const normalizedMissionCity = normalizeCity(missionCity);
          const normalizedSelectedCity = normalizeCity(selectedCity);
          
          if (normalizedMissionCity !== normalizedSelectedCity) {
            return false;
          }
          
          if (missionCoords) {
            const distance = calculateDistance(
              searchCoordinates.lat, searchCoordinates.lng,
              missionCoords.lat, missionCoords.lng
            );
            distances.set(mission.id, distance);
          }
        } else {
          if (!missionCoords) return false;
          
          const distance = calculateDistance(
            searchCoordinates.lat, searchCoordinates.lng,
            missionCoords.lat, missionCoords.lng
          );
          distances.set(mission.id, distance);
          
          if (distance > radiusFilter) return false;
        }
      } else if (locationFilter && locationFilter.length >= 2 && !selectedCity) {
        const normalizedMissionCity = normalizeCity(missionCity);
        const normalizedFilter = normalizeCity(locationFilter);
        
        if (!normalizedMissionCity.includes(normalizedFilter)) return false;
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

  const getAutoMessage = () => {
    const artisanName = artisanProfile?.business_name || "un artisan qualifié";
    return `Bonjour, je suis ${artisanName}.\nVotre mission m'intéresse, je suis disponible pour en discuter.`;
  };

  const handleApply = async (mission: any) => {
    if (!isAuthenticated) {
      toast({ title: "Connexion requise", description: "Vous devez être connecté pour postuler.", variant: "destructive" });
      return;
    }
    if (role !== "artisan") {
      toast({ title: "Accès réservé", description: "Seuls les artisans peuvent postuler aux missions.", variant: "destructive" });
      return;
    }
    if (!artisanProfile?.id) {
      toast({ title: "Profil artisan introuvable", description: "Veuillez compléter votre profil artisan avant de postuler.", variant: "destructive" });
      return;
    }
    if (!canApplyLimit) {
      toast({ title: "Limite atteinte", description: `Vous avez atteint votre limite de ${missionLimit} mission(s) ce mois-ci.`, variant: "destructive" });
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
          toast({ title: "Candidature existante", description: "Vous avez déjà postulé à cette mission.", variant: "destructive" });
          return;
        }
        throw error;
      }

      await incrementApplicationCount();

      if (mission.client_id) {
        await supabase.rpc("create_notification", {
          p_user_id: mission.client_id,
          p_type: "new_application",
          p_title: "Nouvelle candidature",
          p_message: `Un artisan a postulé à votre mission "${mission.title}"`,
          p_related_id: mission.id
        });
      }

      toast({ title: "Candidature envoyée !", description: `Votre candidature pour "${mission.title}" a été envoyée avec succès.` });
      setSelectedMission(null);
      setDetailMission(null);
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message || "Impossible d'envoyer votre candidature.", variant: "destructive" });
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
    return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
  };

  const canApply = isAuthenticated && role === "artisan" && !!artisanProfile?.id && canApplyLimit;
  const showLimitWarning = isAuthenticated && role === "artisan" && artisanProfile?.id && !canApplyLimit;
  const showLimitCounter = isAuthenticated && role === "artisan" && artisanProfile?.id && missionLimit !== "unlimited";

  // Handle "Voir la mission" click - teasing for non-authenticated
  const handleViewMission = (mission: any) => {
    if (!isAuthenticated) {
      setShowTeasingModal(true);
    } else {
      setDetailMission(mission);
    }
  };

  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Show floating filter button on mobile when scrolled past hero
  useEffect(() => {
    const handleScroll = () => {
      setShowMobileFilter(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToFilters = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Missions disponibles pour artisans - Trouvez vos chantiers"
        description="Des chantiers vérifiés et des clients qualifiés vous attendent. Consultez les missions disponibles et postulez directement."
        canonical="https://artisansvalides.fr/nos-missions"
      />
      <Navbar />
      
      <main className="pt-32 lg:pt-20">
        {/* ── Hero Section ── */}
        <section className="bg-navy relative overflow-hidden py-12 md:py-20 lg:py-28">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gold/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          <div className="container mx-auto px-4 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto mb-12"
            >
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                Trouvez votre prochaine <span className="text-gradient-gold">opportunité</span>
              </h1>
              <p className="text-lg text-white/70">
                Des chantiers vérifiés et des clients qualifiés vous attendent.
              </p>
            </motion.div>

            {/* ── Inline Search Bar ── */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 md:p-6">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-end">
                  {/* Category filter */}
                  <div className="flex-1 w-full">
                    <Label className="text-white/80 text-sm mb-2 block">Quel métier ?</Label>
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

                  {/* City filter */}
                  <div className="flex-1 w-full">
                    <Label className="text-white/80 text-sm mb-2 block">Quelle ville ?</Label>
                    <CityAutocompleteAPI
                      value={locationFilter}
                      onChange={(value, coordinates) => {
                        setLocationFilter(value);
                        if (coordinates) {
                          setSelectedCity(value);
                          setSearchCoordinates(coordinates);
                        } else {
                          setSelectedCity("");
                          setSearchCoordinates(null);
                          setRadiusFilter(0);
                        }
                        setCurrentPage(1);
                      }}
                      placeholder="Rechercher une ville..."
                    />
                  </div>

                  {/* Search button */}
                  <Button 
                    variant="gold" 
                    size="lg" 
                    className="w-full md:w-auto gap-2 shrink-0"
                    onClick={() => setCurrentPage(1)}
                  >
                    <Search className="w-5 h-5" />
                    Rechercher
                  </Button>
                </div>

                {/* Active filters + reset */}
                {(categoryFilter || locationFilter) && (
                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <span className="text-white/50 text-sm">Filtres :</span>
                    {categoryFilter && categoryFilter !== "all" && (
                      <Badge className="bg-white/20 text-white hover:bg-white/30 cursor-pointer" onClick={() => { setCategoryFilter(""); setCurrentPage(1); }}>
                        {categoryFilter} ×
                      </Badge>
                    )}
                    {locationFilter && (
                      <Badge className="bg-white/20 text-white hover:bg-white/30 cursor-pointer" onClick={() => { setLocationFilter(""); setSelectedCity(""); setSearchCoordinates(null); setRadiusFilter(0); setCurrentPage(1); }}>
                        {locationFilter} ×
                      </Badge>
                    )}
                    <button onClick={resetFilters} className="text-white/50 hover:text-white text-sm ml-auto flex items-center gap-1 transition-colors">
                      <RotateCcw className="w-3 h-3" />
                      Tout effacer
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Missions Catalogue ── */}
        <section className="py-8 md:py-16 bg-muted/30">
          <div className="container mx-auto px-3 md:px-4 lg:px-8">
            {/* Section header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
                  Nos chantiers en cours
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredMissions.length} mission{filteredMissions.length > 1 ? "s" : ""} disponible{filteredMissions.length > 1 ? "s" : ""}
                </p>
              </div>

              {showLimitCounter && !limitLoading && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Candidatures : {appliedThisMonth}/{missionLimit}
                  </Badge>
                  {!canApplyLimit && (
                    <Badge variant="destructive" className="text-sm px-3 py-1">Limite atteinte</Badge>
                  )}
                </div>
              )}
            </div>

            {showLimitWarning && (
              <Alert variant="destructive" className="mb-6">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Vous avez atteint votre limite de {missionLimit} candidature(s) ce mois-ci. 
                  <a href="/artisan/abonnement" className="underline ml-1 font-medium">Passez à un abonnement supérieur</a> pour postuler à plus de missions.
                </AlertDescription>
              </Alert>
            )}

            {/* Reassurance banner */}
            <div className="flex items-start gap-3 bg-card border border-border rounded-xl p-4 mb-8">
              <span className="text-xl shrink-0">🛡️</span>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Chaque demande publiée ici fait l'objet d'une analyse de faisabilité technique. <span className="font-medium text-foreground">Vos données ne sont jamais vendues</span> : vous gardez le contrôle total sur qui peut vous contacter.
              </p>
            </div>

            {/* ── Mission Cards Grid ── */}
            {missionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6 space-y-4">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : paginatedMissions.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {paginatedMissions.map((mission, index) => (
                    <motion.div
                      key={mission.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card className="h-full group hover:shadow-xl transition-all duration-300 border-border/60 hover:border-gold/30 overflow-hidden">
                        <CardContent className="p-0 flex flex-col h-full">
                          {/* Top colored bar */}
                          <div className="h-1.5 bg-gradient-to-r from-gold to-gold-light" />
                          
                          <div className="p-6 flex flex-col h-full">
                            {/* Badge métier */}
                            <div className="flex items-center justify-between mb-3">
                              <Badge className="bg-navy/10 text-navy hover:bg-navy/20 gap-1 font-medium">
                                <Briefcase className="w-3 h-3" />
                                {mission.category?.name || "Autre"}
                              </Badge>
                              {mission.has_applied && (
                              <Badge className="bg-success/10 text-success gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Postulé
                                </Badge>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="font-bold text-base md:text-lg text-foreground mb-3 line-clamp-2 group-hover:text-navy transition-colors">
                              {mission.title}
                            </h3>

                            {/* Location */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <MapPin className="w-4 h-4 text-gold shrink-0" />
                              <span>{mission.city}</span>
                              {missionDistances.get(mission.id) !== undefined && selectedCity && (
                                <span className="text-xs font-medium bg-gold/10 text-gold-dark px-2 py-0.5 rounded-full">
                                  {Math.round(missionDistances.get(mission.id)!)} km
                                </span>
                              )}
                            </div>

                            {/* Budget */}
                            {(mission.budget || mission.budget_range) && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Euro className="w-4 h-4 text-gold shrink-0" />
                                <span>Budget estimé : <strong className="text-foreground">
                                  {mission.budget_range || `${mission.budget?.toLocaleString('fr-FR')} €`}
                                </strong></span>
                              </div>
                            )}

                            {/* Description excerpt */}
                            {mission.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                {mission.description}
                              </p>
                            )}

                            {/* Date + reactivity */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatTimeAgo(mission.created_at)}</span>
                              </div>
                              <span className={cn(
                                "italic",
                                (mission.applicants_count || 0) >= 5 ? "text-gold font-medium" : "text-muted-foreground/70"
                              )}>
                                {(mission.applicants_count || 0) >= 5
                                  ? "Mise en relation disponible"
                                  : "Analyse en cours par nos experts"}
                              </span>
                            </div>

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Trust badges */}
                            <div className="flex flex-col gap-1.5 mb-4">
                              <div className="flex items-center justify-between">
                                <div className={cn(
                                  "flex items-center gap-1.5 text-xs font-semibold",
                                  mission.trust_badge === "Urgent" ? "text-destructive" : 
                                  mission.trust_badge === "En attente d'artisan" ? "text-amber-600" : "text-success"
                                )}>
                                  <ShieldCheck className="w-4 h-4" />
                                  <span>{mission.trust_badge || "Mission Auditée & Certifiée"}</span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>{mission.applicants_count || 0} candidat{(mission.applicants_count || 0) > 1 ? "s" : ""}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <BadgeCheck className="w-3.5 h-3.5 text-gold" />
                                <span>Le client garde la main sur ses coordonnées. Transmission après validation de votre profil.</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 italic">
                                <span>Analyse de faisabilité technique effectuée par nos outils d'expertise</span>
                              </div>
                            </div>

                            {/* CTA Button - Touch-friendly */}
                            <Button 
                              variant="gold"
                              className="w-full gap-2 h-12 text-base font-bold"
                              onClick={() => handleViewMission(mission)}
                            >
                              <Send className="w-5 h-5" />
                              Postuler à ce chantier
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-10">
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
                      <Button variant="outline" onClick={() => { setRadiusFilter(30); setCurrentPage(1); }}>Élargir à 30 km</Button>
                      <Button variant="outline" onClick={() => { setRadiusFilter(50); setCurrentPage(1); }}>Élargir à 50 km</Button>
                    </div>
                  </>
                ) : selectedCity && radiusFilter > 0 ? (
                  <>
                    <p className="text-muted-foreground text-lg mb-2">
                      Aucune mission trouvée dans un rayon de {radiusFilter} km autour de <strong>{selectedCity.split("(")[0].trim()}</strong>
                    </p>
                    <div className="flex gap-2 justify-center mt-4">
                      <Button variant="outline" onClick={() => { setRadiusFilter(Math.min(200, radiusFilter + 50)); setCurrentPage(1); }}>Augmenter le rayon</Button>
                      <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>
                    </div>
                  </>
                ) : locationFilter && !selectedCity ? (
                  <>
                    <p className="text-muted-foreground text-lg mb-2">Aucune mission ne correspond à "{locationFilter}"</p>
                    <p className="text-muted-foreground text-sm mb-4">Sélectionnez une ville dans la liste pour activer la recherche géographique</p>
                    <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground text-lg">Aucune mission trouvée avec ces critères</p>
                    <Button variant="outline" onClick={resetFilters} className="mt-4">Réinitialiser les filtres</Button>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Conversion Banner ── */}
        <section className="bg-navy py-16">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <BadgeCheck className="w-12 h-12 text-gold mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                La technologie au service du terrain
              </h2>
              <p className="text-lg text-white/70 mb-4 max-w-xl mx-auto">
                Nous utilisons la technologie pour éliminer les mauvais payeurs et les mauvais poseurs. Pas de blabla, juste des chantiers vérifiés et des pros certifiés.
              </p>
              <p className="text-sm text-white/50 mb-8 max-w-lg mx-auto">
                Notre algorithme de confiance, combiné à 20 ans de savoir-faire terrain, sélectionne les meilleurs artisans de France.
              </p>
              <Link to="/devenir-artisan">
                <Button variant="gold" size="xl" className="gap-2">
                  Rejoindre le réseau certifié
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Floating Mobile Filter Button ── */}
      {showMobileFilter && (
        <button
          onClick={scrollToFilters}
          className="md:hidden fixed bottom-24 right-4 z-50 bg-gold text-navy-dark font-bold px-5 py-3 rounded-full shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
        >
          <MapPin className="w-4 h-4" />
          Filtrer par ville
        </button>
      )}

      <Footer />

      {/* ── Mission Detail Modal ── */}
      <MissionDetailModal
        mission={detailMission}
        open={!!detailMission}
        onClose={() => setDetailMission(null)}
        onApply={() => {
          if (detailMission) handleApply(detailMission);
        }}
        canApply={canApply}
      />

      {/* ── Application Confirmation Modal ── */}
      <Dialog open={!!selectedMission} onOpenChange={() => setSelectedMission(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Postuler à cette mission</DialogTitle>
            <DialogDescription>{selectedMission?.title}</DialogDescription>
          </DialogHeader>
          
          {!isAuthenticated ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">Vous devez être connecté en tant qu'artisan pour postuler.</p>
              <Link to="/auth"><Button>Se connecter</Button></Link>
            </div>
          ) : role !== "artisan" ? (
            <div className="py-6 text-center">
              <p className="text-muted-foreground mb-4">Seuls les artisans peuvent postuler aux missions.</p>
              <Link to="/devenir-artisan"><Button variant="outline">Devenir partenaire</Button></Link>
            </div>
          ) : !canApplyLimit ? (
            <div className="py-6 text-center">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">Limite de candidatures atteinte</p>
              <p className="text-muted-foreground mb-4">Vous avez utilisé vos {missionLimit} candidature(s) ce mois-ci.</p>
              <Link to="/artisan/abonnement"><Button>Passer à un abonnement supérieur</Button></Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium text-foreground mb-2">Votre message de candidature :</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{getAutoMessage()}</p>
                </div>
                <p className="text-xs text-muted-foreground">Ce message sera envoyé automatiquement au client avec votre candidature.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedMission(null)}>Annuler</Button>
                <Button onClick={() => handleApply(selectedMission)} disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Envoi..." : "Confirmer ma candidature"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Teasing Modal (non-authenticated / non-artisan) ── */}
      <Dialog open={showTeasingModal} onOpenChange={setShowTeasingModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ShieldCheck className="w-6 h-6 text-gold" />
              Accès réservé au réseau national
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="bg-navy/5 border border-navy/10 rounded-xl p-6 text-center">
              <p className="text-foreground font-medium text-lg mb-3">
                Cet accès est réservé aux membres du réseau national Artisans Validés.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Votre profil doit être audité (Assurances & Expertise) avant toute mise en relation. Notre processus de certification garantit la qualité pour les deux parties.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <Link to="/devenir-artisan" className="w-full" onClick={() => setShowTeasingModal(false)}>
                <Button variant="gold" className="w-full gap-2" size="lg">
                  <UserPlus className="w-5 h-5" />
                  Devenir Membre
                </Button>
              </Link>
              <Link to="/auth" className="w-full" onClick={() => setShowTeasingModal(false)}>
                <Button variant="outline" className="w-full gap-2">
                  <LogIn className="w-4 h-4" />
                  J'ai déjà un compte
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Auth Modal (legacy) ── */}
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
                <Button className="w-full gap-2"><LogIn className="w-4 h-4" />Se connecter</Button>
              </Link>
              <Link to="/devenir-artisan" className="w-full" onClick={() => setShowAuthModal(false)}>
                <Button variant="outline" className="w-full gap-2"><UserPlus className="w-4 h-4" />Devenir partenaire</Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NosMissions;
