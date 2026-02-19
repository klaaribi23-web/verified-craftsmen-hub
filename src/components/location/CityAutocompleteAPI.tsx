import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { searchCommunes, type CommuneSearchResult } from "@/lib/communesApi";

interface CityAutocompleteAPIProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number } | null, postalCode?: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export const CityAutocompleteAPI = ({
  value,
  onChange,
  placeholder = "Rechercher une ville...",
  className,
  required = false,
  disabled = false,
}: CityAutocompleteAPIProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<CommuneSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const hasJustSelectedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const searchCities = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchCommunes(query, 10);
      setSuggestions(results);
    } catch (error) {
      console.error("Search error:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setHighlightedIndex(-1);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (newValue.length >= 2) {
      setIsOpen(true);
      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        searchCities(newValue);
      }, 150);
    } else {
      setIsOpen(false);
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleSelect = (suggestion: CommuneSearchResult) => {
    hasJustSelectedRef.current = true;
    const displayValue = `${suggestion.nom} (${suggestion.codeDepartement})`;
    setInputValue(displayValue);
    
    const coordinates = suggestion.latitude && suggestion.longitude
      ? { lat: suggestion.latitude, lng: suggestion.longitude }
      : null;
    
    onChange(displayValue, coordinates, suggestion.codePostal);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSuggestions([]);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("", null);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Petit délai pour permettre le clic sur une suggestion
    setTimeout(() => {
      // Ne pas interférer si une sélection vient d'être faite
      if (hasJustSelectedRef.current) {
        hasJustSelectedRef.current = false;
        return;
      }
      if (inputValue && inputValue !== value) {
        onChange(inputValue, null);
      }
    }, 200);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => !disabled && inputValue.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn("pl-9 pr-8", disabled && "bg-muted cursor-not-allowed")}
          required={required}
          autoComplete="off"
          disabled={disabled}
        />
        {isLoading ? (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        ) : inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[#D4AF37]/20 shadow-lg max-h-[250px] overflow-y-auto" style={{ backgroundColor: '#112240' }}>
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.code}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors text-left font-['DM_Sans']",
                highlightedIndex === index
                  ? "text-[#0A192F]"
                  : "text-white hover:text-[#0A192F]"
              )}
              style={highlightedIndex === index ? { backgroundColor: '#D4AF37' } : undefined}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '#D4AF37'; (e.currentTarget as HTMLElement).style.color = '#0A192F'; }}
              onMouseLeave={(e) => { if (highlightedIndex !== index) { (e.currentTarget as HTMLElement).style.backgroundColor = ''; (e.currentTarget as HTMLElement).style.color = ''; } }}
            >
              <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">{suggestion.nom}</span>
                <span className="text-xs text-muted-foreground truncate">
                  {suggestion.codePostal} - {suggestion.nomDepartement}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isOpen && isLoading && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[#D4AF37]/20 shadow-lg p-3" style={{ backgroundColor: '#112240' }}>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Recherche en cours...</span>
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-[#D4AF37]/20 shadow-lg p-3" style={{ backgroundColor: '#112240' }}>
          <p className="text-sm text-muted-foreground text-center">
            Aucune ville trouvée pour "{inputValue}"
          </p>
        </div>
      )}
    </div>
  );
};

export default CityAutocompleteAPI;
