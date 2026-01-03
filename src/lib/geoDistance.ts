// City coordinates for distance calculation
// Coordinates for major French cities (latitude, longitude)
export const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  // Major cities
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
  "Villeurbanne": { lat: 45.7676, lng: 4.8810 },
  "Saint-Denis": { lat: 48.9362, lng: 2.3574 },
  "Clermont-Ferrand": { lat: 45.7772, lng: 3.0870 },
  "Le Mans": { lat: 48.0061, lng: 0.1996 },
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
  "Mulhouse": { lat: 47.7508, lng: 7.3359 },
  "Caen": { lat: 49.1829, lng: -0.3707 },
  "Nancy": { lat: 48.6921, lng: 6.1844 },
  "Argenteuil": { lat: 48.9472, lng: 2.2467 },
  "Saint-Paul": { lat: -21.0094, lng: 55.2708 },
  "Montreuil": { lat: 48.8638, lng: 2.4483 },
  "Roubaix": { lat: 50.6942, lng: 3.1746 },
  "Tourcoing": { lat: 50.7240, lng: 3.1612 },
  "Avignon": { lat: 43.9493, lng: 4.8055 },
  "Dunkerque": { lat: 51.0343, lng: 2.3768 },
  "Poitiers": { lat: 46.5802, lng: 0.3404 },
  "Versailles": { lat: 48.8014, lng: 2.1301 },
  "Courbevoie": { lat: 48.8967, lng: 2.2567 },
  "Créteil": { lat: 48.7904, lng: 2.4556 },
  "Pau": { lat: 43.2951, lng: -0.3708 },
  "Colombes": { lat: 48.9226, lng: 2.2526 },
  "Fort-de-France": { lat: 14.6161, lng: -61.0588 },
  "Aulnay-sous-Bois": { lat: 48.9386, lng: 2.4966 },
  "Asnières-sur-Seine": { lat: 48.9147, lng: 2.2853 },
  "Vitry-sur-Seine": { lat: 48.7875, lng: 2.3929 },
  "Rueil-Malmaison": { lat: 48.8769, lng: 2.1894 },
  "Saint-Pierre": { lat: -21.3393, lng: 55.4781 },
  "Béziers": { lat: 43.3440, lng: 3.2159 },
  "La Rochelle": { lat: 46.1603, lng: -1.1511 },
  "Saint-Maur-des-Fossés": { lat: 48.7996, lng: 2.4917 },
  "Calais": { lat: 50.9513, lng: 1.8587 },
  "Champigny-sur-Marne": { lat: 48.8174, lng: 2.5155 },
  "Antibes": { lat: 43.5808, lng: 7.1239 },
  "Cannes": { lat: 43.5528, lng: 7.0174 },
  "Mérignac": { lat: 44.8386, lng: -0.6436 },
  "Drancy": { lat: 48.9304, lng: 2.4507 },
  "Boulogne-Billancourt": { lat: 48.8352, lng: 2.2410 },
  "Nanterre": { lat: 48.8924, lng: 2.2071 },
  "Issy-les-Moulineaux": { lat: 48.8247, lng: 2.2735 },
  "Levallois-Perret": { lat: 48.8936, lng: 2.2877 },
  "Neuilly-sur-Seine": { lat: 48.8849, lng: 2.2690 },
  "Saint-Quentin": { lat: 49.8465, lng: 3.2876 },
  "Valence": { lat: 44.9334, lng: 4.8924 },
  "Colmar": { lat: 48.0794, lng: 7.3589 },
  "Troyes": { lat: 48.2973, lng: 4.0744 },
  "Antony": { lat: 48.7540, lng: 2.2976 },
  "La Seyne-sur-Mer": { lat: 43.1008, lng: 5.8815 },
  "Lorient": { lat: 47.7486, lng: -3.3670 },
  "Sarcelles": { lat: 48.9959, lng: 2.3793 },
  "Chambéry": { lat: 45.5646, lng: 5.9178 },
  "Niort": { lat: 46.3259, lng: -0.4573 },
  "Saint-André": { lat: -20.9626, lng: 55.6552 },
  "Villepinte": { lat: 48.9615, lng: 2.5460 },
  "Épinay-sur-Seine": { lat: 48.9543, lng: 2.3088 },
  "Hyères": { lat: 43.1204, lng: 6.1286 },
  "Saint-Priest": { lat: 45.6969, lng: 4.9414 },
  "Vénissieux": { lat: 45.6971, lng: 4.8861 },
  "Bourges": { lat: 47.0811, lng: 2.3988 },
  "Ivry-sur-Seine": { lat: 48.8120, lng: 2.3875 },
  "Cergy": { lat: 49.0363, lng: 2.0639 },
  "Pessac": { lat: 44.8067, lng: -0.6311 },
  "Évreux": { lat: 49.0240, lng: 1.1508 },
  "Vaulx-en-Velin": { lat: 45.7770, lng: 4.9186 },
  "Clichy": { lat: 48.9022, lng: 2.3058 },
  "Sartrouville": { lat: 48.9391, lng: 2.1588 },
  "Le Blanc-Mesnil": { lat: 48.9386, lng: 2.4613 },
  "Cayenne": { lat: 4.9372, lng: -52.3260 },
  "Maisons-Alfort": { lat: 48.8052, lng: 2.4439 },
  "Cholet": { lat: 47.0609, lng: -0.8789 },
  "Meaux": { lat: 48.9601, lng: 2.8786 },
  "Fontenay-sous-Bois": { lat: 48.8517, lng: 2.4768 },
  "La Roche-sur-Yon": { lat: 46.6706, lng: -1.4269 },
  "Évry-Courcouronnes": { lat: 48.6331, lng: 2.4293 },
  "Clamart": { lat: 48.8005, lng: 2.2660 },
  "Saint-Ouen-sur-Seine": { lat: 48.9117, lng: 2.3342 },
  "Fréjus": { lat: 43.4332, lng: 6.7370 },
  "Laval": { lat: 48.0733, lng: -0.7689 },
  "Vannes": { lat: 47.6587, lng: -2.7600 },
  "Chelles": { lat: 48.8837, lng: 2.5928 },
  "Arles": { lat: 43.6768, lng: 4.6278 },
  "Pantin": { lat: 48.8948, lng: 2.4119 },
  "Bobigny": { lat: 48.9077, lng: 2.4401 },
  "Saint-Brieuc": { lat: 48.5141, lng: -2.7600 },
  "Noisy-le-Grand": { lat: 48.8486, lng: 2.5525 },
  "Bondy": { lat: 48.9022, lng: 2.4883 },
  "Montauban": { lat: 44.0176, lng: 1.3549 },
  "Quimper": { lat: 48.0000, lng: -4.1000 },
  "Le Tampon": { lat: -21.2784, lng: 55.5159 },
  "Corbeil-Essonnes": { lat: 48.6143, lng: 2.4827 },
  "Charleville-Mézières": { lat: 49.7733, lng: 4.7202 },
  "Saint-Martin-d'Hères": { lat: 45.1672, lng: 5.7629 },
  "Albi": { lat: 43.9291, lng: 2.1481 },
  "Salon-de-Provence": { lat: 43.6405, lng: 5.0972 },
  "Massy": { lat: 48.7305, lng: 2.2709 },
  "Bayonne": { lat: 43.4929, lng: -1.4748 },
  "Cagnes-sur-Mer": { lat: 43.6645, lng: 7.1481 },
  "Grasse": { lat: 43.6577, lng: 6.9236 },
  "Bron": { lat: 45.7389, lng: 4.9127 },
  "Vincennes": { lat: 48.8475, lng: 2.4392 },
  "Alfortville": { lat: 48.8054, lng: 2.4211 },
  "Noisy-le-Sec": { lat: 48.8893, lng: 2.4612 },
  "Martigues": { lat: 43.4067, lng: 5.0539 },
  "Suresnes": { lat: 48.8716, lng: 2.2291 },
  "Mantes-la-Jolie": { lat: 48.9906, lng: 1.7169 },
  "Talence": { lat: 44.8014, lng: -0.5853 },
  "Puteaux": { lat: 48.8839, lng: 2.2390 },
  "Brive-la-Gaillarde": { lat: 45.1583, lng: 1.5321 },
  "Blois": { lat: 47.5861, lng: 1.3359 },
  "Saint-Herblain": { lat: 47.2118, lng: -1.6500 },
  "Aubagne": { lat: 43.2928, lng: 5.5705 },
  "Châlons-en-Champagne": { lat: 48.9561, lng: 4.3631 },
  "Chalon-sur-Saône": { lat: 46.7810, lng: 4.8537 },
  "Meudon": { lat: 48.8117, lng: 2.2350 },
  "Saint-Malo": { lat: 48.6493, lng: -2.0007 },
  "Châteauroux": { lat: 46.8103, lng: 1.6914 },
  "Livry-Gargan": { lat: 48.9193, lng: 2.5380 },
  "Belfort": { lat: 47.6400, lng: 6.8636 },
  "Villefranche-sur-Saône": { lat: 45.9850, lng: 4.7195 },
  "Châtenay-Malabry": { lat: 48.7657, lng: 2.2662 },
  "Saint-Louis": { lat: -21.2833, lng: 55.4167 },
  "Angoulême": { lat: 45.6484, lng: 0.1561 },
  "Gap": { lat: 44.5594, lng: 6.0786 },
  "Montluçon": { lat: 46.3400, lng: 2.6033 },
  "Sainte-Geneviève-des-Bois": { lat: 48.6354, lng: 2.3348 },
  "Rosny-sous-Bois": { lat: 48.8667, lng: 2.4833 },
  "Thionville": { lat: 49.3586, lng: 6.1680 },
  "Le Perreux-sur-Marne": { lat: 48.8421, lng: 2.5055 },
  "Garges-lès-Gonesse": { lat: 48.9722, lng: 2.4024 },
  "Gennevilliers": { lat: 48.9327, lng: 2.2955 },
  "Saint-Chamond": { lat: 45.4708, lng: 4.5183 },
  "Stains": { lat: 48.9500, lng: 2.3833 },
  "Colomiers": { lat: 43.6100, lng: 1.3333 },
  "Pontault-Combault": { lat: 48.8000, lng: 2.6167 },
  "Tarbes": { lat: 43.2328, lng: 0.0783 },
  "Castres": { lat: 43.6058, lng: 2.2390 },
  "Franconville": { lat: 48.9872, lng: 2.2300 },
  "Compiègne": { lat: 49.4178, lng: 2.8261 },
  "Savigny-sur-Orge": { lat: 48.6833, lng: 2.3500 },
  "Poissy": { lat: 48.9298, lng: 2.0467 },
  "Joué-lès-Tours": { lat: 47.3517, lng: 0.6667 },
  "Rezé": { lat: 47.1833, lng: -1.5500 },
  "Draguignan": { lat: 43.5369, lng: 6.4647 },
  "Six-Fours-les-Plages": { lat: 43.1017, lng: 5.8200 },
  "Bagnolet": { lat: 48.8667, lng: 2.4167 },
  "Montélimar": { lat: 44.5583, lng: 4.7511 },
  "Wattrelos": { lat: 50.7000, lng: 3.2167 },
  "Le Cannet": { lat: 43.5758, lng: 7.0144 },
  "Villenave-d'Ornon": { lat: 44.7833, lng: -0.5500 },
  "L'Haÿ-les-Roses": { lat: 48.7793, lng: 2.3379 },
  "Échirolles": { lat: 45.1500, lng: 5.7167 },
  "Le Port": { lat: -20.9333, lng: 55.3000 },
  "Conflans-Sainte-Honorine": { lat: 49.0000, lng: 2.1000 },
  "Montigny-le-Bretonneux": { lat: 48.7667, lng: 2.0333 },
  "La Ciotat": { lat: 43.1747, lng: 5.6083 },
  "Chartres": { lat: 48.4530, lng: 1.4837 },
  "La Courneuve": { lat: 48.9283, lng: 2.3961 },
  "Cambrai": { lat: 50.1722, lng: 3.2361 },
  "Saint-Benoît": { lat: -21.0333, lng: 55.7167 },
  "Saint-Germain-en-Laye": { lat: 48.8975, lng: 2.0967 },
  "Thonon-les-Bains": { lat: 46.3700, lng: 6.4800 },
  "Bagneux": { lat: 48.7967, lng: 2.3150 },
  "Douai": { lat: 50.3714, lng: 3.0764 },
  "Saint-Laurent-du-Maroni": { lat: 5.5000, lng: -54.0333 },
  "Annecy": { lat: 45.8992, lng: 6.1294 },
  "Romans-sur-Isère": { lat: 45.0433, lng: 5.0539 },
  "Auxerre": { lat: 47.7986, lng: 3.5672 },
  "Lens": { lat: 50.4333, lng: 2.8333 },
  "Sète": { lat: 43.4028, lng: 3.6961 },
  "Viry-Châtillon": { lat: 48.6692, lng: 2.3858 },
  "Agen": { lat: 44.2033, lng: 0.6167 },
  "Dax": { lat: 43.7100, lng: -1.0500 },
  "Villeneuve-Saint-Georges": { lat: 48.7311, lng: 2.4489 },
  "Montrouge": { lat: 48.8167, lng: 2.3167 },
  "Les Mureaux": { lat: 48.9875, lng: 1.9117 },
  "Haguenau": { lat: 48.8167, lng: 7.7833 },
  "Caluire-et-Cuire": { lat: 45.7953, lng: 4.8461 },
  "Chatou": { lat: 48.8897, lng: 2.1603 },
  "Kourou": { lat: 5.1600, lng: -52.6500 },
  "Pierrefitte-sur-Seine": { lat: 48.9667, lng: 2.3667 },
  "Saint-Médard-en-Jalles": { lat: 44.8969, lng: -0.7181 },
  "Schiltigheim": { lat: 48.6069, lng: 7.7497 },
  "Bourg-en-Bresse": { lat: 46.2056, lng: 5.2283 },
  "Trappes": { lat: 48.7758, lng: 2.0025 },
  "Cachan": { lat: 48.7897, lng: 2.3361 },
  "Plaisir": { lat: 48.8167, lng: 1.9500 },
  "Villejuif": { lat: 48.7917, lng: 2.3639 },
  "Neuilly-sur-Marne": { lat: 48.8542, lng: 2.5417 },
  "Périgueux": { lat: 45.1833, lng: 0.7167 },
  "Épinal": { lat: 48.1722, lng: 6.4500 },
  "La Possession": { lat: -20.9333, lng: 55.3333 },
  "Rillieux-la-Pape": { lat: 45.8167, lng: 4.9000 },
  "Yerres": { lat: 48.7197, lng: 2.4897 },
  "Savigny-le-Temple": { lat: 48.5833, lng: 2.5833 },
  "Sainte-Anne": { lat: 16.2333, lng: -61.3667 },
  "Athis-Mons": { lat: 48.7086, lng: 2.3928 },
  "Mâcon": { lat: 46.3069, lng: 4.8283 },
  "Roanne": { lat: 46.0333, lng: 4.0667 },
  "Palaiseau": { lat: 48.7147, lng: 2.2497 },
  "Houilles": { lat: 48.9264, lng: 2.1889 },
  "Vigneux-sur-Seine": { lat: 48.7036, lng: 2.4178 },
  "Sotteville-lès-Rouen": { lat: 49.4097, lng: 1.0903 },
  "Le Plessis-Robinson": { lat: 48.7850, lng: 2.2650 },
  "Châtillon": { lat: 48.8031, lng: 2.2906 },
  "Dammarie-les-Lys": { lat: 48.5167, lng: 2.6500 },
  "Nogent-sur-Marne": { lat: 48.8369, lng: 2.4836 },
  "Mont-de-Marsan": { lat: 43.8944, lng: -0.4972 },
  "Sainte-Marie": { lat: -20.9167, lng: 55.5333 },
  "Saint-Leu": { lat: -21.1833, lng: 55.2833 },
  "Dieppe": { lat: 49.9250, lng: 1.0750 },
  "Goussainville": { lat: 49.0333, lng: 2.4667 },
  "Ris-Orangis": { lat: 48.6500, lng: 2.4167 },
  "Brunoy": { lat: 48.6986, lng: 2.5039 },
  "Saint-Raphaël": { lat: 43.4253, lng: 6.7686 },
  "Draveil": { lat: 48.6842, lng: 2.4117 },
  "Cherbourg-en-Cotentin": { lat: 49.6333, lng: -1.6167 },
  "Carcassonne": { lat: 43.2117, lng: 2.3500 },
  "Le Chesnay-Rocquencourt": { lat: 48.8239, lng: 2.1339 },
  "Vitrolles": { lat: 43.4600, lng: 5.2506 },
  "Thiais": { lat: 48.7650, lng: 2.3939 },
  "Montbéliard": { lat: 47.5100, lng: 6.7967 },
  "Vichy": { lat: 46.1283, lng: 3.4256 },
  "Istres": { lat: 43.5128, lng: 4.9872 },
  "Saint-Dizier": { lat: 48.6383, lng: 4.9497 },
  "Matoury": { lat: 4.8500, lng: -52.3333 },
  "Les Abymes": { lat: 16.2667, lng: -61.5000 },
  "Baie-Mahault": { lat: 16.2500, lng: -61.5833 },
  "Le Moule": { lat: 16.3333, lng: -61.3500 },
  "Petit-Bourg": { lat: 16.1833, lng: -61.5833 },
};

/**
 * Calculate the distance between two points using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
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

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Get coordinates for a city name
 * Tries exact match first, then partial match
 */
export function getCityCoordinates(cityName: string): { lat: number; lng: number } | null {
  if (!cityName) return null;

  // Clean the city name (remove department code if present, e.g., "Bordeaux (33)" -> "Bordeaux")
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

  // Try partial match (for accented variations)
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
 * Check if an artisan is within the specified radius of a city
 */
export function isWithinRadius(
  artisanCity: string,
  searchCity: string,
  radiusKm: number
): boolean {
  if (radiusKm === 0) {
    // No radius filter, just check exact city match
    return true;
  }

  const searchCoords = getCityCoordinates(searchCity);
  const artisanCoords = getCityCoordinates(artisanCity);

  if (!searchCoords || !artisanCoords) {
    // If we can't find coordinates, fall back to name matching
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
