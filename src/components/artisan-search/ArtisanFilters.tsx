import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, SlidersHorizontal, ChevronDown } from "lucide-react";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { useCategoriesHierarchy, CategoryWithChildren } from "@/hooks/useCategories";
import { useCategoryKeywords, searchKeywords, KeywordSuggestion } from "@/hooks/useCategoryKeywords";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface ArtisanFiltersProps {
  onFiltersChange: (filters: {
    category: string;
    categoryName: string;
    city: string;
    cityInput: string;
    radius: number;
    coordinates: { lat: number; lng: number } | null;
    urgency?: boolean;
    rge?: boolean;
  }) => void;
}

const POPULAR_PILLS = [
  { label: "☀️ Photovoltaïque", parentName: "Énergie & Solaire", childName: "Photovoltaïque" },
  { label: "🚿 Salle de Bain", parentName: "Cuisine & Bain", childName: "Salle de bain clé en main" },
  { label: "🏠 Rénovation Globale", parentName: "Rénovation Globale", childName: null },
  { label: "🚨 Dépannage Urgent", parentName: "Dépannage Urgent", childName: null },
];

const DEFAULT_RADIUS = 40;

const ArtisanFilters = ({ onFiltersChange }: ArtisanFiltersProps) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [showDistanceSlider, setShowDistanceSlider] = useState(false);
  const [megamenuOpen, setMegamenuOpen] = useState(false);
  const [urgencyActive, setUrgencyActive] = useState(false);
  const [rgeActive, setRgeActive] = useState(false);

  // Semantic search state
  const [semanticQuery, setSemanticQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { data: categoriesData } = useCategoriesHierarchy();
  const { data: keywordsData } = useCategoryKeywords();

  const suggestions = useMemo(
    () => searchKeywords(semanticQuery, keywordsData),
    [semanticQuery, keywordsData]
  );

  const hasFilters = selectedCategoryId || selectedCity || locationInput;

  // Categories eligible for RGE/aides d'État
  const RGE_ELIGIBLE_CATEGORIES = useMemo(() => new Set([
    "Photovoltaïque", "PAC", "Chauffage", "Isolation", "Borne de recharge IRVE",
    "Menuiserie extérieure", "Énergie & Solaire", "Toiture & Façade",
    "Domotique", "Chauffage en panne"
  ].map(s => s.toLowerCase())), []);

  const isRgeEligibleCategory = useMemo(() => {
    if (!selectedCategoryName) return false;
    return RGE_ELIGIBLE_CATEGORIES.has(selectedCategoryName.toLowerCase());
  }, [selectedCategoryName, RGE_ELIGIBLE_CATEGORIES]);

  useEffect(() => {
    onFiltersChange({
      category: selectedCategoryId,
      categoryName: selectedCategoryName,
      city: selectedCity,
      cityInput: locationInput,
      radius: coordinates ? radius : 0,
      coordinates,
      urgency: urgencyActive,
      rge: rgeActive,
    });
  }, [selectedCategoryId, selectedCategoryName, selectedCity, locationInput, coordinates, radius, urgencyActive, rgeActive]);

  useEffect(() => {
    setShowDistanceSlider(!!coordinates);
  }, [coordinates]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectCategory = useCallback((id: string, name: string, label: string) => {
    if (selectedCategoryId === id) {
      setSelectedCategoryId("");
      setSelectedCategoryName("");
      setSelectedLabel("");
    } else {
      setSelectedCategoryId(id);
      setSelectedCategoryName(name);
      setSelectedLabel(label);
    }
    setMegamenuOpen(false);
  }, [selectedCategoryId]);

  const selectPill = useCallback((pill: typeof POPULAR_PILLS[number]) => {
    if (!categoriesData) return;
    const parent = categoriesData.find(c => c.name === pill.parentName);
    if (!parent) return;

    if (pill.childName) {
      const child = parent.children.find(c => c.name === pill.childName);
      if (child) {
        selectCategory(child.id, child.name, pill.label);
      }
    } else {
      selectCategory(parent.id, parent.name, pill.label);
    }
  }, [categoriesData, selectCategory]);

  const handleSuggestionClick = useCallback((suggestion: KeywordSuggestion) => {
    // Find parent name for label
    let label = suggestion.categoryName;
    if (suggestion.parentId && categoriesData) {
      const parent = categoriesData.find(p => p.id === suggestion.parentId);
      if (parent) {
        label = `${parent.name} › ${suggestion.categoryName}`;
      }
    }
    selectCategory(suggestion.categoryId, suggestion.categoryName, label);
    setSemanticQuery("");
    setShowSuggestions(false);
  }, [categoriesData, selectCategory]);

  const handleReset = () => {
    setSelectedCategoryId("");
    setSelectedCategoryName("");
    setSelectedLabel("");
    setLocationInput("");
    setSelectedCity("");
    setCoordinates(null);
    setRadius(DEFAULT_RADIUS);
    setShowDistanceSlider(false);
    setSemanticQuery("");
    setShowSuggestions(false);
    setUrgencyActive(false);
    setRgeActive(false);
  };

  return (
    <div className="space-y-5">
      {/* Semantic Search Bar */}
      <div className="relative" ref={suggestionsRef}>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8892B0] pointer-events-none" />
          <input
            type="text"
            value={semanticQuery}
            onChange={(e) => {
              setSemanticQuery(e.target.value);
              setShowSuggestions(e.target.value.length >= 3);
            }}
            onFocus={() => {
              if (semanticQuery.length >= 3) setShowSuggestions(true);
            }}
            placeholder="Décrivez votre besoin... ex: fuite de toit, changer mes fenêtres, rats dans la maison"
            className="w-full h-14 pl-12 pr-4 rounded-2xl text-base font-medium text-white placeholder:text-[#8892B0] border border-[#D4AF37]/20 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all font-['DM_Sans']"
            style={{ backgroundColor: '#112240' }}
          />
        </div>

        {/* Suggestions dropdown */}
        <AnimatePresence>
          {showSuggestions && semanticQuery.length >= 3 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-50 w-full mt-2 rounded-xl border border-[#D4AF37]/20 shadow-xl overflow-hidden"
              style={{ backgroundColor: '#112240' }}
            >
              {suggestions.length > 0 ? (
                <ul className="py-1">
                  {suggestions.map((s) => (
                    <li key={s.categoryId}>
                      <button
                        onClick={() => handleSuggestionClick(s)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left transition-colors hover:bg-[#D4AF37]/10"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#0A192F] flex items-center justify-center shrink-0">
                          <CategoryIcon iconName={s.categoryIcon} size={18} className="text-[#D4AF37]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate font-['DM_Sans']">
                            {s.categoryName}
                          </p>
                          <p className="text-xs text-[#8892B0] truncate">
                            correspond à « {s.matchedKeyword} »
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-4 text-sm text-[#8892B0] text-center font-['DM_Sans']">
                  Aucun métier trouvé — essayez avec d'autres mots
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Search Card */}
      <div className="rounded-2xl shadow-lg border border-[#D4AF37]/20 overflow-hidden" style={{ backgroundColor: '#112240' }}>
        <div className="flex flex-col lg:flex-row">
          {/* Category Megamenu - Left */}
          <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quel métier ?
            </p>
            <Popover open={megamenuOpen} onOpenChange={setMegamenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-full h-12 justify-between rounded-xl text-base font-medium shadow-sm border-border",
                    selectedLabel ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <span className="truncate">
                    {selectedLabel || "Choisir un métier..."}
                  </span>
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[min(90vw,700px)] p-0 shadow-xl z-[60] border-[#D4AF37]/20"
                style={{ backgroundColor: '#112240' }}
                align="start"
                side="bottom"
                sideOffset={8}
                avoidCollisions
              >
                <CategoryMegamenu
                  categories={categoriesData || []}
                  selectedId={selectedCategoryId}
                  onSelect={(id, name, label) => selectCategory(id, name, label)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* City + Search - Right */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Où ?
              </p>
              <CityAutocompleteAPI
                value={locationInput}
                onChange={(value, coords) => {
                  setLocationInput(value);
                  if (coords) {
                    setSelectedCity(value);
                    setCoordinates(coords);
                  } else {
                    setSelectedCity("");
                    setCoordinates(null);
                  }
                }}
                placeholder="Ville ou code postal..."
                className="[&_input]:h-12 [&_input]:text-base [&_input]:rounded-xl [&_input]:shadow-sm [&_input]:border-border"
              />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Button
                size="lg"
                className="flex-1 h-12 rounded-xl text-base font-extrabold gap-2 shadow-md hover:shadow-lg transition-shadow text-[#0A192F] btn-shine font-['DM_Sans']"
                style={{ backgroundColor: '#D4AF37' }}
                onClick={() => {
                  document.getElementById("artisans-results")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Search className="w-5 h-5" />
                Rechercher
              </Button>

              <AnimatePresence>
                {hasFilters && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleReset}
                      className="h-12 w-12 rounded-xl shrink-0"
                      aria-label="Réinitialiser les filtres"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Distance Slider + Popular Pills Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Distance Slider */}
        <AnimatePresence>
          {showDistanceSlider && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-3 bg-card border border-border rounded-full px-4 py-2 shadow-sm"
            >
              <SlidersHorizontal className="h-4 w-4 text-[#D4AF37] shrink-0" />
              <span className="text-sm text-[#8892B0] whitespace-nowrap font-['DM_Sans']">
                {radius === 0 ? "Ville exacte" : `+${radius} km`}
              </span>
              <Slider
                value={[radius]}
                onValueChange={([val]) => setRadius(val)}
                min={0}
                max={100}
                step={5}
                className="w-24 sm:w-32"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Popular Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Populaire :</span>
          {/* Urgency pill */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Badge
              variant={urgencyActive ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm font-medium transition-all",
                urgencyActive 
                  ? "bg-orange-500 text-white border-orange-500 hover:bg-orange-600 shadow-sm" 
                  : "hover:bg-orange-500/10 hover:text-orange-500 hover:border-orange-500/40"
              )}
              onClick={() => setUrgencyActive(!urgencyActive)}
            >
              ⚡ Urgence
            </Badge>
          </motion.div>
          {POPULAR_PILLS.map((pill) => {
            const isActive = selectedLabel === pill.label;
            return (
              <motion.div key={pill.label} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Badge
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer px-3 py-1.5 text-sm font-medium transition-all",
                    isActive ? "shadow-sm" : "hover:bg-muted"
                  )}
                  onClick={() => selectPill(pill)}
                >
                  {pill.label}
                </Badge>
              </motion.div>
            );
          })}

          {/* RGE pill */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Badge
              variant={rgeActive ? "default" : "outline"}
              className={cn(
                "cursor-pointer px-3 py-1.5 text-sm font-medium transition-all",
                rgeActive 
                  ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm" 
                  : "hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/40"
              )}
              onClick={() => setRgeActive(!rgeActive)}
            >
              ✓ Certifié RGE
            </Badge>
          </motion.div>
        </div>
      </div>

      {/* Contextual RGE aide message */}
      <AnimatePresence>
        {isRgeEligibleCategory && !rgeActive && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3"
          >
            <p className="text-sm text-emerald-400 font-medium">
              💡 Ces travaux sont éligibles aux aides d'État. Filtrez par artisans <button onClick={() => setRgeActive(true)} className="underline font-bold hover:text-emerald-300">RGE</button> pour bénéficier de MaPrimeRénov' et des CEE.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───── Megamenu Grid ───── */
function CategoryMegamenu({
  categories,
  selectedId,
  onSelect,
}: {
  categories: CategoryWithChildren[];
  selectedId: string;
  onSelect: (id: string, name: string, label: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 max-h-[60vh] overflow-y-auto" style={{ backgroundColor: '#112240' }}>
      {categories.map((parent) => (
        <div key={parent.id} className="p-3 border-b border-r border-[#D4AF37]/10 last:border-r-0">
          <button
            onClick={() => onSelect(parent.id, parent.name, parent.name)}
            className={cn(
              "flex items-center gap-2 w-full text-left mb-2 p-1.5 rounded-lg transition-colors font-['DM_Sans']",
              selectedId === parent.id
                ? "bg-[#D4AF37]/15 text-[#D4AF37]"
                : "hover:bg-[#D4AF37]/10 text-white"
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
              selectedId === parent.id ? "text-[#0A192F]" : "bg-[#0A192F] text-[#8892B0]"
            )} style={selectedId === parent.id ? { backgroundColor: '#D4AF37' } : undefined}>
              <CategoryIcon iconName={parent.icon} size={16} />
            </div>
            <span className="text-sm font-semibold leading-tight font-['DM_Sans']">{parent.name}</span>
          </button>

          <div className="space-y-0.5 pl-1">
            {parent.children.map((child) => (
              <button
                key={child.id}
                onClick={() => onSelect(child.id, child.name, `${parent.name} › ${child.name}`)}
                className={cn(
                  "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors font-['DM_Sans']",
                  selectedId === child.id
                    ? "bg-[#D4AF37]/15 text-[#D4AF37] font-medium"
                    : "text-[#8892B0] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37]"
                )}
              >
                <CategoryIcon iconName={child.icon} size={14} className="shrink-0" />
                <span className="truncate">{child.name}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ArtisanFilters;
