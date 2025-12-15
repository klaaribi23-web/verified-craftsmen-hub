-- Recréer la vue public_artisans SANS security_invoker = true
-- Cela permet à la vue de fonctionner avec les permissions du propriétaire
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans AS
SELECT 
  id,
  business_name,
  description,
  city,
  department,
  region,
  address,
  postal_code,
  photo_url,
  portfolio_images,
  portfolio_videos,
  rating,
  review_count,
  experience_years,
  hourly_rate,
  qualifications,
  availability,
  is_verified,
  missions_completed,
  status,
  created_at,
  updated_at,
  slug,
  category_id,
  facebook_url,
  instagram_url,
  linkedin_url,
  website_url,
  CASE WHEN status = 'active'::artisan_status THEN email ELSE NULL END as email,
  CASE WHEN status = 'active'::artisan_status THEN phone ELSE NULL END as phone
FROM public.artisans
WHERE status IN ('active'::artisan_status, 'prospect'::artisan_status);

-- Accorder l'accès public à la vue
GRANT SELECT ON public.public_artisans TO anon;
GRANT SELECT ON public.public_artisans TO authenticated;