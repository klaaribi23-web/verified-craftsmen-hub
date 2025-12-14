-- Update public_artisans view to include phone column
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans WITH (security_invoker = true) AS
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
  category_id,
  phone,
  email
FROM artisans
WHERE status IN ('active'::artisan_status, 'prospect'::artisan_status);