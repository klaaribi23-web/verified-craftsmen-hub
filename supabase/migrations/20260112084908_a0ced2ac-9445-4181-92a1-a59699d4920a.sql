-- Ajouter une colonne pour identifier la source d'inscription
ALTER TABLE public.artisans ADD COLUMN source TEXT DEFAULT 'import';

-- Mettre à jour les artisans existants avec un user_id 
-- qui n'ont pas d'activation_sent_at (= inscrits eux-mêmes)
UPDATE public.artisans 
SET source = 'self_signup' 
WHERE user_id IS NOT NULL 
  AND activation_sent_at IS NULL;

-- Ceux avec activation_sent_at = viennent de l'import (vitrines confirmées)
UPDATE public.artisans 
SET source = 'import' 
WHERE user_id IS NOT NULL 
  AND activation_sent_at IS NOT NULL;

-- Vitrines importées (prospects) restent 'import'
UPDATE public.artisans 
SET source = 'import' 
WHERE status = 'prospect';