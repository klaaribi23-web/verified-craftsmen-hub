-- Régénérer les 150 missions de démonstration avec les vraies catégories
-- Budget masqué (NULL), postulants entre 2 et 14
-- Utilise un profil existant comme client_id

DO $$
DECLARE
  v_real_profile_id uuid;
  v_demo_profile_id uuid;
  v_category_id uuid;
  v_created_date timestamp with time zone;
  v_i integer;
  v_category_index integer;
  v_city_index integer;
  v_title_index integer;
  v_fake_applicants integer;
  
  -- Catégories avec leurs IDs réels
  v_categories uuid[] := ARRAY[
    '4d4e1dc7-6f1a-4f29-9e3c-fc443ddc6f96'::uuid,
    'd0d105ac-c06e-463d-b0f3-796ca5e454ec'::uuid,
    '1b310327-afeb-43c6-b929-3a78172363b1'::uuid,
    '91a1a5d9-1b82-4450-9315-6b84a9eaca05'::uuid,
    '59823228-146e-41ba-82d8-abe42292e1f3'::uuid,
    'cc818ad7-c9fa-438c-bfc3-e14180cda9a4'::uuid,
    'ea416508-9998-41f0-8e31-c2762b7c53d9'::uuid,
    '1354b464-21b3-4b9e-b6c9-eb095df74e50'::uuid,
    '91c349ff-787c-4ff8-98a6-b1b8e8c4d09e'::uuid,
    'fdfd2ccd-ab2a-4944-8d42-eb84cbeed7c7'::uuid,
    '3c111378-9aea-48a2-9445-5def22728402'::uuid,
    '1a6cbb77-4ba0-4229-8813-4d9719160332'::uuid,
    'dd2f82c0-bed4-4c0d-9061-a192ec967797'::uuid,
    '1ba8d85f-2d90-48f2-8d86-409712f00571'::uuid,
    '3db78450-5ba4-4273-80f3-bcae7f5b58aa'::uuid,
    '6c57d5cf-dc4b-4d29-ac3d-8f2c7be0baf7'::uuid
  ];
  
  v_titles text[][] := ARRAY[
    ARRAY['Fuite sous evier a reparer', 'Installation chauffe-eau', 'Debouchage canalisation', 'Remplacement robinetterie', 'Reparation WC qui fuit', 'Installation douche italienne', 'Changement ballon eau chaude', 'Fuite radiateur chauffage', 'Renovation plomberie appartement', 'Mise aux normes plomberie'],
    ARRAY['Mise aux normes tableau electrique', 'Installation prises supplementaires', 'Panne electrique generale', 'Pose de spots LED', 'Remplacement interrupteurs', 'Installation VMC', 'Cablage reseau maison', 'Depannage court-circuit', 'Installation borne recharge', 'Renovation electrique complete'],
    ARRAY['Construction mur de cloture', 'Reparation fissures facade', 'Creation ouverture fenetre', 'Montage cloison parpaings', 'Reparation escalier beton', 'Construction terrasse beton', 'Extension maison', 'Reparation muret jardin', 'Creation cave', 'Ravalement facade'],
    ARRAY['Pose carrelage salle de bain', 'Carrelage cuisine neuve', 'Remplacement carreaux casses', 'Pose faience douche', 'Carrelage terrasse exterieure', 'Pose mosaique piscine', 'Renovation sol carrele', 'Pose carrelage grand format', 'Carrelage escalier', 'Pose tomettes anciennes'],
    ARRAY['Peinture appartement complet', 'Rafraichissement piece', 'Peinture facade exterieure', 'Pose papier peint', 'Peinture cage escalier', 'Laquage portes', 'Peinture plafond', 'Ravalement peinture', 'Peinture chambre enfant', 'Finitions peinture neuf'],
    ARRAY['Reparation fuite toiture', 'Remplacement tuiles cassees', 'Nettoyage toiture mousse', 'Installation velux', 'Refection gouttieres', 'Isolation sous toiture', 'Pose ardoises', 'Reparation cheminee', 'Etancheite toit terrasse', 'Couverture extension'],
    ARRAY['Fabrication placards sur mesure', 'Pose cuisine equipee', 'Reparation porte entree', 'Creation bibliotheque', 'Pose parquet massif', 'Fabrication escalier bois', 'Renovation fenetres bois', 'Creation dressing', 'Pose portes interieures', 'Amenagement combles'],
    ARRAY['Reparation charpente', 'Traitement bois charpente', 'Creation charpente garage', 'Extension charpente', 'Renforcement poutre', 'Charpente traditionnelle', 'Modification charpente combles', 'Reparation fermette', 'Structure bois terrasse', 'Ossature bois extension'],
    ARRAY['Entretien chaudiere annuel', 'Installation radiateurs', 'Remplacement chaudiere', 'Pose plancher chauffant', 'Depannage chauffage urgent', 'Installation poele a bois', 'Mise en service PAC', 'Desembouage radiateurs', 'Thermostat connecte', 'Reparation fuite chauffage'],
    ARRAY['Pose placo cloison', 'Faux plafond suspendu', 'Doublage isolation murs', 'Reparation trous mur', 'Creation niche murale', 'Plafond tendu', 'Enduit de lissage', 'Isolation phonique', 'Cloison separative', 'Habillage poutres'],
    ARRAY['Taille haies et arbustes', 'Creation pelouse', 'Amenagement jardin', 'Elagage arbre', 'Installation arrosage auto', 'Creation massifs fleurs', 'Entretien jardin mensuel', 'Abattage arbre', 'Pose cloture jardin', 'Terrasse bois jardin'],
    ARRAY['Ouverture porte claquee', 'Changement serrure', 'Installation porte blindee', 'Reparation volet roulant', 'Pose verrou securite', 'Remplacement cylindre', 'Porte garage motorisee', 'Grille de defense', 'Digicode entree', 'Serrure connectee'],
    ARRAY['Renovation appartement 50m2', 'Renovation maison ancienne', 'Transformation local commercial', 'Renovation etage complet', 'Modernisation appartement', 'Rehabilitation grange', 'Renovation studio location', 'Mise aux normes logement', 'Renovation apres sinistre', 'Renovation energetique globale'],
    ARRAY['Renovation salle de bain 5m2', 'Creation salle d eau', 'Salle de bain PMR', 'Douche a l italienne', 'Remplacement baignoire douche', 'Double vasque meuble', 'Salle de bain luxe', 'Renovation petite sdb', 'Sdb suite parentale', 'Modernisation salle de bain'],
    ARRAY['Pose cuisine IKEA', 'Installation cuisine equipee', 'Cuisine sur mesure', 'Remplacement plan travail', 'Electromenager encastre', 'Credence cuisine', 'Ilot central cuisine', 'Renovation cuisine annees 80', 'Cuisine americaine', 'Amenagement kitchenette'],
    ARRAY['Remplacement fenetres PVC', 'Pose baie vitree', 'Fenetres double vitrage', 'Porte fenetre coulissante', 'Velux chambre', 'Chassis aluminium', 'Fenetre sur mesure', 'Volets roulants elec', 'Porte entree vitree', 'Isolation fenetres']
  ];
  
  v_descriptions text[][] := ARRAY[
    ARRAY['Fuite persistante sous l evier de la cuisine, besoin intervention rapide.', 'Remplacement ancien chauffe-eau par modele thermodynamique.', 'Canalisation bouchee dans la salle de bain, eau ne s ecoule plus.', 'Robinets vetustes a changer dans cuisine et salle de bain.', 'Chasse d eau qui coule en permanence, gaspillage important.', 'Creation douche italienne dans nouvelle salle de bain.', 'Ballon eau chaude en fin de vie, fuite possible.', 'Radiateur qui fuit au niveau du raccord.', 'Renovation complete plomberie appartement ancien.', 'Mise aux normes installation vetuste.'],
    ARRAY['Tableau electrique ancien non conforme a faire remplacer.', 'Ajout de prises dans le salon et les chambres.', 'Plus de courant dans plusieurs pieces, disjoncteur saute.', 'Installation spots encastres dans faux plafond salon.', 'Interrupteurs et prises defectueux a remplacer.', 'Installation VMC simple flux dans appartement.', 'Cablage RJ45 pour bureau a domicile.', 'Court-circuit recurrent, installation a verifier.', 'Pose borne de recharge vehicule electrique garage.', 'Renovation electrique maison des annees 70.'],
    ARRAY['Construction mur en parpaings pour delimiter terrain.', 'Fissures apparues sur facade, diagnostic et reparation.', 'Creer une ouverture pour nouvelle fenetre salon.', 'Montage cloison en parpaings pour garage.', 'Escalier exterieur beton fissure a reparer.', 'Coulage dalle beton pour terrasse 20m2.', 'Extension plain-pied 15m2 pour chambre.', 'Muret jardin effondre a reconstruire.', 'Creation cave sous extension existante.', 'Ravalement facade maison individuelle.'],
    ARRAY['Pose carrelage sol et murs salle de bain neuve.', 'Carrelage sol cuisine apres renovation.', 'Quelques carreaux fissures a remplacer.', 'Faience murale pour douche italienne.', 'Carrelage antiderapant terrasse exterieure.', 'Mosaique pour bassin piscine.', 'Sol carrele abime, renovation complete.', 'Pose grand format 60x60 sejour.', 'Habillage escalier interieur en carrelage.', 'Pose tomettes recuperees cuisine provencale.'],
    ARRAY['Peinture complete appartement 3 pieces apres travaux.', 'Rafraichissement peinture salon et entree.', 'Peinture facade maison sur rue.', 'Pose papier peint panoramique chambre.', 'Peinture cage escalier immeuble 3 etages.', 'Laquage portes interieures en blanc.', 'Plafond jauni a repeindre en blanc.', 'Ravalement peinture copropriete.', 'Decoration chambre enfant thematique.', 'Finitions peinture construction neuve.'],
    ARRAY['Infiltration eau niveau cheminee, reparation urgente.', 'Plusieurs tuiles cassees suite tempete.', 'Toiture couverte de mousse, nettoyage necessaire.', 'Pose velux dans combles amenageables.', 'Gouttieres percees, remplacement zinc.', 'Isolation thermique sous rampants.', 'Couverture ardoises maison bretonne.', 'Chapeau cheminee a remplacer.', 'Etancheite toit terrasse garage.', 'Couverture tuiles pour extension.'],
    ARRAY['Placards sur mesure pour chambre sous pente.', 'Installation cuisine complete avec electro.', 'Porte entree bois endommagee, reparation ou remplacement.', 'Bibliotheque murale salon sur mesure.', 'Pose parquet chene massif sejour.', 'Creation escalier bois acces combles.', 'Fenetres bois anciennes a renover.', 'Dressing sur mesure chambre parentale.', 'Remplacement toutes portes interieures.', 'Amenagement combles en chambre.'],
    ARRAY['Poutre charpente attaquee par insectes.', 'Traitement preventif charpente bois.', 'Charpente traditionnelle pour garage neuf.', 'Agrandissement charpente pour extension.', 'Poutre porteuse a renforcer.', 'Charpente traditionnelle tuiles canal.', 'Modification charpente pour amenagement combles.', 'Fermette abimee a reparer.', 'Structure bois pour terrasse surelevee.', 'Ossature bois pour extension maison.'],
    ARRAY['Entretien annuel obligatoire chaudiere gaz.', 'Ajout radiateurs dans extension.', 'Chaudiere 20 ans a remplacer par condensation.', 'Installation plancher chauffant RDC.', 'Panne chauffage en plein hiver urgent.', 'Pose poele a granules salon.', 'Mise en service pompe a chaleur neuve.', 'Radiateurs froids en bas, desembouage.', 'Installation thermostat intelligent.', 'Fuite sur circuit chauffage central.'],
    ARRAY['Creation cloison placo pour separer piece.', 'Faux plafond pour cacher cables et spots.', 'Doublage murs avec isolation integree.', 'Trous importants dans cloison a reparer.', 'Creation niches decoratives murales.', 'Installation plafond tendu salle de bain.', 'Lissage murs avant peinture.', 'Isolation phonique entre appartements.', 'Cloison de separation bureau.', 'Habillage poutres beton en placo.'],
    ARRAY['Haies et arbustes non tailles depuis longtemps.', 'Creation pelouse sur terrain nu.', 'Conception et realisation jardin paysager.', 'Grand arbre a elaguer pres maison.', 'Systeme arrosage automatique jardin.', 'Creation massifs fleuris allee entree.', 'Contrat entretien jardin mensuel.', 'Abattage arbre dangereux.', 'Pose cloture perimetre jardin.', 'Construction terrasse bois sur plot.'],
    ARRAY['Porte claquee, cles a l interieur, urgent.', 'Serrure 3 points defectueuse a changer.', 'Pose porte blindee appartement.', 'Volet roulant bloque en position fermee.', 'Ajout verrou de securite porte cave.', 'Cylindre casse dans serrure.', 'Motorisation porte de garage existante.', 'Pose grilles de defense fenetres RDC.', 'Installation digicode entree immeuble.', 'Remplacement par serrure connectee.'],
    ARRAY['Renovation totale appartement achete vide.', 'Maison ancienne a moderniser entierement.', 'Transformation ancien commerce en logement.', 'Renovation complete premier etage maison.', 'Modernisation appartement annees 60.', 'Rehabilitation grange en habitation.', 'Renovation studio pour location.', 'Mise aux normes logement pour location.', 'Renovation appartement apres degat des eaux.', 'Renovation energetique complete maison.'],
    ARRAY['Renovation complete salle de bain existante.', 'Creation salle d eau dans chambre.', 'Salle de bain accessible personne mobilite reduite.', 'Transformation baignoire en douche italienne.', 'Remplacement baignoire par douche securisee.', 'Installation double vasque avec meuble.', 'Salle de bain haut de gamme materiaux nobles.', 'Renovation petite salle de bain 3m2.', 'Salle de bain attenante chambre parents.', 'Modernisation salle de bain datee.'],
    ARRAY['Pose cuisine IKEA complete avec decoupes.', 'Installation cuisine equipee neuve.', 'Realisation cuisine sur mesure cuisiniste.', 'Remplacement plan de travail stratifie.', 'Encastrement four frigo lave-vaisselle.', 'Pose credence verre ou carrelage.', 'Creation ilot central avec rangements.', 'Renovation cuisine tres datee.', 'Ouverture cuisine sur salon.', 'Creation coin cuisine studio.'],
    ARRAY['Remplacement toutes fenetres par PVC.', 'Pose grande baie vitree salon jardin.', 'Passage simple au double vitrage.', 'Installation porte fenetre coulissante.', 'Pose velux pour eclairer combles.', 'Chassis alu pour look moderne.', 'Fabrication fenetre sur mesure.', 'Motorisation volets roulants existants.', 'Porte entree avec vitrage securit.', 'Amelioration isolation fenetres.']
  ];
  
  v_cities text[] := ARRAY['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Bordeaux', 'Lille', 'Strasbourg', 'Montpellier', 'Rennes', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Saint-Etienne', 'Le Havre', 'Reims', 'Villeurbanne', 'Saint-Denis', 'Aix-en-Provence', 'Clermont-Ferrand', 'Brest', 'Tours', 'Amiens', 'Limoges', 'Perpignan', 'Metz', 'Besancon', 'Orleans', 'Rouen', 'Caen', 'Nancy', 'Avignon', 'Cannes', 'Antibes', 'Versailles', 'Pau', 'La Rochelle', 'Poitiers'];
  
BEGIN
  -- Utiliser un profil existant comme client_id (requis par la FK)
  SELECT id INTO v_real_profile_id FROM profiles LIMIT 1;
  
  -- Recuperer ou creer le profil demo pour fake_client_id
  SELECT id INTO v_demo_profile_id FROM demo_profiles WHERE email = 'fake-missions@craftlink.local';
  
  IF v_demo_profile_id IS NULL THEN
    INSERT INTO demo_profiles (email, first_name, last_name, city)
    VALUES ('fake-missions@craftlink.local', 'Client', 'Demo', 'Paris')
    RETURNING id INTO v_demo_profile_id;
  END IF;
  
  -- Generer 150 missions
  FOR v_i IN 1..150 LOOP
    v_category_index := 1 + floor(random() * 16)::integer;
    IF v_category_index > 16 THEN v_category_index := 16; END IF;
    
    v_category_id := v_categories[v_category_index];
    
    v_title_index := 1 + floor(random() * 10)::integer;
    IF v_title_index > 10 THEN v_title_index := 10; END IF;
    
    v_city_index := 1 + floor(random() * 40)::integer;
    IF v_city_index > 40 THEN v_city_index := 40; END IF;
    
    v_created_date := now() - (floor(random() * 120)::integer || ' days')::interval;
    
    -- Postulants entre 2 et 14
    v_fake_applicants := 2 + floor(random() * 13)::integer;
    
    INSERT INTO missions (
      title,
      description,
      city,
      category_id,
      budget,
      status,
      fake_client_id,
      fake_applicants_count,
      client_id,
      created_at
    ) VALUES (
      v_titles[v_category_index][v_title_index],
      v_descriptions[v_category_index][v_title_index],
      v_cities[v_city_index],
      v_category_id,
      NULL,
      'published',
      v_demo_profile_id,
      v_fake_applicants,
      v_real_profile_id,
      v_created_date
    );
  END LOOP;
  
  RAISE NOTICE 'Generation terminee : 150 missions creees';
END $$;