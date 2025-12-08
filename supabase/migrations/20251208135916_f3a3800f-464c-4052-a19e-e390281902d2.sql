-- Créer une vue publique qui exclut les données sensibles
CREATE OR REPLACE VIEW public.public_artisans AS
SELECT 
  id,
  business_name,
  description,
  city,
  department,
  region,
  postal_code,
  address,
  category_id,
  photo_url,
  portfolio_images,
  rating,
  review_count,
  experience_years,
  hourly_rate,
  missions_completed,
  qualifications,
  availability,
  website_url,
  facebook_url,
  instagram_url,
  linkedin_url,
  is_verified,
  status,
  created_at,
  updated_at
  -- Exclus: siret, insurance_number, user_id, profile_id
FROM public.artisans
WHERE status = 'active';

-- Donner accès en lecture à tous (anon et authenticated)
GRANT SELECT ON public.public_artisans TO anon, authenticated;

-- Mettre à jour la politique de la table artisans pour restreindre l'accès aux données sensibles
DROP POLICY IF EXISTS "Artisans are viewable by everyone" ON public.artisans;

-- Nouvelle politique : accès complet uniquement pour le propriétaire ou admin
CREATE POLICY "Artisans full data viewable by owner or admin"
ON public.artisans
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);