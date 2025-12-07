import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RotateCcw, MapPin } from "lucide-react";

const categories = [
  "Plombier",
  "Électricien",
  "Chauffagiste",
  "Peintre",
  "Serrurier",
  "Maçon",
  "Menuisier",
  "Carreleur",
];

const frenchCities = [
  { name: "Paris", code: "75" },
  { name: "Marseille", code: "13" },
  { name: "Lyon", code: "69" },
  { name: "Toulouse", code: "31" },
  { name: "Nice", code: "06" },
  { name: "Nantes", code: "44" },
  { name: "Montpellier", code: "34" },
  { name: "Strasbourg", code: "67" },
  { name: "Bordeaux", code: "33" },
  { name: "Lille", code: "59" },
  { name: "Rennes", code: "35" },
  { name: "Reims", code: "51" },
  { name: "Saint-Étienne", code: "42" },
  { name: "Toulon", code: "83" },
  { name: "Le Havre", code: "76" },
  { name: "Grenoble", code: "38" },
  { name: "Dijon", code: "21" },
  { name: "Angers", code: "49" },
  { name: "Nîmes", code: "30" },
  { name: "Clermont-Ferrand", code: "63" },
];

interface ArtisanFiltersProps {
  onFiltersChange: (filters: {
    budget: number[];
    category: string;
    city: string;
  }) => void;
}

const ArtisanFilters = ({ onFiltersChange }: ArtisanFiltersProps) => {
  const [budget, setBudget] = useState<number[]>([0, 50000]);
  const [category, setCategory] = useState<string>("");
  const [citySearch, setCitySearch] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const filteredCities = frenchCities.filter(
    (city) =>
      city.name.toLowerCase().includes(citySearch.toLowerCase()) ||
      city.code.includes(citySearch)
  );

  useEffect(() => {
    onFiltersChange({ budget, category, city: selectedCity });
  }, [budget, category, selectedCity, onFiltersChange]);

  const handleReset = () => {
    setBudget([0, 50000]);
    setCategory("");
    setCitySearch("");
    setSelectedCity("");
  };

  const handleCitySelect = (city: { name: string; code: string }) => {
    setSelectedCity(`${city.name} (${city.code})`);
    setCitySearch(`${city.name} (${city.code})`);
    setShowCitySuggestions(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-border sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-navy">Filtrer par</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-muted-foreground hover:text-navy"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Réinitialiser
        </Button>
      </div>

      {/* Budget */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-navy mb-3 block">
          Budget
        </Label>
        <div className="px-2">
          <Slider
            value={budget}
            onValueChange={setBudget}
            min={0}
            max={50000}
            step={100}
            className="mb-3"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{budget[0].toLocaleString("fr-FR")} €</span>
            <span>{budget[1].toLocaleString("fr-FR")} €</span>
          </div>
        </div>
      </div>

      {/* Catégorie */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-navy mb-3 block">
          Catégorie
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="all">Toutes les catégories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat.toLowerCase()}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            onChange={(e) => {
              setCitySearch(e.target.value);
              setShowCitySuggestions(true);
              if (e.target.value === "") {
                setSelectedCity("");
              }
            }}
            onFocus={() => setShowCitySuggestions(true)}
            onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
            className="pl-10"
          />
          {showCitySuggestions && citySearch && filteredCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredCities.map((city) => (
                <button
                  key={city.name}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm"
                >
                  {city.name}{" "}
                  <span className="text-muted-foreground">({city.code})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtisanFilters;
