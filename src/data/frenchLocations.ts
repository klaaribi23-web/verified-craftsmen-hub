// Régions de France
export const regions = [
  { id: "idf", name: "Île-de-France" },
  { id: "ara", name: "Auvergne-Rhône-Alpes" },
  { id: "naq", name: "Nouvelle-Aquitaine" },
  { id: "occ", name: "Occitanie" },
  { id: "hdf", name: "Hauts-de-France" },
  { id: "paca", name: "Provence-Alpes-Côte d'Azur" },
  { id: "ges", name: "Grand Est" },
  { id: "pdl", name: "Pays de la Loire" },
  { id: "bre", name: "Bretagne" },
  { id: "nor", name: "Normandie" },
  { id: "bfc", name: "Bourgogne-Franche-Comté" },
  { id: "cvl", name: "Centre-Val de Loire" },
  { id: "cor", name: "Corse" },
];

// Départements de France
export const departments = [
  // Île-de-France
  { code: "75", name: "Paris", region: "idf" },
  { code: "77", name: "Seine-et-Marne", region: "idf" },
  { code: "78", name: "Yvelines", region: "idf" },
  { code: "91", name: "Essonne", region: "idf" },
  { code: "92", name: "Hauts-de-Seine", region: "idf" },
  { code: "93", name: "Seine-Saint-Denis", region: "idf" },
  { code: "94", name: "Val-de-Marne", region: "idf" },
  { code: "95", name: "Val-d'Oise", region: "idf" },
  
  // Auvergne-Rhône-Alpes
  { code: "01", name: "Ain", region: "ara" },
  { code: "03", name: "Allier", region: "ara" },
  { code: "07", name: "Ardèche", region: "ara" },
  { code: "15", name: "Cantal", region: "ara" },
  { code: "26", name: "Drôme", region: "ara" },
  { code: "38", name: "Isère", region: "ara" },
  { code: "42", name: "Loire", region: "ara" },
  { code: "43", name: "Haute-Loire", region: "ara" },
  { code: "63", name: "Puy-de-Dôme", region: "ara" },
  { code: "69", name: "Rhône", region: "ara" },
  { code: "73", name: "Savoie", region: "ara" },
  { code: "74", name: "Haute-Savoie", region: "ara" },
  
  // Nouvelle-Aquitaine
  { code: "16", name: "Charente", region: "naq" },
  { code: "17", name: "Charente-Maritime", region: "naq" },
  { code: "19", name: "Corrèze", region: "naq" },
  { code: "23", name: "Creuse", region: "naq" },
  { code: "24", name: "Dordogne", region: "naq" },
  { code: "33", name: "Gironde", region: "naq" },
  { code: "40", name: "Landes", region: "naq" },
  { code: "47", name: "Lot-et-Garonne", region: "naq" },
  { code: "64", name: "Pyrénées-Atlantiques", region: "naq" },
  { code: "79", name: "Deux-Sèvres", region: "naq" },
  { code: "86", name: "Vienne", region: "naq" },
  { code: "87", name: "Haute-Vienne", region: "naq" },
  
  // Occitanie
  { code: "09", name: "Ariège", region: "occ" },
  { code: "11", name: "Aude", region: "occ" },
  { code: "12", name: "Aveyron", region: "occ" },
  { code: "30", name: "Gard", region: "occ" },
  { code: "31", name: "Haute-Garonne", region: "occ" },
  { code: "32", name: "Gers", region: "occ" },
  { code: "34", name: "Hérault", region: "occ" },
  { code: "46", name: "Lot", region: "occ" },
  { code: "48", name: "Lozère", region: "occ" },
  { code: "65", name: "Hautes-Pyrénées", region: "occ" },
  { code: "66", name: "Pyrénées-Orientales", region: "occ" },
  { code: "81", name: "Tarn", region: "occ" },
  { code: "82", name: "Tarn-et-Garonne", region: "occ" },
  
  // Hauts-de-France
  { code: "02", name: "Aisne", region: "hdf" },
  { code: "59", name: "Nord", region: "hdf" },
  { code: "60", name: "Oise", region: "hdf" },
  { code: "62", name: "Pas-de-Calais", region: "hdf" },
  { code: "80", name: "Somme", region: "hdf" },
  
  // PACA
  { code: "04", name: "Alpes-de-Haute-Provence", region: "paca" },
  { code: "05", name: "Hautes-Alpes", region: "paca" },
  { code: "06", name: "Alpes-Maritimes", region: "paca" },
  { code: "13", name: "Bouches-du-Rhône", region: "paca" },
  { code: "83", name: "Var", region: "paca" },
  { code: "84", name: "Vaucluse", region: "paca" },
  
  // Grand Est
  { code: "08", name: "Ardennes", region: "ges" },
  { code: "10", name: "Aube", region: "ges" },
  { code: "51", name: "Marne", region: "ges" },
  { code: "52", name: "Haute-Marne", region: "ges" },
  { code: "54", name: "Meurthe-et-Moselle", region: "ges" },
  { code: "55", name: "Meuse", region: "ges" },
  { code: "57", name: "Moselle", region: "ges" },
  { code: "67", name: "Bas-Rhin", region: "ges" },
  { code: "68", name: "Haut-Rhin", region: "ges" },
  { code: "88", name: "Vosges", region: "ges" },
  
  // Pays de la Loire
  { code: "44", name: "Loire-Atlantique", region: "pdl" },
  { code: "49", name: "Maine-et-Loire", region: "pdl" },
  { code: "53", name: "Mayenne", region: "pdl" },
  { code: "72", name: "Sarthe", region: "pdl" },
  { code: "85", name: "Vendée", region: "pdl" },
  
  // Bretagne
  { code: "22", name: "Côtes-d'Armor", region: "bre" },
  { code: "29", name: "Finistère", region: "bre" },
  { code: "35", name: "Ille-et-Vilaine", region: "bre" },
  { code: "56", name: "Morbihan", region: "bre" },
  
  // Normandie
  { code: "14", name: "Calvados", region: "nor" },
  { code: "27", name: "Eure", region: "nor" },
  { code: "50", name: "Manche", region: "nor" },
  { code: "61", name: "Orne", region: "nor" },
  { code: "76", name: "Seine-Maritime", region: "nor" },
  
  // Bourgogne-Franche-Comté
  { code: "21", name: "Côte-d'Or", region: "bfc" },
  { code: "25", name: "Doubs", region: "bfc" },
  { code: "39", name: "Jura", region: "bfc" },
  { code: "58", name: "Nièvre", region: "bfc" },
  { code: "70", name: "Haute-Saône", region: "bfc" },
  { code: "71", name: "Saône-et-Loire", region: "bfc" },
  { code: "89", name: "Yonne", region: "bfc" },
  { code: "90", name: "Territoire de Belfort", region: "bfc" },
  
  // Centre-Val de Loire
  { code: "18", name: "Cher", region: "cvl" },
  { code: "28", name: "Eure-et-Loir", region: "cvl" },
  { code: "36", name: "Indre", region: "cvl" },
  { code: "37", name: "Indre-et-Loire", region: "cvl" },
  { code: "41", name: "Loir-et-Cher", region: "cvl" },
  { code: "45", name: "Loiret", region: "cvl" },
  
  // Corse
  { code: "2A", name: "Corse-du-Sud", region: "cor" },
  { code: "2B", name: "Haute-Corse", region: "cor" },
];

