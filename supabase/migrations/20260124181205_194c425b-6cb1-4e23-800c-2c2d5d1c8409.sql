-- Supprimer les policies publiques qui exposent les tokens de confirmation
-- Ces policies permettaient à des utilisateurs anonymous de lire/modifier les profils par token

DROP POLICY IF EXISTS "Allow token validation for email confirmation" ON public.profiles;
DROP POLICY IF EXISTS "Allow email confirmation via token" ON public.profiles;