-- Ajouter la colonne intervention_radius à la table artisans
ALTER TABLE public.artisans 
ADD COLUMN IF NOT EXISTS intervention_radius INTEGER DEFAULT 50;

COMMENT ON COLUMN public.artisans.intervention_radius IS 'Rayon en km dans lequel l artisan accepte de travailler';