-- First drop the view that depends on availability
DROP VIEW IF EXISTS public.public_artisans;

-- Now drop the availability column from artisans table
ALTER TABLE public.artisans DROP COLUMN IF EXISTS availability;

-- Recreate the view without availability
CREATE VIEW public.public_artisans AS
SELECT 
  id,
  rating,
  review_count,
  experience_years,
  hourly_rate,
  is_verified,
  missions_completed,
  status,
  created_at,
  updated_at,
  category_id,
  phone,
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
  qualifications,
  slug,
  facebook_url,
  instagram_url,
  linkedin_url,
  website_url,
  email
FROM public.artisans
WHERE status IN ('active', 'prospect');