-- Ajouter les colonnes de confirmation d'email à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_confirmed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmation_token uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS confirmation_sent_at timestamptz DEFAULT NULL;

-- Index pour recherche rapide par token
CREATE INDEX IF NOT EXISTS idx_profiles_confirmation_token 
ON public.profiles(confirmation_token) 
WHERE confirmation_token IS NOT NULL;

-- Mettre à jour les profils existants comme confirmés (pour ne pas bloquer les utilisateurs actuels)
UPDATE public.profiles 
SET email_confirmed = true 
WHERE email_confirmed IS NULL OR email_confirmed = false;