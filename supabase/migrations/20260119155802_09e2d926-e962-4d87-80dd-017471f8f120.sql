-- Ajouter la colonne fake_applicants_count pour les missions de démonstration
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS fake_applicants_count integer DEFAULT NULL;

-- Ajouter la colonne fake_client_id pour lier à demo_profiles
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS fake_client_id uuid DEFAULT NULL;

-- Ajouter une contrainte FK vers demo_profiles
ALTER TABLE public.missions 
ADD CONSTRAINT missions_fake_client_id_fkey 
FOREIGN KEY (fake_client_id) REFERENCES public.demo_profiles(id) ON DELETE CASCADE;

-- Créer le profil client fictif dans demo_profiles
INSERT INTO public.demo_profiles (email, first_name, last_name, city)
SELECT 'fake-missions@craftlink.local', 'Client', 'Particulier', 'France'
WHERE NOT EXISTS (SELECT 1 FROM public.demo_profiles WHERE email = 'fake-missions@craftlink.local');

-- Insérer 150 missions fictives réparties sur 4 mois
DO $$
DECLARE
  fake_client_id uuid;
  category_ids uuid[];
  cat_id uuid;
  i integer;
  random_days integer;
  random_budget numeric;
  random_applicants integer;
  mission_titles text[] := ARRAY[
    'Rénovation complète salle de bain',
    'Installation tableau électrique',
    'Pose de carrelage 45m²',
    'Remplacement chauffe-eau 200L',
    'Construction mur de clôture 15m',
    'Rénovation peinture appartement 80m²',
    'Pose parquet massif salon',
    'Installation climatisation réversible',
    'Réfection toiture ardoise 60m²',
    'Création terrasse bois 25m²',
    'Ravalement façade maison',
    'Installation VMC double flux',
    'Pose fenêtres PVC double vitrage',
    'Rénovation cuisine complète',
    'Aménagement combles 40m²',
    'Construction extension 20m²',
    'Installation panneaux solaires',
    'Rénovation escalier bois',
    'Pose portail motorisé',
    'Installation domotique maison',
    'Réparation fuite toiture',
    'Changement radiateurs fonte',
    'Pose store banne 4m',
    'Création verrière intérieure',
    'Installation poêle à bois',
    'Rénovation salle de douche PMR',
    'Pose moquette bureau 60m²',
    'Installation interphone vidéo',
    'Réfection électricité appartement',
    'Pose bardage bois façade',
    'Installation piscine coque',
    'Création jardin paysager',
    'Pose clôture grillage 30m',
    'Rénovation WC suspendu',
    'Installation alarme maison',
    'Pose velux chambre',
    'Réparation charpente bois',
    'Installation borne recharge véhicule',
    'Pose isolation combles 80m²',
    'Création placards sur mesure',
    'Installation pompe à chaleur',
    'Rénovation studio 25m²',
    'Pose béton ciré sol 50m²',
    'Installation système arrosage',
    'Réfection joints carrelage',
    'Pose gouttières zinc 20m',
    'Installation chauffage sol',
    'Création mezzanine chambre',
    'Pose papier peint 3 pièces',
    'Installation récupérateur eau pluie'
  ];
  descriptions text[] := ARRAY[
    'Projet de rénovation complète incluant démolition, plomberie et pose des nouveaux équipements. Nous souhaitons une finition moderne et fonctionnelle.',
    'Travaux à réaliser dans une maison des années 70. Mise aux normes nécessaire avec remplacement du tableau et ajout de prises.',
    'Surface à carreler dans une pièce de vie. Carrelage fourni par nos soins, cherchons artisan expérimenté pour la pose.',
    'Remplacement urgent suite à panne. Accès facile, évacuation existante en bon état. Prévoir demi-journée de travail.',
    'Construction muret en parpaings avec finition enduit. Terrain plat, accès facile pour livraison matériaux.',
    'Appartement T4 à rafraîchir entièrement. Murs en bon état, préparation minimale. Peinture blanche et couleurs à définir.',
    'Pose parquet chêne massif dans le salon. Ragréage à prévoir, plinthe à fournir. Délai souhaité sous 2 semaines.',
    'Installation clim réversible mono-split. Appartement dernier étage, accès toiture possible pour unité extérieure.',
    'Toiture ardoise ancienne avec quelques ardoises cassées et problèmes d étanchéité. Devis détaillé souhaité.',
    'Création terrasse sur plot avec lames composite. Terrain stable, surface rectangulaire. Fourniture matériaux à discuter.',
    'Ravalement façade maison individuelle. Surface environ 120m². Nettoyage et peinture, réparation fissures mineures.',
    'Maison BBC, installation VMC double flux avec récupération chaleur. Gaines à prévoir dans les combles.',
    'Remplacement 6 fenêtres simple vitrage par PVC double vitrage. Dimensions standards, accès facile.',
    'Rénovation cuisine avec dépose ancien mobilier, électricité et plomberie à adapter. Pose nouveau mobilier incluse.',
    'Aménagement combles perdus en espace de vie. Isolation, électricité, cloisons et finitions à prévoir.',
    'Extension plain-pied pour agrandir le séjour. Fondations, maçonnerie, toiture plate. Permis obtenu.',
    'Installation 12 panneaux photovoltaïques sur toiture tuiles. Orientation sud, inclinaison 30 degrés.',
    'Escalier bois ancien à poncer et vitrifier. Rampe à restaurer. 14 marches plus palier.',
    'Pose portail aluminium coulissant 4m avec motorisation. Piliers existants, alimentation électrique à prévoir.',
    'Installation système domotique Legrand. Éclairage, volets, chauffage à connecter. Maison récente.',
    'Fuite au niveau de la noue, infiltrations visibles au plafond. Intervention urgente souhaitée.',
    'Remplacement 5 radiateurs fonte par modèles aluminium. Circuit chauffage central gaz existant.',
    'Store banne motorisé pour terrasse. Largeur 4m, avancée 3m. Fixation sur façade crépi.',
    'Verrière acier style atelier pour séparer cuisine et salon. Dimensions 3m x 2.5m avec porte.',
    'Installation poêle à granulés avec conduit à créer. Pièce de 40m², murs porteurs béton.',
    'Salle de douche accessible PMR. Douche italienne, barres maintien, WC rehaussé.',
    'Pose moquette bureaux professionnels. 4 pièces, accès ascenseur, travaux de nuit possible.',
    'Remplacement interphone ancien par vidéophone couleur. Immeuble 6 appartements.',
    'Réfection complète électricité T3. Tableau, prises, éclairages. Mise aux normes obligatoire.',
    'Bardage douglas naturel sur façade nord. Surface 35m², isolation extérieure incluse.',
    'Installation piscine coque polyester 8x4m. Terrassement et local technique à prévoir.',
    'Création jardin avec pelouse, massifs et allée gravillonnée. Surface totale 200m².',
    'Clôture grillage rigide vert 1.50m de haut. Terrain légèrement pentu.',
    'Remplacement WC classique par suspendu. Bâti-support à installer, carrelage existant.',
    'Alarme sans fil 5 zones avec détecteurs mouvement et ouverture. Télésurveillance optionnelle.',
    'Pose 2 velux confort 78x98 dans chambre mansardée. Étanchéité et habillage inclus.',
    'Réparation ferme endommagée par insectes. Traitement et renforcement nécessaires.',
    'Borne recharge voiture électrique 7kW. Garage privatif, tableau électrique proche.',
    'Isolation soufflée laine de roche dans combles perdus. Accès trappe existante.',
    'Création dressing sur mesure chambre parentale. Portes coulissantes miroir.',
    'PAC air-eau pour remplacer chaudière fioul. Maison 150m², 4 chambres.',
    'Rénovation complète studio location. Peinture, sol, électricité, plomberie.',
    'Sol béton ciré couleur gris anthracite. Préparation support incluse.',
    'Arrosage automatique jardin 300m². 6 zones, programmateur connecté.',
    'Réfection joints silicone salle de bain et cuisine. Traitement anti-moisissures.',
    'Remplacement gouttières zinc naturel. Descentes et dauphins inclus.',
    'Plancher chauffant eau chaude RDC maison neuve. Surface 80m².',
    'Mezzanine bois pour chambre enfant. Hauteur sous plafond 3.2m.',
    'Pose papier peint intissé 3 chambres. Préparation murs à prévoir.',
    'Cuve enterrée 5000L avec pompe et raccordement arrosage.'
  ];
  cities text[] := ARRAY[
    'Paris', 'Paris 15e', 'Paris 11e', 'Paris 20e', 'Paris 17e', 'Paris 12e',
    'Lyon', 'Lyon 3e', 'Lyon 6e', 'Villeurbanne',
    'Marseille', 'Marseille 8e', 'Aix-en-Provence',
    'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 'Nice', 'Strasbourg',
    'Montpellier', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne',
    'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Clermont-Ferrand',
    'Le Mans', 'Tours', 'Amiens', 'Limoges', 'Perpignan', 'Besançon',
    'Orléans', 'Rouen', 'Metz', 'Nancy', 'Caen', 'Brest',
    'Argenteuil', 'Montreuil', 'Versailles', 'Boulogne-Billancourt',
    'Saint-Denis', 'Courbevoie', 'Vitry-sur-Seine', 'Créteil'
  ];
