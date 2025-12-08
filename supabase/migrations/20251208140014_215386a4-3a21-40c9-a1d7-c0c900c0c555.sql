-- Recréer la vue avec security_invoker pour utiliser les permissions de l'utilisateur qui requête
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans 
WITH (security_invoker = true)
AS
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
FROM public.artisans
WHERE status = 'active';

-- Donner accès en lecture à tous
GRANT SELECT ON public.public_artisans TO anon, authenticated;