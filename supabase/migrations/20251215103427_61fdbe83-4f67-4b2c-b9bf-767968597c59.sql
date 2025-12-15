-- Politique pour permettre aux utilisateurs authentifiés de lire les infos des artisans actifs/prospects
-- Nécessaire pour la messagerie (récupérer profile_id)
CREATE POLICY "Authenticated users can view active artisans basic info"
ON public.artisans
FOR SELECT
TO authenticated
USING (status IN ('active'::artisan_status, 'prospect'::artisan_status));