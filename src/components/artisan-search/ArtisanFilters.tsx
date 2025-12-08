import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RotateCcw, MapPin, CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { filterLocations } from "@/data/frenchLocations";
import { CategorySelect } from "@/components/categories/CategorySelect";

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
];

interface ArtisanFiltersProps {
  onFiltersChange: (filters: {
    category: string;
    categoryName: string;
    city: string;
    interventionDate: Date | undefined;
    interventionTime: string;
  }) => void;
}

const ArtisanFilters = ({ onFiltersChange }: ArtisanFiltersProps) => {
  const [category, setCategory] = useState<string>("");
  const [categoryName, setCategoryName] = useState<string>("");
  const [citySearch, setCitySearch] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [interventionDate, setInterventionDate] = useState<Date | undefined>(undefined);
  const [interventionTime, setInterventionTime] = useState<string>("");

  const filteredLocations = citySearch ? filterLocations(citySearch).slice(0, 15) : [];

  // Call onFiltersChange immediately when any filter changes
  const notifyFiltersChange = () => {
    onFiltersChange({ category, categoryName, city: selectedCity, interventionDate, interventionTime });
  };

  useEffect(() => {
    notifyFiltersChange();
  }, [category, categoryName, selectedCity, interventionDate, interventionTime]);

  const handleReset = () => {
    setCategory("");
    setCategoryName("");
    setCitySearch("");
    setSelectedCity("");
    setInterventionDate(undefined);
    setInterventionTime("");
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

      {/* Catégorie */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-navy mb-3 block">
          Catégorie
        </Label>
        <CategorySelect
          value={category}
          onValueChange={handleCategoryChange}
          placeholder="Toutes les catégories"
        />
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
          {showCitySuggestions && citySearch && filteredLocations.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredLocations.map((loc) => (
                <button
                  key={loc.value}
                  type="button"
                  onClick={() => handleLocationSelect(loc)}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors text-sm flex items-center gap-2"
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

      {/* Date d'intervention */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-navy mb-3 block">
          Date d'intervention
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !interventionDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {interventionDate ? format(interventionDate, "PPP", { locale: fr }) : "Sélectionner une date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-white z-50" align="start">
            <Calendar
              mode="single"
              selected={interventionDate}
              onSelect={setInterventionDate}
              initialFocus
              locale={fr}
              disabled={(date) => date < new Date()}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Heure d'intervention */}
      <div className="mb-6">
        <Label className="text-sm font-medium text-navy mb-3 block">
          Heure d'intervention
        </Label>
        <Select value={interventionTime} onValueChange={setInterventionTime}>
          <SelectTrigger className="w-full">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Sélectionner une heure" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            <SelectItem value="any">Toute heure</SelectItem>
            {timeSlots.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ArtisanFilters;
