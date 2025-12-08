-- Ajouter une politique pour permettre la lecture publique des artisans actifs (données non-sensibles via la vue)
CREATE POLICY "Public can view active artisans basic info"
ON public.artisans
FOR SELECT
USING (status = 'active');