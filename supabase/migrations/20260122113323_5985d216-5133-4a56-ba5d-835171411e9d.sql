-- =============================================================================
-- PHASE 1: Corriger la politique RLS pour permettre l'accès public aux artisans
-- =============================================================================

-- Ajouter une politique permettant aux utilisateurs anonymes de voir les artisans actifs/prospect
CREATE POLICY "Public can view active artisans" 
ON public.artisans 
FOR SELECT 
USING (status IN ('active'::artisan_status, 'prospect'::artisan_status));

-- =============================================================================
-- PHASE 2: Régénérer les 150 missions de démonstration
-- =============================================================================

-- Ajouter contrainte unique sur email pour demo_profiles si elle n'existe pas
DO $$ BEGIN
    ALTER TABLE public.demo_profiles ADD CONSTRAINT demo_profiles_email_unique UNIQUE (email);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Créer le profil démo s'il n'existe pas déjà
INSERT INTO public.demo_profiles (email, first_name, last_name, phone, city)
SELECT 'fake-missions@craftlink.local', 'Client', 'Démo', '0600000000', 'Paris'
WHERE NOT EXISTS (SELECT 1 FROM public.demo_profiles WHERE email = 'fake-missions@craftlink.local');

-- Régénérer les 150 missions de démonstration avec INSERT directs
DO $$
DECLARE
    demo_client_id uuid;
    real_client_id uuid;
    cat_plomberie uuid;
    cat_electricite uuid;
    cat_maconnerie uuid;
    cat_peinture uuid;
    cat_carrelage uuid;
    cat_menuiserie uuid;
    cat_couverture uuid;
    cat_chauffage uuid;
    cat_isolation uuid;
    cat_jardinage uuid;
    cat_serrurerie uuid;
    cat_vitrerie uuid;
    cat_climatisation uuid;
    cat_platrerie uuid;
    cat_demolition uuid;
    cat_renovation uuid;
    cities text[] := ARRAY[
        'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Bordeaux', 'Lille', 'Nantes', 
        'Strasbourg', 'Nice', 'Rennes', 'Montpellier', 'Grenoble', 'Dijon', 
        'Angers', 'Reims', 'Tours', 'Saint-Étienne', 'Le Havre', 'Brest', 
        'Limoges', 'Amiens', 'Perpignan', 'Metz', 'Besançon', 'Orléans'
    ];
