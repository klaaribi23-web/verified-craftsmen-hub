import { getCommuneCoordinates } from "./communesApi";

// City coordinates for distance calculation (fallback data)
// Coordinates for major French cities (latitude, longitude)
export const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  "Paris": { lat: 48.8566, lng: 2.3522 },
  "Marseille": { lat: 43.2965, lng: 5.3698 },
  "Lyon": { lat: 45.7640, lng: 4.8357 },
  "Toulouse": { lat: 43.6047, lng: 1.4442 },
  "Nice": { lat: 43.7102, lng: 7.2620 },
  "Nantes": { lat: 47.2184, lng: -1.5536 },
  "Montpellier": { lat: 43.6108, lng: 3.8767 },
  "Strasbourg": { lat: 48.5734, lng: 7.7521 },
  "Bordeaux": { lat: 44.8378, lng: -0.5792 },
  "Lille": { lat: 50.6292, lng: 3.0573 },
  "Rennes": { lat: 48.1173, lng: -1.6778 },
  "Reims": { lat: 49.2583, lng: 4.0317 },
  "Saint-Étienne": { lat: 45.4397, lng: 4.3872 },
  "Le Havre": { lat: 49.4944, lng: 0.1079 },
  "Toulon": { lat: 43.1242, lng: 5.9280 },
  "Grenoble": { lat: 45.1885, lng: 5.7245 },
  "Dijon": { lat: 47.3220, lng: 5.0415 },
  "Angers": { lat: 47.4784, lng: -0.5632 },
  "Nîmes": { lat: 43.8367, lng: 4.3601 },
  "Clermont-Ferrand": { lat: 45.7772, lng: 3.0870 },
  "Aix-en-Provence": { lat: 43.5297, lng: 5.4474 },
  "Brest": { lat: 48.3904, lng: -4.4861 },
  "Tours": { lat: 47.3941, lng: 0.6848 },
  "Amiens": { lat: 49.8942, lng: 2.2957 },
  "Limoges": { lat: 45.8336, lng: 1.2611 },
  "Perpignan": { lat: 42.6887, lng: 2.8948 },
  "Metz": { lat: 49.1193, lng: 6.1757 },
  "Besançon": { lat: 47.2378, lng: 6.0241 },
  "Orléans": { lat: 47.9029, lng: 1.9093 },
  "Rouen": { lat: 49.4432, lng: 1.0999 },
  "Caen": { lat: 49.1829, lng: -0.3707 },
  "Nancy": { lat: 48.6921, lng: 6.1844 },
  "Avignon": { lat: 43.9493, lng: 4.8055 },
  "Poitiers": { lat: 46.5802, lng: 0.3404 },
  "Pau": { lat: 43.2951, lng: -0.3708 },
  "La Rochelle": { lat: 46.1603, lng: -1.1511 },
  "Calais": { lat: 50.9513, lng: 1.8587 },
  "Annecy": { lat: 45.8992, lng: 6.1294 },
  "Bayonne": { lat: 43.4929, lng: -1.4748 },
  "Valence": { lat: 44.9334, lng: 4.8924 },
  "Chambéry": { lat: 45.5646, lng: 5.9178 },
  "Chartres": { lat: 48.4530, lng: 1.4837 },
  "Bourges": { lat: 47.0811, lng: 2.3988 },
  "Troyes": { lat: 48.2973, lng: 4.0744 },
  "Blois": { lat: 47.5861, lng: 1.3359 },
  "Quimper": { lat: 48.0000, lng: -4.1000 },
  "Vannes": { lat: 47.6587, lng: -2.7600 },
  "Lorient": { lat: 47.7486, lng: -3.3670 },
  "Saint-Brieuc": { lat: 48.5141, lng: -2.7600 },
  "Saint-Malo": { lat: 48.6493, lng: -2.0007 },
  "Niort": { lat: 46.3259, lng: -0.4573 },
  "Angoulême": { lat: 45.6484, lng: 0.1561 },
  "Périgueux": { lat: 45.1833, lng: 0.7167 },
  "Agen": { lat: 44.2033, lng: 0.6167 },
  "Tarbes": { lat: 43.2328, lng: 0.0783 },
  "Albi": { lat: 43.9291, lng: 2.1481 },
  "Carcassonne": { lat: 43.2117, lng: 2.3500 },
  "Béziers": { lat: 43.3440, lng: 3.2159 },
  "Sète": { lat: 43.4028, lng: 3.6961 },
};

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate the distance between two points using the Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get coordinates for a city name from local cache
 */
