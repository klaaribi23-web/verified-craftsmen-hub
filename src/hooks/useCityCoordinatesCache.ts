import { useState, useEffect, useCallback } from "react";
import { getCityCoordinates, getCityCoordinatesAsync } from "@/lib/geoDistance";

// Global cache for city coordinates (persists across component remounts)
const globalCoordinatesCache = new Map<string, { lat: number; lng: number } | null>();

/**
 * Hook to manage city coordinates with async loading
 * Returns a function to get coordinates and tracks loading state
 */
export function useCityCoordinatesCache(cities: string[]) {
  const [loadedCities, setLoadedCities] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Load coordinates for cities that aren't in cache
  useEffect(() => {
    const citiesToLoad = cities.filter(city => {
      if (!city) return false;
      const cleanCity = city.split("(")[0].trim();
      return !globalCoordinatesCache.has(cleanCity) && !loadedCities.has(cleanCity);
    });

    if (citiesToLoad.length === 0) return;

    setIsLoading(true);

    const loadCoordinates = async () => {
      const newLoaded = new Set(loadedCities);
      
      await Promise.all(
        citiesToLoad.map(async (city) => {
          const cleanCity = city.split("(")[0].trim();
          if (globalCoordinatesCache.has(cleanCity)) return;
          
          // First try local cache (sync)
          const localCoords = getCityCoordinates(cleanCity);
          if (localCoords) {
            globalCoordinatesCache.set(cleanCity, localCoords);
            newLoaded.add(cleanCity);
            return;
          }
          
          // Then try API (async)
          try {
            const apiCoords = await getCityCoordinatesAsync(cleanCity);
            globalCoordinatesCache.set(cleanCity, apiCoords);
            newLoaded.add(cleanCity);
          } catch (error) {
            console.error(`Failed to load coordinates for ${cleanCity}:`, error);
            globalCoordinatesCache.set(cleanCity, null);
            newLoaded.add(cleanCity);
          }
        })
      );

      setLoadedCities(newLoaded);
      setIsLoading(false);
    };

    loadCoordinates();
  }, [cities, loadedCities]);

  // Function to get coordinates from cache
  const getCoordinates = useCallback((cityName: string): { lat: number; lng: number } | null => {
    if (!cityName) return null;
    const cleanCity = cityName.split("(")[0].trim();
    
    // Check global cache
    if (globalCoordinatesCache.has(cleanCity)) {
      return globalCoordinatesCache.get(cleanCity) || null;
    }
    
    // Try sync local cache as fallback
    const localCoords = getCityCoordinates(cleanCity);
    if (localCoords) {
      globalCoordinatesCache.set(cleanCity, localCoords);
      return localCoords;
    }
    
    return null;
  }, []);

  return { getCoordinates, isLoading };
}