BEGIN
  -- Récupérer l'ID du client fake depuis demo_profiles
  SELECT id INTO fake_client_id FROM demo_profiles WHERE email = 'fake-missions@craftlink.local';
  
  -- Récupérer tous les IDs de catégories
  SELECT array_agg(id) INTO category_ids FROM categories;
  
  -- Insérer 150 missions avec fake_client_id au lieu de client_id
  FOR i IN 1..150 LOOP
    random_days := floor(random() * 120)::integer;
    random_budget := (floor(random() * 49) + 1) * 500;
    random_applicants := floor(random() * 21 + 5)::integer;
    cat_id := category_ids[1 + floor(random() * array_length(category_ids, 1))::integer];
    
    INSERT INTO missions (
      client_id,
      fake_client_id,
      category_id,
      title,
      description,
      city,
      budget,
      status,
      fake_applicants_count,
      created_at
    ) VALUES (
      (SELECT id FROM profiles LIMIT 1), -- client_id obligatoire, on prend un profil existant
      fake_client_id,
      cat_id,
      mission_titles[1 + floor(random() * array_length(mission_titles, 1))::integer],
      descriptions[1 + floor(random() * array_length(descriptions, 1))::integer],
      cities[1 + floor(random() * array_length(cities, 1))::integer],
      random_budget,
      'published',
      random_applicants,
      now() - (random_days || ' days')::interval
    );
  END LOOP;
END $$;