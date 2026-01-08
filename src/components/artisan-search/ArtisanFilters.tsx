import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { Badge } from "@/components/ui/badge";
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

const FiltersContent = ({
  category,
  categoryName,
  selectedCity,
  locationInput,
  setLocationInput,
  setSelectedCity,
  setCoordinates,
  radius,
  setRadius,
  handleReset,
  handleCategoryChange,
}: {
  category: string;
  categoryName: string;
  selectedCity: string;
  locationInput: string;
  setLocationInput: (v: string) => void;
  setSelectedCity: (v: string) => void;
  setCoordinates: (v: { lat: number; lng: number } | null) => void;
  setRadius: (v: number) => void;
  radius: number;
  handleReset: () => void;
  handleCategoryChange: (value: string, name: string) => void;
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-navy">Filtrer par</h3>
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-navy">
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Catégorie */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-navy mb-3 block">
          Catégorie
        </Label>
        <CategorySelect value={category} onValueChange={handleCategoryChange} placeholder="Toutes les catégories" />
      </div>

      {/* Ville */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-navy mb-3 block">
          Ville
        </Label>
        <CityAutocompleteAPI
          value={locationInput}
          onChange={(value, coords) => {
            setLocationInput(value);
            if (coords) {
              // Ville sélectionnée depuis la liste
              setSelectedCity(value);
              setCoordinates(coords);
            } else {
              // Texte tapé sans sélection
              setSelectedCity("");
              setCoordinates(null);
              setRadius(0);
            }
          }}
          placeholder="Rechercher une ville..."
        />
      </div>

      {/* Rayon d'intervention */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-navy mb-3 block">
          Rayon d'intervention
        </Label>
        <div className="space-y-4">
          <Slider
            value={[radius]}
            onValueChange={(values) => setRadius(values[0])}
            max={200}
            min={0}
            step={5}
            className="w-full"
            disabled={!selectedCity}
          />
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">0 km</span>
            <span className={cn(
              "font-medium px-3 py-1 rounded-full",
              selectedCity ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {radius} km
            </span>
            <span className="text-muted-foreground">200 km</span>
          </div>
          {!selectedCity && (
            <p className="text-xs text-muted-foreground italic">
              Sélectionnez d'abord une ville pour activer le rayon
            </p>
          )}
        </div>
      </div>
    </>
  );
};

const ArtisanFilters = ({ onFiltersChange }: ArtisanFiltersProps) => {
  const [category, setCategory] = useState<string>("");
  const [categoryName, setCategoryName] = useState<string>("");
  const [locationInput, setLocationInput] = useState<string>(""); // Texte tapé
  const [selectedCity, setSelectedCity] = useState<string>(""); // Ville confirmée
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Count active filters
  const activeFiltersCount = [category, selectedCity || locationInput, radius > 0].filter(Boolean).length;

  const notifyFiltersChange = () => {
    onFiltersChange({
      category,
      categoryName,
      city: selectedCity,
      cityInput: locationInput,
      radius,
      coordinates
    });
  };

  useEffect(() => {
    notifyFiltersChange();
  }, [category, categoryName, selectedCity, locationInput, radius, coordinates]);

  const handleReset = () => {
    setCategory("");
    setCategoryName("");
    setLocationInput("");
    setSelectedCity("");
    setCoordinates(null);
    setRadius(0);
  };

  const handleCategoryChange = (value: string, name: string) => {
    setCategory(value);
    setCategoryName(name);
  };

  const filtersProps = {
    category,
    categoryName,
    selectedCity,
    locationInput,
    setLocationInput,
    setSelectedCity,
    setCoordinates,
    setRadius,
    radius,
    handleReset,
    handleCategoryChange,
  };

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full h-12 justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filtres</span>
              </div>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
            <SheetHeader className="mb-4">
              <SheetTitle>Filtrer les artisans</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto h-[calc(100%-80px)] pb-4">
              <FiltersContent {...filtersProps} />
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button 
                variant="gold" 
                className="w-full h-12" 
                onClick={() => setMobileOpen(false)}
              >
                Voir les résultats
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block bg-white rounded-2xl p-6 shadow-soft border border-border sticky top-24">
        <FiltersContent {...filtersProps} />
      </div>
    </>
  );
};

export default ArtisanFilters;
