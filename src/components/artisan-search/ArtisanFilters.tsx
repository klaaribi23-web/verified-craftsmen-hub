import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw, SlidersHorizontal, Sun, Bath, Home, DoorOpen } from "lucide-react";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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

const CATEGORY_OPTIONS = [
  { label: "Solaire", icon: Sun, keyword: "Énergie & Solaire" },
  { label: "Salle de Bain", icon: Bath, keyword: "Cuisine & Bain" },
  { label: "Toiture", icon: Home, keyword: "Toiture & Façade" },
  { label: "Menuiserie", icon: DoorOpen, keyword: "Menuiserie" },
];

const POPULAR_PILLS = [
  { label: "☀️ Solaire", keyword: "Énergie & Solaire" },
  { label: "🚿 Salle de Bain", keyword: "Cuisine & Bain" },
];

const DEFAULT_RADIUS = 40;

const ArtisanFilters = ({ onFiltersChange }: ArtisanFiltersProps) => {
  const [selectedCategoryKeyword, setSelectedCategoryKeyword] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [showDistanceSlider, setShowDistanceSlider] = useState(false);

  const { data: categoriesData } = useCategoriesHierarchy();

  const allCategories = useMemo(() => {
    if (!categoriesData) return [];
    const flat: { id: string; name: string; icon: string | null }[] = [];
    categoriesData.forEach((parent) => {
      flat.push({ id: parent.id, name: parent.name, icon: parent.icon });
      parent.children.forEach((child) => {
        flat.push({ id: child.id, name: child.name, icon: child.icon });
      });
    });
    return flat;
  }, [categoriesData]);

  const hasFilters = selectedCategoryKeyword || selectedCity || locationInput;

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

  const selectCategory = useCallback((keyword: string) => {
    if (selectedCategoryKeyword === keyword) {
      // Deselect
      setSelectedCategoryKeyword("");
      setSelectedCategoryId("");
      setSelectedCategoryName("");
      return;
    }
    setSelectedCategoryKeyword(keyword);
    const match = allCategories.find((c) => c.name === keyword);
    if (match) {
      setSelectedCategoryId(match.id);
      setSelectedCategoryName(match.name);
    } else {
      setSelectedCategoryId("");
      setSelectedCategoryName(keyword);
    }
  }, [selectedCategoryKeyword, allCategories]);

  const handleReset = () => {
    setSelectedCategoryKeyword("");
    setSelectedCategoryId("");
    setSelectedCategoryName("");
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
          {/* Category Selector - Left */}
          <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Quel métier ?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
              {CATEGORY_OPTIONS.map((option) => {
                const isSelected = selectedCategoryKeyword === option.keyword;
                const Icon = option.icon;
                return (
                  <motion.button
                    key={option.keyword}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => selectCategory(option.keyword)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-transparent bg-muted/50 hover:border-border hover:bg-muted hover:shadow-sm"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-muted-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium transition-colors text-center leading-tight",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {option.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
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
                  // Scroll to results
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Populaire :</span>
          {POPULAR_PILLS.map((pill) => (
            <motion.div key={pill.keyword} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Badge
                variant={selectedCategoryKeyword === pill.keyword ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-3 py-1.5 text-sm font-medium transition-all",
                  selectedCategoryKeyword === pill.keyword
                    ? "shadow-sm"
                    : "hover:bg-muted"
                )}
                onClick={() => selectCategory(pill.keyword)}
              >
                {pill.label}
              </Badge>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArtisanFilters;
