import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { RotateCcw, MapPin, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterLocations } from "@/data/frenchLocations";
import { CategorySelect } from "@/components/categories/CategorySelect";
import { Badge } from "@/components/ui/badge";

interface ArtisanFiltersProps {
  onFiltersChange: (filters: {
    category: string;
    categoryName: string;
    city: string;
    radius: number;
  }) => void;
}

const FiltersContent = ({
  category,
  setCategory,
  categoryName,
  setCategoryName,
  citySearch,
  setCitySearch,
  selectedCity,
  setSelectedCity,
  showCitySuggestions,
  setShowCitySuggestions,
  radius,
  setRadius,
  handleReset,
  handleCategoryChange,
  handleLocationSelect,
  filteredLocations,
}: {
  category: string;
  setCategory: (v: string) => void;
  categoryName: string;
  setCategoryName: (v: string) => void;
  citySearch: string;
  setCitySearch: (v: string) => void;
  selectedCity: string;
  setSelectedCity: (v: string) => void;
  showCitySuggestions: boolean;
  setShowCitySuggestions: (v: boolean) => void;
  radius: number;
  setRadius: (v: number) => void;
  handleReset: () => void;
  handleCategoryChange: (value: string, name: string) => void;
  handleLocationSelect: (location: { label: string; value: string }) => void;
  filteredLocations: { label: string; value: string; type: string }[];
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

      {/* Ville / Code postal */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-navy mb-3 block">
          Ville / Code postal
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher une ville..." 
            value={citySearch} 
            onChange={e => {
              setCitySearch(e.target.value);
              setShowCitySuggestions(true);
              if (e.target.value === "") {
                setSelectedCity("");
              }
            }} 
            onFocus={() => setShowCitySuggestions(true)} 
            onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)} 
            className="pl-10 h-11" 
          />
          {showCitySuggestions && citySearch && filteredLocations.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredLocations.map(loc => (
                <button 
                  key={loc.value} 
                  type="button" 
                  onClick={() => handleLocationSelect(loc)} 
                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors text-sm flex items-center gap-2 min-h-[44px]"
                >
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    loc.type === 'region' ? 'bg-primary/10 text-primary' : 
                    loc.type === 'department' ? 'bg-accent/10 text-accent' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {loc.type === 'region' ? 'Région' : loc.type === 'department' ? 'Dépt.' : 'Ville'}
                  </span>
                  {loc.label}
                </button>
              ))}
            </div>
          )}
        </div>
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
  const [citySearch, setCitySearch] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [radius, setRadius] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const filteredLocations = citySearch ? filterLocations(citySearch).slice(0, 15) : [];

  // Count active filters
  const activeFiltersCount = [category, selectedCity, radius > 0].filter(Boolean).length;

  const notifyFiltersChange = () => {
    onFiltersChange({
      category,
      categoryName,
      city: selectedCity,
      radius
    });
  };

  useEffect(() => {
    notifyFiltersChange();
  }, [category, categoryName, selectedCity, radius]);

  const handleReset = () => {
    setCategory("");
    setCategoryName("");
    setCitySearch("");
    setSelectedCity("");
    setRadius(0);
  };

  const handleLocationSelect = (location: { label: string; value: string }) => {
    setSelectedCity(location.label);
    setCitySearch(location.label);
    setShowCitySuggestions(false);
  };

  const handleCategoryChange = (value: string, name: string) => {
    setCategory(value);
    setCategoryName(name);
  };

  const filtersProps = {
    category,
    setCategory,
    categoryName,
    setCategoryName,
    citySearch,
    setCitySearch,
    selectedCity,
    setSelectedCity,
    showCitySuggestions,
    setShowCitySuggestions,
    radius,
    setRadius,
    handleReset,
    handleCategoryChange,
    handleLocationSelect,
    filteredLocations,
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
