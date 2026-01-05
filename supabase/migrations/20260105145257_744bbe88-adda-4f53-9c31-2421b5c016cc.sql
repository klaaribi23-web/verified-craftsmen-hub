-- Add Google-related columns to artisans table
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS google_id TEXT;
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1);
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS google_review_count INTEGER DEFAULT 0;

-- Recreate the public_artisans view to include Google fields
DROP VIEW IF EXISTS public_artisans;

CREATE VIEW public_artisans AS
SELECT 
  id,
  slug,
  business_name,
  description,
  city,
  department,
  region,
  address,
  postal_code,
  category_id,
  photo_url,
  portfolio_images,
  portfolio_videos,
  rating,
  review_count,
  experience_years,
  hourly_rate,
  is_verified,
  missions_completed,
  status,
  facebook_url,
  instagram_url,
  linkedin_url,
  website_url,
  qualifications,
  working_hours,
  created_at,
  updated_at,
  email,
  phone,
  google_id,
  google_maps_url,
  google_rating,
  google_review_count
FROM artisans
WHERE status IN ('active', 'prospect');