// Villes principales par département
export const cities = [
  // Paris et Île-de-France
  { name: "Paris", department: "75" },
  { name: "Boulogne-Billancourt", department: "92" },
  { name: "Nanterre", department: "92" },
  { name: "Courbevoie", department: "92" },
  { name: "Versailles", department: "78" },
  { name: "Saint-Germain-en-Laye", department: "78" },
  { name: "Évry-Courcouronnes", department: "91" },
  { name: "Corbeil-Essonnes", department: "91" },
  { name: "Meaux", department: "77" },
  { name: "Melun", department: "77" },
  { name: "Bobigny", department: "93" },
  { name: "Saint-Denis", department: "93" },
  { name: "Montreuil", department: "93" },
  { name: "Aubervilliers", department: "93" },
  { name: "Créteil", department: "94" },
  { name: "Vitry-sur-Seine", department: "94" },
  { name: "Champigny-sur-Marne", department: "94" },
  { name: "Cergy", department: "95" },
  { name: "Argenteuil", department: "95" },
  
  // Auvergne-Rhône-Alpes
  { name: "Lyon", department: "69" },
  { name: "Villeurbanne", department: "69" },
  { name: "Vénissieux", department: "69" },
  { name: "Saint-Étienne", department: "42" },
  { name: "Grenoble", department: "38" },
  { name: "Annecy", department: "74" },
  { name: "Chambéry", department: "73" },
  { name: "Clermont-Ferrand", department: "63" },
  { name: "Valence", department: "26" },
  { name: "Bourg-en-Bresse", department: "01" },
  
  // Nouvelle-Aquitaine
  { name: "Bordeaux", department: "33" },
  { name: "Mérignac", department: "33" },
  { name: "Pessac", department: "33" },
  { name: "Limoges", department: "87" },
  { name: "Poitiers", department: "86" },
  { name: "La Rochelle", department: "17" },
  { name: "Angoulême", department: "16" },
  { name: "Pau", department: "64" },
  { name: "Bayonne", department: "64" },
  { name: "Biarritz", department: "64" },
  
  // Occitanie
  { name: "Toulouse", department: "31" },
  { name: "Montpellier", department: "34" },
  { name: "Nîmes", department: "30" },
  { name: "Perpignan", department: "66" },
  { name: "Béziers", department: "34" },
  { name: "Narbonne", department: "11" },
  { name: "Carcassonne", department: "11" },
  { name: "Albi", department: "81" },
  { name: "Tarbes", department: "65" },
  { name: "Rodez", department: "12" },
  
  // Hauts-de-France
  { name: "Lille", department: "59" },
  { name: "Roubaix", department: "59" },
  { name: "Tourcoing", department: "59" },
  { name: "Dunkerque", department: "59" },
  { name: "Amiens", department: "80" },
  { name: "Calais", department: "62" },
  { name: "Boulogne-sur-Mer", department: "62" },
  { name: "Beauvais", department: "60" },
  { name: "Compiègne", department: "60" },
  
  // PACA
  { name: "Marseille", department: "13" },
  { name: "Aix-en-Provence", department: "13" },
  { name: "Nice", department: "06" },
  { name: "Cannes", department: "06" },
  { name: "Antibes", department: "06" },
  { name: "Toulon", department: "83" },
  { name: "Avignon", department: "84" },
  { name: "Fréjus", department: "83" },
  { name: "Hyères", department: "83" },
  
  // Grand Est
  { name: "Strasbourg", department: "67" },
  { name: "Reims", department: "51" },
  { name: "Metz", department: "57" },
  { name: "Nancy", department: "54" },
  { name: "Mulhouse", department: "68" },
  { name: "Colmar", department: "68" },
  { name: "Troyes", department: "10" },
  { name: "Épinal", department: "88" },
  
  // Pays de la Loire
  { name: "Nantes", department: "44" },
  { name: "Saint-Nazaire", department: "44" },
  { name: "Angers", department: "49" },
  { name: "Le Mans", department: "72" },
  { name: "Laval", department: "53" },
  { name: "La Roche-sur-Yon", department: "85" },
  
  // Bretagne
  { name: "Rennes", department: "35" },
  { name: "Brest", department: "29" },
  { name: "Quimper", department: "29" },
  { name: "Lorient", department: "56" },
  { name: "Vannes", department: "56" },
  { name: "Saint-Brieuc", department: "22" },
  
  // Normandie
  { name: "Le Havre", department: "76" },
  { name: "Rouen", department: "76" },
  { name: "Caen", department: "14" },
  { name: "Cherbourg-en-Cotentin", department: "50" },
  { name: "Évreux", department: "27" },
  { name: "Alençon", department: "61" },
  
  // Bourgogne-Franche-Comté
  { name: "Dijon", department: "21" },
  { name: "Besançon", department: "25" },
  { name: "Chalon-sur-Saône", department: "71" },
  { name: "Auxerre", department: "89" },
  { name: "Nevers", department: "58" },
  { name: "Belfort", department: "90" },
  
  // Centre-Val de Loire
  { name: "Tours", department: "37" },
  { name: "Orléans", department: "45" },
  { name: "Bourges", department: "18" },
  { name: "Chartres", department: "28" },
  { name: "Blois", department: "41" },
  { name: "Châteauroux", department: "36" },
  
  // Corse
  { name: "Ajaccio", department: "2A" },
  { name: "Bastia", department: "2B" },
  { name: "Porto-Vecchio", department: "2A" },
  { name: "Corte", department: "2B" },
];

