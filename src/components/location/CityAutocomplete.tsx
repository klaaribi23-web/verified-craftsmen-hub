import { useState, useRef, useEffect, useMemo } from "react";
import { MapPin, X } from "lucide-react";
import { cities, departments } from "@/data/frenchLocations";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CityAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

interface CitySuggestion {
  name: string;
  department: string;
  departmentName: string;
  displayText: string;
}

export const CityAutocomplete = ({
  value,
  onChange,
  placeholder = "Rechercher une ville...",
  className,
  required = false,
}: CityAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build department lookup map
  const departmentMap = useMemo(() => {
    const map: Record<string, string> = {};
    departments.forEach(d => {
      map[d.code] = d.name;
    });
    return map;
  }, []);

  // Filter cities based on input
  const suggestions = useMemo((): CitySuggestion[] => {
    if (!inputValue || inputValue.length < 2) return [];

    const searchTerm = inputValue.toLowerCase().trim();
    const results: CitySuggestion[] = [];

    for (const city of cities) {
      if (results.length >= 10) break;

      const cityLower = city.name.toLowerCase();
      const departmentName = departmentMap[city.department] || city.department;

      // Match by city name or department code
      if (
        cityLower.startsWith(searchTerm) ||
        cityLower.includes(searchTerm) ||
        city.department.startsWith(searchTerm)
      ) {
        results.push({
          name: city.name,
          department: city.department,
          departmentName,
          displayText: `${city.name} (${city.department})`,
        });
      }
    }

    // Sort: exact matches first, then startsWith, then includes
    return results.sort((a, b) => {
      const aLower = a.name.toLowerCase();
      const bLower = b.name.toLowerCase();

      // Exact match
      if (aLower === searchTerm) return -1;
      if (bLower === searchTerm) return 1;

      // Starts with
      const aStarts = aLower.startsWith(searchTerm);
      const bStarts = bLower.startsWith(searchTerm);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [inputValue, departmentMap]);

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

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(newValue.length >= 2);
    setHighlightedIndex(-1);
    // Don't call onChange here - wait for selection
  };

  const handleSelect = (suggestion: CitySuggestion) => {
    setInputValue(suggestion.displayText);
    onChange(suggestion.displayText);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClear = () => {
    setInputValue("");
    onChange("");
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
    // If user typed something but didn't select, keep the typed value
    if (inputValue && inputValue !== value) {
      onChange(inputValue);
    }
  };

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
          onFocus={() => inputValue.length >= 2 && setIsOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="pl-9 pr-8"
          required={required}
          autoComplete="off"
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg max-h-[250px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.name}-${suggestion.department}`}
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
              <div className="flex flex-col">
                <span className="font-medium">{suggestion.name}</span>
                <span className="text-xs text-muted-foreground">
                  {suggestion.departmentName} ({suggestion.department})
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && inputValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg p-3">
          <p className="text-sm text-muted-foreground text-center">
            Aucune ville trouvée pour "{inputValue}"
          </p>
        </div>
      )}
    </div>
  );
};

export default CityAutocomplete;
