-- First, add the new columns
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for faster parent lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- Temporarily remove the foreign key constraint from artisans
ALTER TABLE public.artisans DROP CONSTRAINT IF EXISTS artisans_category_id_fkey;

-- Set all artisan category_id to NULL temporarily
UPDATE public.artisans SET category_id = NULL;

-- Also update demo_missions
UPDATE public.demo_missions SET category_id = NULL;

-- Also update missions if exists
UPDATE public.missions SET category_id = NULL;

-- Now we can safely delete all categories
DELETE FROM public.categories;

-- Insert parent categories with specific icons
INSERT INTO public.categories (id, name, icon, parent_id, display_order) VALUES
('11111111-1111-1111-1111-111111111101', 'Gros œuvre & Construction', 'building-2', NULL, 1),
('11111111-1111-1111-1111-111111111102', 'Second œuvre', 'hammer', NULL, 2),
('11111111-1111-1111-1111-111111111103', 'Menuiseries & Fermetures', 'door-open', NULL, 3),
('11111111-1111-1111-1111-111111111104', 'Extérieur & Aménagement', 'trees', NULL, 4),
('11111111-1111-1111-1111-111111111105', 'Entretien & Dépannage', 'wrench', NULL, 5),
('11111111-1111-1111-1111-111111111106', 'Rénovation & Décoration', 'paintbrush', NULL, 6),
('11111111-1111-1111-1111-111111111107', 'Énergies & Équipements', 'zap', NULL, 7),
('11111111-1111-1111-1111-111111111108', 'Artisans spécialisés', 'star', NULL, 8),
('11111111-1111-1111-1111-111111111109', 'Services liés au bâtiment', 'briefcase', NULL, 9);

-- Subcategories for Gros œuvre & Construction
INSERT INTO public.categories (name, icon, parent_id, display_order) VALUES
('Maçon', 'arrow-up-right', '11111111-1111-1111-1111-111111111101', 1),
('Charpentier', 'arrow-up-right', '11111111-1111-1111-1111-111111111101', 2),
('Couvreur / Zingueur', 'arrow-up-right', '11111111-1111-1111-1111-111111111101', 3),
('Terrassier', 'arrow-up-right', '11111111-1111-1111-1111-111111111101', 4),
('Constructeur de maison', 'arrow-up-right', '11111111-1111-1111-1111-111111111101', 5),
('Entreprise générale du bâtiment', 'arrow-up-right', '11111111-1111-1111-1111-111111111101', 6),
('Façadier / Ravaleur', 'arrow-up-right', '11111111-1111-1111-1111-111111111101', 7),
('Béton / Dallage', 'arrow-up-right', '11111111-1111-1111-1111-111111111101', 8),
('Étancheur', 'arrow-up-right', '11111111-1111-1111-1111-111111111101', 9);

-- Subcategories for Second œuvre
INSERT INTO public.categories (name, icon, parent_id, display_order) VALUES
('Plâtrier / Plaquiste', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 1),
('Menuisier', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 2),
('Serrurier', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 3),
('Carreleur', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 4),
('Solier / Parqueteur', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 5),
('Plombier', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 6),
('Électricien', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 7),
('Chauffagiste', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 8),
('Climaticien / Frigoriste', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 9),
('Peintre en bâtiment', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 10),
('Isolation thermique / acoustique', 'arrow-up-right', '11111111-1111-1111-1111-111111111102', 11);

-- Subcategories for Menuiseries & Fermetures
INSERT INTO public.categories (name, icon, parent_id, display_order) VALUES
('Menuiseries aluminium / PVC', 'arrow-up-right', '11111111-1111-1111-1111-111111111103', 1),
('Pose de fenêtres', 'arrow-up-right', '11111111-1111-1111-1111-111111111103', 2),
('Installation de portes & portails', 'arrow-up-right', '11111111-1111-1111-1111-111111111103', 3),
('Stores & volets roulants', 'arrow-up-right', '11111111-1111-1111-1111-111111111103', 4),
('Vérandas & pergolas', 'arrow-up-right', '11111111-1111-1111-1111-111111111103', 5);

