import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { searchCommunes, type CommuneSearchResult } from "@/lib/communesApi";

interface CityAutocompleteAPIProps {
  value: string;
  onChange: (value: string, coordinates?: { lat: number; lng: number } | null) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export const CityAutocompleteAPI = ({
  value,
  onChange,
  placeholder = "Rechercher une ville...",
  className,
  required = false,
}: CityAutocompleteAPIProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<CommuneSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
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
      }, 300);
    } else {
      setIsOpen(false);
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  const handleSelect = (suggestion: CommuneSearchResult) => {
    const displayValue = `${suggestion.nom} (${suggestion.codeDepartement})`;
    setInputValue(displayValue);
    
    const coordinates = suggestion.latitude && suggestion.longitude
      ? { lat: suggestion.latitude, lng: suggestion.longitude }
      : null;
    
    onChange(displayValue, coordinates);
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
          onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-9 pr-8"
          required={required}
          autoComplete="off"
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
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-[250px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.code}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-sm transition-colors text-left",
                highlightedIndex === index
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
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
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Recherche en cours...</span>
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            Aucune ville trouvée pour "{inputValue}"
          </p>
        </div>
      )}
    </div>
  );
};

export default CityAutocompleteAPI;
