-- Drop and recreate the public_artisans view to include prospect artisans
DROP VIEW IF EXISTS public_artisans;

CREATE VIEW public_artisans WITH (security_invoker = true) AS
SELECT 
  id,
  business_name,
  slug,
  description,
  city,
  department,
  region,
  address,
  postal_code,
  photo_url,
  portfolio_images,
  portfolio_videos,
  qualifications,
  website_url,
  facebook_url,
  instagram_url,
  linkedin_url,
  hourly_rate,
  experience_years,
  missions_completed,
  is_verified,
  status,
  availability,
  rating,
  review_count,
  created_at,
  updated_at,
  category_id
FROM public.artisans
WHERE status IN ('active'::artisan_status, 'prospect'::artisan_status);

-- Grant read access to all users
GRANT SELECT ON public.public_artisans TO anon, authenticated;