// Fonction pour obtenir toutes les localisations combinées pour la recherche
export const getAllLocations = () => {
  const locations: { label: string; value: string; type: "region" | "department" | "city" }[] = [];
  
  // Ajouter les régions
  regions.forEach(region => {
    locations.push({
      label: region.name,
      value: `region-${region.id}`,
      type: "region"
    });
  });
  
  // Ajouter les départements
  departments.forEach(dept => {
    locations.push({
      label: `${dept.name} (${dept.code})`,
      value: `dept-${dept.code}`,
      type: "department"
    });
  });
  
  // Ajouter les villes
  cities.forEach(city => {
    const dept = departments.find(d => d.code === city.department);
    locations.push({
      label: `${city.name} (${city.department})`,
      value: `city-${city.name}-${city.department}`,
      type: "city"
    });
  });
  
  return locations;
};

// Fonction pour filtrer les localisations
export const filterLocations = (search: string) => {
  const searchLower = search.toLowerCase();
  return getAllLocations().filter(loc => 
    loc.label.toLowerCase().includes(searchLower)
  );
};

// Fonction pour obtenir les villes d'un département
export const getCitiesByDepartment = (deptCode: string) => {
  return cities.filter(city => city.department === deptCode);
};

// Fonction pour obtenir les départements d'une région
export const getDepartmentsByRegion = (regionId: string) => {
  return departments.filter(dept => dept.region === regionId);
};