export function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  if (!cityName) return null;

  // Clean the city name (remove department code if present)
  const cleanedName = cityName.split("(")[0].trim();

  // Try exact match first
  if (cityCoordinates[cleanedName]) {
    return cityCoordinates[cleanedName];
  }

  // Try case-insensitive match
  const lowerName = cleanedName.toLowerCase();
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (city.toLowerCase() === lowerName) {
      return coords;
    }
  }

  // Try partial match
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (
      city.toLowerCase().includes(lowerName) ||
      lowerName.includes(city.toLowerCase())
    ) {
      return coords;
    }
  }

  return null;
}

/**
 * Get coordinates for a city name using the API (async version)
 * Falls back to local cache if API fails
 */
export async function getCityCoordinatesAsync(
  cityName: string
): Promise<{ lat: number; lng: number } | null> {
  if (!cityName) return null;

  // First try local cache for speed
  const localCoords = getCityCoordinates(cityName);
  if (localCoords) return localCoords;

  // Then try API for complete coverage
  try {
    const apiCoords = await getCommuneCoordinates(cityName);
    if (apiCoords) return apiCoords;
  } catch (error) {
    console.error("Error fetching coordinates from API:", error);
  }

  return null;
}

/**
 * Get coordinates from artisan data (if stored)
 * This is the preferred method when artisan has lat/lng stored
 */
export function getArtisanCoordinates(artisan: {
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
}): { lat: number; lng: number } | null {
  // First try stored coordinates
  if (artisan.latitude && artisan.longitude) {
    return { lat: artisan.latitude, lng: artisan.longitude };
  }

  // Fallback to city lookup
  if (artisan.city) {
    return getCityCoordinates(artisan.city);
  }

  return null;
}

/**
 * Check if an artisan is within the specified radius of a city
 */
export function isWithinRadius(
  artisanCity: string,
  searchCity: string,
  radiusKm: number
): boolean {
  if (radiusKm === 0) return true;

  const searchCoords = getCityCoordinates(searchCity);
  const artisanCoords = getCityCoordinates(artisanCity);

  if (!searchCoords || !artisanCoords) {
    return artisanCity.toLowerCase().includes(searchCity.toLowerCase());
  }

  const distance = calculateDistance(
    searchCoords.lat,
    searchCoords.lng,
    artisanCoords.lat,
    artisanCoords.lng
  );

  return distance <= radiusKm;
}

/**
 * Check if an artisan is within radius using stored coordinates
 */
export function isWithinRadiusWithCoords(
  artisanLat: number | null,
  artisanLng: number | null,
  artisanCity: string | null,
  searchCity: string,
  radiusKm: number
): boolean {
  if (radiusKm === 0) return true;

  const searchCoords = getCityCoordinates(searchCity);
  if (!searchCoords) return true;

  if (artisanLat && artisanLng) {
    const distance = calculateDistance(
      searchCoords.lat,
      searchCoords.lng,
      artisanLat,
      artisanLng
    );
    return distance <= radiusKm;
  }

  if (artisanCity) {
    return isWithinRadius(artisanCity, searchCity, radiusKm);
  }

  return true;
}

/**
 * Calculate distance between artisan and search location
 */
export function getDistanceToArtisan(
  artisanLat: number | null,
  artisanLng: number | null,
  artisanCity: string | null,
  searchCity: string
): number | null {
  const searchCoords = getCityCoordinates(searchCity);
  if (!searchCoords) return null;

  if (artisanLat && artisanLng) {
    return calculateDistance(
      searchCoords.lat,
      searchCoords.lng,
      artisanLat,
      artisanLng
    );
  }

  if (artisanCity) {
    const artisanCoords = getCityCoordinates(artisanCity);
    if (artisanCoords) {
      return calculateDistance(
        searchCoords.lat,
        searchCoords.lng,
        artisanCoords.lat,
        artisanCoords.lng
      );
    }
  }

  return null;
}
