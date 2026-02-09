
-- Must DROP then CREATE since we're removing columns
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans
WITH (security_invoker = on)
AS
SELECT 
  id,
  business_name,
  category_id,
  city,
  description,
  display_priority,
  experience_years,
  google_maps_url,
  google_rating,
  google_review_count,
  hourly_rate,
  intervention_radius,
  is_audited,
  is_verified,
  latitude,
  longitude,
  missions_completed,
  photo_url,
  portfolio_images,
  portfolio_videos,
  postal_code,
  profile_id,
  qualifications,
  rating,
  region,
  review_count,
  slug,
  status,
  subscription_tier,
  updated_at,
  website_url,
  working_hours,
  address,
  department,
  created_at,
  facebook_url,
  instagram_url,
  linkedin_url
FROM artisans
WHERE status IN ('active', 'prospect');

-- Policy for the view to read active/prospect artisans (needed for security_invoker)
DROP POLICY IF EXISTS "Public can read active artisans via view" ON public.artisans;
CREATE POLICY "Public can read active artisans via view"
ON public.artisans
FOR SELECT
USING (status IN ('active', 'prospect'));

-- Force RLS even for table owner
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.artisans FORCE ROW LEVEL SECURITY;
