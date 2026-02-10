import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, RotateCcw, X, SlidersHorizontal } from "lucide-react";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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

const QUICK_FILTERS = [
  { label: "Solaire", icon: "Sun", keyword: "Photovoltaïque" },
  { label: "Menuiserie", icon: "door-open", keyword: "Menuiserie" },
  { label: "Toiture", icon: "home", keyword: "Toiture & Façade" },
  { label: "Chauffage", icon: "Thermometer", keyword: "PAC" },
];

const DEFAULT_RADIUS = 40;

const ArtisanFilters = ({ onFiltersChange }: ArtisanFiltersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string | null>(null);
  const [showDistanceSlider, setShowDistanceSlider] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const { data: categoriesData } = useCategoriesHierarchy();

  // Build flat list of all categories for autocomplete
  const allCategories = useMemo(() => {
    if (!categoriesData) return [];
    const flat: { id: string; name: string; icon: string | null; parentName?: string }[] = [];
    categoriesData.forEach((parent) => {
      flat.push({ id: parent.id, name: parent.name, icon: parent.icon });
      parent.children.forEach((child) => {
        flat.push({ id: child.id, name: child.name, icon: child.icon, parentName: parent.name });
      });
    });
    return flat;
  }, [categoriesData]);

  // Filtered suggestions based on search query
  const suggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return allCategories
      .filter((c) => c.name.toLowerCase().includes(q))
      .slice(0, 6);
  }, [searchQuery, allCategories]);

  const hasFilters = selectedCategoryId || selectedCity || locationInput || activeQuickFilter;

  // Emit filter changes
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

  // Show distance slider when city is selected
  useEffect(() => {
    setShowDistanceSlider(!!coordinates);
  }, [coordinates]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelectCategory = (cat: { id: string; name: string }) => {
    setSelectedCategoryId(cat.id);
    setSelectedCategoryName(cat.name);
    setSearchQuery(cat.name);
    setShowSuggestions(false);
    setActiveQuickFilter(null);
  };

  const handleQuickFilter = (filter: typeof QUICK_FILTERS[0]) => {
    if (activeQuickFilter === filter.keyword) {
      // Deselect
      setActiveQuickFilter(null);
      setSelectedCategoryId("");
      setSelectedCategoryName("");
      setSearchQuery("");
    } else {
      setActiveQuickFilter(filter.keyword);
      // Find matching category
      const match = allCategories.find((c) => c.name === filter.keyword);
      if (match) {
        setSelectedCategoryId(match.id);
        setSelectedCategoryName(match.name);
      } else {
        // Fallback: search by parent name
        const parentMatch = allCategories.find((c) => c.name.toLowerCase().includes(filter.keyword.toLowerCase()));
        if (parentMatch) {
          setSelectedCategoryId(parentMatch.id);
          setSelectedCategoryName(parentMatch.name);
        } else {
          setSelectedCategoryId("");
          setSelectedCategoryName(filter.keyword);
        }
      }
      setSearchQuery(filter.keyword);
    }
  };

  const handleReset = () => {
    setSearchQuery("");
    setSelectedCategoryId("");
    setSelectedCategoryName("");
    setLocationInput("");
    setSelectedCity("");
    setCoordinates(null);
    setRadius(DEFAULT_RADIUS);
    setActiveQuickFilter(null);
    setShowDistanceSlider(false);
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="bg-white rounded-2xl shadow-soft border border-border overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Keyword Search */}
          <div ref={searchRef} className="relative flex-1 border-b md:border-b-0 md:border-r border-border">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                  if (!e.target.value) {
                    setSelectedCategoryId("");
                    setSelectedCategoryName("");
                    setActiveQuickFilter(null);
                  }
                }}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                placeholder="Quel métier recherchez-vous ?"
                className="h-12 md:h-14 pl-10 pr-10 border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategoryId("");
                    setSelectedCategoryName("");
                    setActiveQuickFilter(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full bg-white border border-border rounded-b-xl shadow-lg max-h-[280px] overflow-y-auto">
                {suggestions.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSelectCategory(cat)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/60 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <CategoryIcon iconName={cat.icon} size={16} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-medium text-foreground">{cat.name}</span>
                      {cat.parentName && (
                        <span className="text-xs text-muted-foreground ml-2">
                          dans {cat.parentName}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* City Search */}
          <div className="flex-1 flex items-center">
            <div className="flex-1">
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
                className="[&_input]:h-12 [&_input]:md:h-14 [&_input]:border-0 [&_input]:rounded-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:ring-offset-0"
              />
            </div>

            {/* Reset Button */}
            {hasFilters && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-10 w-10 mr-2 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Réinitialiser les filtres"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Filters + Distance Slider Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Quick Filter Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide shrink-0">Populaires :</span>
          {QUICK_FILTERS.map((filter) => (
            <button
              key={filter.keyword}
              onClick={() => handleQuickFilter(filter)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border",
                activeQuickFilter === filter.keyword
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-white text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              <CategoryIcon iconName={filter.icon} size={14} className={activeQuickFilter === filter.keyword ? "text-primary-foreground" : "text-muted-foreground"} />
              {filter.label}
            </button>
          ))}
        </div>

        {/* Distance Slider */}
        {showDistanceSlider && (
          <div className="flex items-center gap-3 sm:ml-auto bg-white border border-border rounded-full px-4 py-2 shadow-sm">
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
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtisanFilters;