BEGIN
    -- Récupérer l'ID du profil démo
    SELECT id INTO demo_client_id FROM public.demo_profiles WHERE email = 'fake-missions@craftlink.local';
    SELECT id INTO real_client_id FROM public.profiles LIMIT 1;
    
    IF demo_client_id IS NULL OR real_client_id IS NULL THEN
        RAISE EXCEPTION 'Required profiles not found';
    END IF;

    -- Supprimer les anciennes missions démo
    DELETE FROM public.mission_applications WHERE mission_id IN (
        SELECT id FROM public.missions WHERE fake_client_id IS NOT NULL
    );
    DELETE FROM public.missions WHERE fake_client_id IS NOT NULL;

    -- Récupérer les IDs de catégories
    SELECT id INTO cat_plomberie FROM categories WHERE name = 'Plomberie' AND parent_id IS NULL;
    SELECT id INTO cat_electricite FROM categories WHERE name = 'Électricité' AND parent_id IS NULL;
    SELECT id INTO cat_maconnerie FROM categories WHERE name = 'Maçonnerie' AND parent_id IS NULL;
    SELECT id INTO cat_peinture FROM categories WHERE name = 'Peinture' AND parent_id IS NULL;
    SELECT id INTO cat_carrelage FROM categories WHERE name = 'Carrelage' AND parent_id IS NULL;
    SELECT id INTO cat_menuiserie FROM categories WHERE name = 'Menuiserie' AND parent_id IS NULL;
    SELECT id INTO cat_couverture FROM categories WHERE name = 'Couverture' AND parent_id IS NULL;
    SELECT id INTO cat_chauffage FROM categories WHERE name = 'Chauffage' AND parent_id IS NULL;
    SELECT id INTO cat_isolation FROM categories WHERE name = 'Isolation' AND parent_id IS NULL;
    SELECT id INTO cat_jardinage FROM categories WHERE name = 'Jardinage' AND parent_id IS NULL;
    SELECT id INTO cat_serrurerie FROM categories WHERE name = 'Serrurerie' AND parent_id IS NULL;
    SELECT id INTO cat_vitrerie FROM categories WHERE name = 'Vitrerie' AND parent_id IS NULL;
    SELECT id INTO cat_climatisation FROM categories WHERE name = 'Climatisation' AND parent_id IS NULL;
    SELECT id INTO cat_platrerie FROM categories WHERE name = 'Plâtrerie' AND parent_id IS NULL;
    SELECT id INTO cat_demolition FROM categories WHERE name = 'Démolition' AND parent_id IS NULL;
    SELECT id INTO cat_renovation FROM categories WHERE name = 'Rénovation' AND parent_id IS NULL;

    -- PLOMBERIE (10 missions)
    IF cat_plomberie IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_plomberie, 'Fuite sous évier cuisine', 'Fuite importante sous l''évier de la cuisine. Besoin d''intervention rapide.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_plomberie, 'Installation chauffe-eau', 'Remplacement ancien chauffe-eau par modèle thermodynamique 200L.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_plomberie, 'Débouchage canalisation', 'Canalisation bouchée dans la salle de bain, eau stagne.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_plomberie, 'Rénovation salle de bain', 'Rénovation complète : douche italienne, double vasque.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_plomberie, 'Remplacement robinetterie', 'Changer robinet mitigeur cuisine et salle de bain.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_plomberie, 'Installation adoucisseur', 'Pose adoucisseur d''eau pour maison individuelle.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_plomberie, 'Réparation chasse d''eau', 'Chasse d''eau qui coule en permanence.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_plomberie, 'Pose baignoire balnéo', 'Installation baignoire balnéo avec jets et pompe.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_plomberie, 'Détection fuite', 'Suspicion de fuite dans les murs, diagnostic nécessaire.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_plomberie, 'Installation pompe relevage', 'Pose pompe de relevage pour évacuation sous-sol.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- ÉLECTRICITÉ (10 missions)
    IF cat_electricite IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_electricite, 'Mise aux normes tableau', 'Tableau électrique ancien à remplacer, conformité NF C 15-100.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_electricite, 'Installation prises cuisine', 'Ajout de 4 prises dans cuisine rénovée.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_electricite, 'Panne électrique partielle', 'Plus de courant dans 3 pièces, disjoncteur saute.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_electricite, 'Pose luminaires LED', 'Installation spots LED encastrés salon et cuisine.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_electricite, 'Borne recharge véhicule', 'Installation borne de recharge 7kW véhicule électrique.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_electricite, 'Câblage réseau maison', 'Passage câbles Ethernet cat6 dans toute la maison.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_electricite, 'Installation VMC', 'Pose VMC double flux avec récupération chaleur.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_electricite, 'Dépannage interphone', 'Interphone ne fonctionne plus, à réparer ou remplacer.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_electricite, 'Ajout circuit dédié', 'Création circuit dédié pour four et plaque induction.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_electricite, 'Installation domotique', 'Mise en place système domotique : volets, éclairage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- MAÇONNERIE (10 missions)
    IF cat_maconnerie IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_maconnerie, 'Ouverture mur porteur', 'Création ouverture 3m dans mur porteur avec pose IPN.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_maconnerie, 'Construction mur clôture', 'Mur clôture en parpaings 15m linéaires, hauteur 1m80.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_maconnerie, 'Réparation fissures façade', 'Fissures importantes sur façade, diagnostic et réparation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_maconnerie, 'Création terrasse béton', 'Dalle béton 40m² pour terrasse, avec pente évacuation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_maconnerie, 'Extension maison', 'Extension 25m² en parpaings, toiture plate, isolation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_maconnerie, 'Montage abri jardin', 'Construction abri de jardin maçonné 12m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_maconnerie, 'Reprise soubassement', 'Réparation soubassement dégradé par humidité.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_maconnerie, 'Construction muret', 'Muret décoratif en pierres naturelles pour jardin.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_maconnerie, 'Ragréage sol', 'Ragréage sol 50m² avant pose parquet.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_maconnerie, 'Création escalier béton', 'Escalier extérieur béton 8 marches avec garde-corps.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- PEINTURE (10 missions)
    IF cat_peinture IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_peinture, 'Peinture appartement', 'Peinture complète T3 : murs et plafonds, blanc et couleurs.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_peinture, 'Ravalement façade', 'Ravalement façade maison 120m², nettoyage et peinture.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_peinture, 'Pose papier peint', 'Pose papier peint panoramique salon + 2 chambres.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_peinture, 'Peinture cage escalier', 'Peinture cage escalier immeuble 4 étages.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_peinture, 'Laquage portes', 'Laquage 8 portes intérieures en blanc satiné.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_peinture, 'Peinture extérieure', 'Peinture volets et portail en bois, décapage et 2 couches.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_peinture, 'Enduit décoratif', 'Application enduit décoratif effet béton ciré salon.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_peinture, 'Rénovation plafond', 'Plafond fissuré à reprendre : enduit, ponçage, peinture.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_peinture, 'Peinture bureaux', 'Peinture 5 bureaux professionnels, travaux weekend.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_peinture, 'Traitement humidité', 'Traitement murs humides + peinture anti-moisissure.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- CARRELAGE (10 missions)
    IF cat_carrelage IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_carrelage, 'Pose carrelage salle de bain', 'Carrelage sol et murs salle de bain 8m², grand format.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_carrelage, 'Carrelage cuisine', 'Pose carrelage sol cuisine 15m² + crédence.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_carrelage, 'Terrasse carrelée', 'Pose carrelage extérieur antidérapant terrasse 35m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_carrelage, 'Faïence douche', 'Faïence douche italienne, mosaïque et grand format.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_carrelage, 'Remplacement carreaux', 'Remplacement carreaux cassés dans cuisine et entrée.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_carrelage, 'Pose parquet flottant', 'Pose parquet flottant 60m², plinthes, seuils.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_carrelage, 'Carrelage imitation bois', 'Pose carrelage imitation parquet séjour 40m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_carrelage, 'Mosaïque piscine', 'Pose mosaïque piscine, joints époxy.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_carrelage, 'Rénovation sol commerce', 'Pose carrelage antidérapant commerce 80m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_carrelage, 'Pose tomettes', 'Pose tomettes anciennes récupérées, jointoiement.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- MENUISERIE (10 missions)
    IF cat_menuiserie IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_menuiserie, 'Pose cuisine équipée', 'Installation cuisine complète avec plan de travail.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_menuiserie, 'Fabrication placard', 'Placard sur mesure chambre, portes coulissantes.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_menuiserie, 'Remplacement fenêtres', 'Changement 6 fenêtres PVC double vitrage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_menuiserie, 'Pose parquet massif', 'Pose parquet chêne massif 45m², ponçage, vitrification.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_menuiserie, 'Installation porte blindée', 'Pose porte blindée A2P BP3, serrure 5 points.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_menuiserie, 'Création dressing', 'Dressing sur mesure 8m², étagères, penderies.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_menuiserie, 'Pose escalier bois', 'Escalier quart tournant chêne, rampe, balustres.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_menuiserie, 'Agencement bureau', 'Bureau sur mesure avec bibliothèque intégrée.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_menuiserie, 'Rénovation volets', 'Réparation et peinture 10 volets bois.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_menuiserie, 'Pose portail bois', 'Portail battant bois exotique motorisé.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- COUVERTURE (10 missions)
    IF cat_couverture IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_couverture, 'Réfection toiture', 'Remplacement tuiles vétustes sur 80m² de toiture.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_couverture, 'Réparation fuite toiture', 'Fuite toiture niveau cheminée, intervention urgente.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_couverture, 'Pose velux', 'Installation 2 fenêtres de toit Velux avec stores.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_couverture, 'Isolation combles', 'Isolation combles perdus 60m² laine soufflée.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_couverture, 'Zinguerie complète', 'Remplacement gouttières, descentes, noues.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_couverture, 'Nettoyage toiture', 'Démoussage et traitement hydrofuge toiture.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_couverture, 'Pose gouttières', 'Installation gouttières alu 25m linéaires.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_couverture, 'Réparation cheminée', 'Réfection souche cheminée, étanchéité.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_couverture, 'Toiture terrasse', 'Étanchéité toiture terrasse 40m², membrane EPDM.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_couverture, 'Surélévation toiture', 'Surélévation pour création combles aménageables.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- CHAUFFAGE (10 missions)
    IF cat_chauffage IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_chauffage, 'Installation pompe à chaleur', 'Pose PAC air/eau pour chauffage et ECS.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_chauffage, 'Remplacement chaudière', 'Changement chaudière fioul par gaz condensation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_chauffage, 'Pose radiateurs', 'Installation 6 radiateurs à inertie programmables.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_chauffage, 'Plancher chauffant', 'Pose plancher chauffant hydraulique 80m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_chauffage, 'Entretien chaudière', 'Révision annuelle chaudière gaz + ramonage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_chauffage, 'Installation poêle', 'Pose poêle à granulés 10kW avec conduit.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_chauffage, 'Désembouage circuit', 'Désembouage complet circuit chauffage central.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_chauffage, 'Thermostat connecté', 'Installation thermostat connecté multi-zones.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_chauffage, 'Réparation chauffage', 'Radiateurs froids, diagnostic et réparation circuit.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_chauffage, 'Climatisation réversible', 'Installation clim réversible bi-split.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- ISOLATION (10 missions)
    IF cat_isolation IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_isolation, 'ITE façade', 'Isolation thermique extérieure façade 150m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_isolation, 'Isolation combles aménagés', 'Isolation combles aménagés, laine de bois 30cm.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_isolation, 'Isolation phonique', 'Isolation acoustique mur mitoyen appartement.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_isolation, 'Isolation garage', 'Isolation plafond garage sous séjour.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_isolation, 'Isolation plancher', 'Isolation plancher bas sur cave, polyuréthane.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_isolation, 'Fenêtres triple vitrage', 'Remplacement par triple vitrage, 8 fenêtres.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_isolation, 'Isolation rampants', 'Isolation sous rampants de toiture 50m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_isolation, 'Traitement pont thermique', 'Correction ponts thermiques, ITI partielle.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_isolation, 'Isolation soufflée', 'Ouate de cellulose soufflée combles 80m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_isolation, 'Sarking toiture', 'Isolation par l''extérieur toiture, sarking.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- JARDINAGE (10 missions)
    IF cat_jardinage IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_jardinage, 'Création jardin', 'Aménagement jardin 200m² : pelouse, massifs, arbres.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_jardinage, 'Pose clôture', 'Clôture grillage rigide 30m avec portillon.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_jardinage, 'Taille haies', 'Taille haie laurier 40m linéaires, évacuation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_jardinage, 'Élagage arbres', 'Élagage 3 grands arbres, nacelle nécessaire.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_jardinage, 'Installation arrosage', 'Arrosage automatique enterré jardin 300m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_jardinage, 'Terrasse bois', 'Création terrasse bois composite 25m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_jardinage, 'Engazonnement', 'Préparation sol et semis gazon 400m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_jardinage, 'Abattage arbre', 'Abattage pin 15m, évacuation souche.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_jardinage, 'Création potager', 'Potager surélevé, carrés potagers, arrosage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_jardinage, 'Entretien annuel jardin', 'Contrat entretien jardin, 2 passages/mois.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- SERRURERIE (10 missions)
    IF cat_serrurerie IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_serrurerie, 'Ouverture porte claquée', 'Porte claquée, clés à l''intérieur, urgence.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_serrurerie, 'Remplacement serrure', 'Changement serrure 3 points après cambriolage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_serrurerie, 'Blindage porte', 'Blindage porte existante, serrure A2P.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_serrurerie, 'Installation digicode', 'Pose digicode et gâche électrique immeuble.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_serrurerie, 'Reproduction clés', 'Copies clés sécurisées pour copropriété.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_serrurerie, 'Motorisation portail', 'Motorisation portail coulissant + télécommandes.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_serrurerie, 'Cylindre haute sécurité', 'Remplacement cylindres par modèle anti-crochetage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_serrurerie, 'Réparation volet roulant', 'Volet roulant bloqué, moteur à vérifier.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_serrurerie, 'Installation coffre-fort', 'Pose coffre-fort encastré, scellement.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_serrurerie, 'Création accès PMR', 'Porte automatique coulissante pour accessibilité.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- VITRERIE (10 missions)
    IF cat_vitrerie IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_vitrerie, 'Remplacement vitrage', 'Vitrine cassée commerce, intervention rapide.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_vitrerie, 'Double vitrage', 'Rénovation fenêtres, pose double vitrage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_vitrerie, 'Miroir sur mesure', 'Grand miroir salle de bain 2m x 1m, fixation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_vitrerie, 'Paroi douche', 'Installation paroi douche fixe verre 10mm.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_vitrerie, 'Vitrage sécurit', 'Remplacement par verre sécurit vitrine.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_vitrerie, 'Crédence verre', 'Crédence cuisine verre laqué sur mesure.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_vitrerie, 'Garde-corps verre', 'Garde-corps terrasse verre et inox.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_vitrerie, 'Fenêtre cassée', 'Vitre fenêtre cassée, remplacement urgent.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_vitrerie, 'Verrière intérieure', 'Verrière atelier acier 3 travées.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_vitrerie, 'Survitrage', 'Pose survitrage isolation fenêtres anciennes.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- CLIMATISATION (10 missions)
    IF cat_climatisation IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_climatisation, 'Installation clim split', 'Climatisation mono-split chambre 25m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_climatisation, 'Clim multi-split', 'Climatisation 3 pièces, multi-split inverter.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_climatisation, 'Entretien climatisation', 'Maintenance annuelle clim, recharge gaz.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_climatisation, 'Clim gainable', 'Installation climatisation gainable maison.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_climatisation, 'Remplacement groupe', 'Changement groupe extérieur défectueux.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_climatisation, 'Clim bureau', 'Climatisation open-space 100m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_climatisation, 'Panne climatisation', 'Clim ne refroidit plus, diagnostic réparation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_climatisation, 'Clim réversible salon', 'Pose PAC air/air réversible salon.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_climatisation, 'Désinfection clim', 'Nettoyage et désinfection unités intérieures.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_climatisation, 'Installation VRV', 'Système VRV pour petit immeuble bureaux.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- PLÂTRERIE (10 missions)
    IF cat_platrerie IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_platrerie, 'Cloison placo', 'Création cloison séparative 12m², isolation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_platrerie, 'Faux plafond', 'Plafond suspendu dalles 60x60 bureau 40m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_platrerie, 'Doublage murs', 'Doublage isolant murs périphériques 80m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_platrerie, 'Bandes joints', 'Finition joints plaques de plâtre appartement.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_platrerie, 'Plafond tendu', 'Installation plafond tendu séjour 35m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_platrerie, 'Création niche', 'Niches murales placo avec éclairage LED.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_platrerie, 'Réparation plafond', 'Reprise plafond fissuré après dégât des eaux.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_platrerie, 'Habillage poutre', 'Coffrage poutres béton, finition lisse.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_platrerie, 'Cloison courbe', 'Cloison arrondie placo entrée design.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_platrerie, 'Trappe visite', 'Installation trappe de visite plafond.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- DÉMOLITION (10 missions)
    IF cat_demolition IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_demolition, 'Démolition cloison', 'Abattage cloison placo 15m², évacuation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_demolition, 'Dépose cuisine', 'Démontage cuisine complète et évacuation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_demolition, 'Curage appartement', 'Curage complet T4 avant rénovation.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_demolition, 'Démolition muret', 'Destruction muret jardin béton 8m.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_demolition, 'Ouverture mur', 'Percement mur pour création passage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_demolition, 'Dépose carrelage', 'Enlèvement carrelage sol 50m², ragréage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_demolition, 'Évacuation gravats', 'Location benne + évacuation déchets chantier.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_demolition, 'Démolition abri', 'Destruction abri jardin et dalle béton.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_demolition, 'Désamiantage', 'Diagnostic et retrait matériaux amiantés.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_demolition, 'Démolition totale', 'Démolition bâtiment annexe 40m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    -- RÉNOVATION (10 missions)
    IF cat_renovation IS NOT NULL THEN
        INSERT INTO missions (client_id, fake_client_id, category_id, title, description, city, status, fake_applicants_count, created_at) VALUES
        (real_client_id, demo_client_id, cat_renovation, 'Rénovation appartement', 'Rénovation complète T3 : électricité, plomberie, finitions.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_renovation, 'Rénovation salle de bain', 'Réfection totale SDB : plomberie, carrelage, équipements.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_renovation, 'Rénovation cuisine', 'Refonte cuisine : plomberie, électricité, meubles.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_renovation, 'Rénovation maison', 'Rénovation maison années 70, isolation, chauffage.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_renovation, 'Aménagement combles', 'Transformation combles en suite parentale.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_renovation, 'Rénovation façade', 'Ravalement + ITE façade maison.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_renovation, 'Rénovation énergétique', 'Audit et travaux rénovation énergétique globale.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_renovation, 'Rénovation commerce', 'Réaménagement local commercial 80m².', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_renovation, 'Rénovation escalier', 'Réfection escalier bois : marches, rampe, peinture.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day')),
        (real_client_id, demo_client_id, cat_renovation, 'Extension véranda', 'Création véranda aluminium 20m² sur terrasse.', cities[1 + floor(random()*25)::int], 'published', 5 + floor(random()*21)::int, NOW() - (random()*120 * interval '1 day'));
    END IF;

    RAISE NOTICE 'Demo missions regenerated successfully';
END $$;