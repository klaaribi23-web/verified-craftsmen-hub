import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";
import { useCategoriesHierarchy } from "@/hooks/useCategories";
import { CategoryIcon } from "@/components/categories/CategoryIcon";
import { cn } from "@/lib/utils";

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
  { label: "Solaire", icon: "Sun", keyword: "Énergie & Solaire" },
  { label: "Salle de Bain", icon: "Bath", keyword: "Cuisine & Bain" },
  { label: "Toiture", icon: "home", keyword: "Toiture & Façade" },
  { label: "Menuiserie", icon: "door-open", keyword: "Menuiserie" },
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

  // Build flat list of all categories
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

  const handleCategoryChange = (value: string) => {
    if (value === "all") {
      setSelectedCategoryKeyword("");
      setSelectedCategoryId("");
      setSelectedCategoryName("");
      return;
    }
    const option = CATEGORY_OPTIONS.find((o) => o.keyword === value);
    if (option) {
      setSelectedCategoryKeyword(option.keyword);
      const match = allCategories.find((c) => c.name === option.keyword);
      if (match) {
        setSelectedCategoryId(match.id);
        setSelectedCategoryName(match.name);
      } else {
        setSelectedCategoryId("");
        setSelectedCategoryName(option.keyword);
      }
    }
  };

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
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="bg-white rounded-2xl shadow-soft border border-border overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Category Select */}
          <div className="flex-1 border-b md:border-b-0 md:border-r border-border">
            <Select value={selectedCategoryKeyword || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger className="h-12 md:h-14 border-0 rounded-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-4">
                <SelectValue placeholder="Quel métier recherchez-vous ?" />
              </SelectTrigger>
              <SelectContent className="bg-white z-50">
                <SelectItem value="all">Tous les métiers</SelectItem>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.keyword} value={option.keyword}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon iconName={option.icon} size={16} className="text-primary" />
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

      {/* Distance Slider */}
      {showDistanceSlider && (
        <div className="flex items-center gap-3 bg-white border border-border rounded-full px-4 py-2 shadow-sm w-fit">
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
  );
};

export default ArtisanFilters;
