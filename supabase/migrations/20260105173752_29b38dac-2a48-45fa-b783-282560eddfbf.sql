-- Drop the security invoker view and recreate without it for public access
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
  phone,
  email,
  photo_url,
  portfolio_images,
  portfolio_videos,
  category_id,
  rating,
  review_count,
  experience_years,
  hourly_rate,
  is_verified,
  missions_completed,
  status,
  working_hours,
  qualifications,
  facebook_url,
  instagram_url,
  linkedin_url,
  website_url,
  slug,
  google_id,
  google_maps_url,
  google_rating,
  google_review_count,
  created_at,
  updated_at
FROM public.artisans
WHERE status IN ('active', 'prospect');