-- Subcategories for Extérieur & Aménagement
INSERT INTO public.categories (name, icon, parent_id, display_order) VALUES
('Jardinier / Paysagiste', 'arrow-up-right', '11111111-1111-1111-1111-111111111104', 1),
('Élagueur', 'arrow-up-right', '11111111-1111-1111-1111-111111111104', 2),
('Pisciniste', 'arrow-up-right', '11111111-1111-1111-1111-111111111104', 3),
('Clôtures', 'arrow-up-right', '11111111-1111-1111-1111-111111111104', 4),
('Aménagement extérieur', 'arrow-up-right', '11111111-1111-1111-1111-111111111104', 5),
('Création de terrasse', 'arrow-up-right', '11111111-1111-1111-1111-111111111104', 6),
('Travaux VRD', 'arrow-up-right', '11111111-1111-1111-1111-111111111104', 7);

-- Subcategories for Entretien & Dépannage
INSERT INTO public.categories (name, icon, parent_id, display_order) VALUES
('Dépannage plomberie', 'arrow-up-right', '11111111-1111-1111-1111-111111111105', 1),
('Dépannage électricité', 'arrow-up-right', '11111111-1111-1111-1111-111111111105', 2),
('Serrurerie / ouverture de portes', 'arrow-up-right', '11111111-1111-1111-1111-111111111105', 3),
('Ramoneur', 'arrow-up-right', '11111111-1111-1111-1111-111111111105', 4),
('Nettoyage / désinfection', 'arrow-up-right', '11111111-1111-1111-1111-111111111105', 5),
('Désinsectisation / dératisation', 'arrow-up-right', '11111111-1111-1111-1111-111111111105', 6);

-- Subcategories for Rénovation & Décoration
INSERT INTO public.categories (name, icon, parent_id, display_order) VALUES
('Rénovation complète', 'arrow-up-right', '11111111-1111-1111-1111-111111111106', 1),
('Décorateur d''intérieur', 'arrow-up-right', '11111111-1111-1111-1111-111111111106', 2),
('Architecte d''intérieur', 'arrow-up-right', '11111111-1111-1111-1111-111111111106', 3),
('Pose de cuisine', 'arrow-up-right', '11111111-1111-1111-1111-111111111106', 4),
('Salle de bain clé en main', 'arrow-up-right', '11111111-1111-1111-1111-111111111106', 5),
('Enduiseur', 'arrow-up-right', '11111111-1111-1111-1111-111111111106', 6);

-- Subcategories for Énergies & Équipements
INSERT INTO public.categories (name, icon, parent_id, display_order) VALUES
('Pompe à chaleur', 'arrow-up-right', '11111111-1111-1111-1111-111111111107', 1),
('Chauffage / chaudière / gaz', 'arrow-up-right', '11111111-1111-1111-1111-111111111107', 2),
('Panneaux solaires / photovoltaïque', 'arrow-up-right', '11111111-1111-1111-1111-111111111107', 3),
('Poêles & cheminées', 'arrow-up-right', '11111111-1111-1111-1111-111111111107', 4),
('Ventilation / VMC', 'arrow-up-right', '11111111-1111-1111-1111-111111111107', 5),
('Domotique', 'arrow-up-right', '11111111-1111-1111-1111-111111111107', 6);

-- Subcategories for Artisans spécialisés
INSERT INTO public.categories (name, icon, parent_id, display_order) VALUES
('Ferronnier', 'arrow-up-right', '11111111-1111-1111-1111-111111111108', 1),
('Vitrier', 'arrow-up-right', '11111111-1111-1111-1111-111111111108', 2),
('Tailleur de pierre', 'arrow-up-right', '11111111-1111-1111-1111-111111111108', 3),
('Stucateur', 'arrow-up-right', '11111111-1111-1111-1111-111111111108', 4),
('Artisan d''art', 'arrow-up-right', '11111111-1111-1111-1111-111111111108', 5),
('Métallier', 'arrow-up-right', '11111111-1111-1111-1111-111111111108', 6);

-- Subcategories for Services liés au bâtiment
INSERT INTO public.categories (name, icon, parent_id, display_order) VALUES
('Diagnostiqueur immobilier', 'arrow-up-right', '11111111-1111-1111-1111-111111111109', 1),
('Géomètre', 'arrow-up-right', '11111111-1111-1111-1111-111111111109', 2),
('Bureau d''études', 'arrow-up-right', '11111111-1111-1111-1111-111111111109', 3),
('Architecte', 'arrow-up-right', '11111111-1111-1111-1111-111111111109', 4),
('Constructeur bois', 'arrow-up-right', '11111111-1111-1111-1111-111111111109', 5),
('Entreprise multiservices / homme toutes mains', 'arrow-up-right', '11111111-1111-1111-1111-111111111109', 6);

-- Restore the foreign key constraint
ALTER TABLE public.artisans 
ADD CONSTRAINT artisans_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.categories(id);