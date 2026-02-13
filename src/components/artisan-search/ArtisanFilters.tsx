import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, SlidersHorizontal, ChevronDown } from "lucide-react";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { useCategoriesHierarchy, CategoryWithChildren } from "@/hooks/useCategories";
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

  const { data: categoriesData } = useCategoriesHierarchy();

  const hasFilters = selectedCategoryId || selectedCity || locationInput;

  useEffect(() => {
    onFiltersChange({
      category: selectedCategoryId,
      categoryName: selectedCategoryName,
      city: selectedCity,
      cityInput: locationInput,
      radius: coordinates ? radius : 0,
      coordinates,
    });
  }, [selectedCategoryId, selectedCategoryName, selectedCity, locationInput, coordinates, radius]);

  useEffect(() => {
    setShowDistanceSlider(!!coordinates);
  }, [coordinates]);

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
      // Select parent category
      selectCategory(parent.id, parent.name, pill.label);
    }
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
  };

  return (
    <div className="space-y-5">
      {/* Main Search Card */}
      <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
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
                className="w-[min(90vw,700px)] p-0 shadow-xl z-[60]"
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
                className="flex-1 h-12 rounded-xl text-base font-semibold gap-2 shadow-md hover:shadow-lg transition-shadow"
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
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
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
        </div>
      </div>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0 max-h-[60vh] overflow-y-auto">
      {categories.map((parent) => (
        <div key={parent.id} className="p-3 border-b border-r border-border last:border-r-0">
          {/* Parent header — clickable to select parent */}
          <button
            onClick={() => onSelect(parent.id, parent.name, parent.name)}
            className={cn(
              "flex items-center gap-2 w-full text-left mb-2 p-1.5 rounded-lg transition-colors",
              selectedId === parent.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-foreground"
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center shrink-0",
              selectedId === parent.id ? "bg-primary text-primary-foreground" : "bg-muted"
            )}>
              <CategoryIcon iconName={parent.icon} size={16} />
            </div>
            <span className="text-sm font-semibold leading-tight">{parent.name}</span>
          </button>

          {/* Children */}
          <div className="space-y-0.5 pl-1">
            {parent.children.map((child) => (
              <button
                key={child.id}
                onClick={() => onSelect(child.id, child.name, `${parent.name} › ${child.name}`)}
                className={cn(
                  "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors",
                  selectedId === child.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
