-- Add working_hours column to artisans table
ALTER TABLE public.artisans 
ADD COLUMN working_hours JSONB DEFAULT '{}'::jsonb;

-- Drop and recreate the view to include working_hours
DROP VIEW IF EXISTS public.public_artisans;

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
  email,
  working_hours
FROM public.artisans
WHERE status IN ('active', 'prospect');