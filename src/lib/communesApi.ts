/**
 * Service API pour les communes françaises
 * Utilise l'API officielle geo.api.gouv.fr
 * Documentation: https://geo.api.gouv.fr/decoupage-administratif/communes
 */

export interface Commune {
  code: string; // Code INSEE
  nom: string;
  codesPostaux: string[];
  codeDepartement: string;
  departement?: {
    code: string;
    nom: string;
  };
  codeRegion: string;
  region?: {
    code: string;
    nom: string;
  };
  centre?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  population?: number;
}

export interface CommuneSearchResult {
  code: string;
  nom: string;
  codePostal: string;
  codeDepartement: string;
  nomDepartement: string;
  latitude: number | null;
  longitude: number | null;
  displayText: string;
}

const API_BASE_URL = "https://geo.api.gouv.fr";

// Cache pour les résultats récents
const searchCache = new Map<string, CommuneSearchResult[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cacheTimestamps = new Map<string, number>();

/**
 * Recherche des communes par nom
 * @param query Texte de recherche (minimum 2 caractères)
 * @param limit Nombre maximum de résultats (défaut: 10)
 */
export async function searchCommunes(
  query: string,
  limit: number = 10
): Promise<CommuneSearchResult[]> {
  if (!query || query.length < 2) return [];

  const cacheKey = `search:${query.toLowerCase()}:${limit}`;
  
  // Vérifier le cache
  const cachedTimestamp = cacheTimestamps.get(cacheKey);
  if (cachedTimestamp && Date.now() - cachedTimestamp < CACHE_TTL) {
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;
  }

  try {
    const params = new URLSearchParams({
      nom: query,
      fields: "nom,code,codesPostaux,codeDepartement,centre",
      boost: "population",
      limit: limit.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/communes?${params}`);
    
    if (!response.ok) {
      console.error("API communes error:", response.status);
      return [];
    }

    const communes: Commune[] = await response.json();
    
    // Récupérer les noms des départements
    const departements = await getDepartements();
    const deptMap = new Map(departements.map(d => [d.code, d.nom]));

    const results: CommuneSearchResult[] = communes.map((commune) => {
      const codePostal = commune.codesPostaux?.[0] || commune.codeDepartement;
      const nomDepartement = deptMap.get(commune.codeDepartement) || commune.codeDepartement;
      
      return {
        code: commune.code,
        nom: commune.nom,
        codePostal,
        codeDepartement: commune.codeDepartement,
        nomDepartement,
        latitude: commune.centre?.coordinates?.[1] || null,
        longitude: commune.centre?.coordinates?.[0] || null,
        displayText: `${commune.nom} (${codePostal})`,
      };
    });

    // Mettre en cache
    searchCache.set(cacheKey, results);
    cacheTimestamps.set(cacheKey, Date.now());

    return results;
  } catch (error) {
    console.error("Erreur API communes:", error);
    return [];
  }
}

/**
 * Récupère une commune par son code INSEE
 */
export async function getCommuneByCode(
  code: string
): Promise<CommuneSearchResult | null> {
  if (!code) return null;

  try {
    const params = new URLSearchParams({
      fields: "nom,code,codesPostaux,codeDepartement,centre",
    });

    const response = await fetch(`${API_BASE_URL}/communes/${code}?${params}`);
    
    if (!response.ok) return null;

    const commune: Commune = await response.json();
    
    const departements = await getDepartements();
    const deptMap = new Map(departements.map(d => [d.code, d.nom]));
    const nomDepartement = deptMap.get(commune.codeDepartement) || commune.codeDepartement;

    return {
      code: commune.code,
      nom: commune.nom,
      codePostal: commune.codesPostaux?.[0] || commune.codeDepartement,
      codeDepartement: commune.codeDepartement,
      nomDepartement,
      latitude: commune.centre?.coordinates?.[1] || null,
      longitude: commune.centre?.coordinates?.[0] || null,
      displayText: `${commune.nom} (${commune.codesPostaux?.[0] || commune.codeDepartement})`,
    };
  } catch (error) {
    console.error("Erreur récupération commune:", error);
    return null;
  }
}

/**
 * Récupère toutes les communes d'un département
 */
export async function getCommunesByDepartement(
  codeDepartement: string
): Promise<CommuneSearchResult[]> {
  if (!codeDepartement) return [];

  const cacheKey = `dept:${codeDepartement}`;
  const cachedTimestamp = cacheTimestamps.get(cacheKey);
  if (cachedTimestamp && Date.now() - cachedTimestamp < CACHE_TTL) {
    const cached = searchCache.get(cacheKey);
    if (cached) return cached;
  }

  try {
    const params = new URLSearchParams({
      fields: "nom,code,codesPostaux,codeDepartement,centre",
    });

    const response = await fetch(
      `${API_BASE_URL}/departements/${codeDepartement}/communes?${params}`
    );
    
    if (!response.ok) return [];

    const communes: Commune[] = await response.json();
    
    const departements = await getDepartements();
    const deptMap = new Map(departements.map(d => [d.code, d.nom]));
    const nomDepartement = deptMap.get(codeDepartement) || codeDepartement;

    const results: CommuneSearchResult[] = communes.map((commune) => {
      const codePostal = commune.codesPostaux?.[0] || commune.codeDepartement;
      
      return {
        code: commune.code,
        nom: commune.nom,
        codePostal,
        codeDepartement: commune.codeDepartement,
        nomDepartement,
        latitude: commune.centre?.coordinates?.[1] || null,
        longitude: commune.centre?.coordinates?.[0] || null,
        displayText: `${commune.nom} (${codePostal})`,
      };
    });

    searchCache.set(cacheKey, results);
    cacheTimestamps.set(cacheKey, Date.now());

    return results;
  } catch (error) {
    console.error("Erreur récupération communes département:", error);
    return [];
  }
}

// Cache pour les départements
let departementsCache: { code: string; nom: string }[] | null = null;

/**
 * Récupère la liste des départements
 */
export async function getDepartements(): Promise<{ code: string; nom: string }[]> {
  if (departementsCache) return departementsCache;

  try {
    const response = await fetch(`${API_BASE_URL}/departements`);
    
    if (!response.ok) {
      // Fallback sur les données statiques
      const { departments } = await import("@/data/frenchLocations");
      return departments.map(d => ({ code: d.code, nom: d.name }));
    }

    departementsCache = await response.json();
    return departementsCache || [];
  } catch {
    // Fallback sur les données statiques
    const { departments } = await import("@/data/frenchLocations");
    return departments.map(d => ({ code: d.code, nom: d.name }));
  }
}

/**
 * Récupère les coordonnées GPS d'une ville par son nom
 * Utile pour le calcul de distance
 */
export async function getCommuneCoordinates(
  cityName: string
): Promise<{ lat: number; lng: number } | null> {
  if (!cityName || cityName.length < 2) return null;

  // Nettoyer le nom (retirer le code postal si présent)
  const cleanedName = cityName.split("(")[0].trim();

  const results = await searchCommunes(cleanedName, 1);
  
  if (results.length > 0 && results[0].latitude && results[0].longitude) {
    return {
      lat: results[0].latitude,
      lng: results[0].longitude,
    };
  }

  return null;
}

/**
 * Nettoie le cache
 */
export function clearCommunesCache(): void {
  searchCache.clear();
  cacheTimestamps.clear();
  departementsCache = null;
}
