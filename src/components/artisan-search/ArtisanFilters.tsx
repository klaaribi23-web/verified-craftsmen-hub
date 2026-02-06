import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, RotateCcw } from "lucide-react";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { CityAutocompleteAPI } from "@/components/location/CityAutocompleteAPI";

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

const DEFAULT_RADIUS = 40;

const ArtisanFilters = ({ onFiltersChange }: ArtisanFiltersProps) => {
  const [category, setCategory] = useState<string>("");
  const [categoryName, setCategoryName] = useState<string>("");
  const [locationInput, setLocationInput] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const hasFilters = category || selectedCity || locationInput;

  useEffect(() => {
    onFiltersChange({
      category,
      categoryName,
      city: selectedCity,
      cityInput: locationInput,
      radius: coordinates ? DEFAULT_RADIUS : 0,
      coordinates,
    });
  }, [category, categoryName, selectedCity, locationInput, coordinates]);

  const handleReset = () => {
    setCategory("");
    setCategoryName("");
    setLocationInput("");
    setSelectedCity("");
    setCoordinates(null);
  };

  const handleCategoryChange = (value: string, name: string) => {
    setCategory(value);
    setCategoryName(name);
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-soft border border-border">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Métier */}
        <div className="flex-1 min-w-0">
          <CategorySelect
            value={category}
            onValueChange={handleCategoryChange}
            placeholder="Tous les métiers"
            className="h-11 w-full"
          />
        </div>

        {/* Ville / Code Postal */}
        <div className="flex-1 min-w-0">
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
            className="[&_input]:h-11"
          />
        </div>

        {/* Reset */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground"
            aria-label="Réinitialiser les filtres"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default ArtisanFilters;
