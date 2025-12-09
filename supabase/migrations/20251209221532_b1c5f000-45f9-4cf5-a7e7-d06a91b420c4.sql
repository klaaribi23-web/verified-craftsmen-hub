-- Add portfolio_videos column to artisans table for storing video URLs
ALTER TABLE public.artisans 
ADD COLUMN portfolio_videos TEXT[] DEFAULT NULL;

-- Add to the public_artisans view by recreating it with the new column
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans 
WITH (security_invoker = true)
AS SELECT 
  id,
  business_name,
  description,
  photo_url,
  address,
  postal_code,
  city,
  department,
  region,
  category_id,
  rating,
  review_count,
  qualifications,
  experience_years,
  hourly_rate,
  missions_completed,
  availability,
  is_verified,
  status,
  portfolio_images,
  portfolio_videos,
  facebook_url,
  instagram_url,
  linkedin_url,
  website_url,
  created_at,
  updated_at
FROM public.artisans
WHERE status = 'active';