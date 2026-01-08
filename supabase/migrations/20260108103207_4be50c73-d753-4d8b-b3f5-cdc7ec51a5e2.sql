-- Ajouter les colonnes latitude et longitude à la table artisans
-- Pour stocker les coordonnées GPS lors de l'inscription/modification

ALTER TABLE public.artisans
ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);

-- Index pour améliorer les performances des recherches par localisation
CREATE INDEX IF NOT EXISTS idx_artisans_coordinates ON public.artisans (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;