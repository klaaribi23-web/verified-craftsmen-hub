
-- 1. Drop the public SELECT policy that exposes sensitive columns
DROP POLICY IF EXISTS "Public can read active artisans via view" ON public.artisans;

-- 2. Recreate view WITHOUT security_invoker so it runs as owner (bypasses RLS)
-- This means no public SELECT policy is needed on the artisans table
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans AS
SELECT 
  id, business_name, category_id, city, description,
  display_priority, experience_years, google_maps_url,
  google_rating, google_review_count, hourly_rate,
  intervention_radius, is_audited, is_verified,
  latitude, longitude, missions_completed, photo_url,
  portfolio_images, portfolio_videos, postal_code,
  profile_id, qualifications, rating, region,
  review_count, slug, status, subscription_tier,
  updated_at, website_url, working_hours, address,
  department, created_at, facebook_url, instagram_url,
  linkedin_url
FROM artisans
WHERE status IN ('active', 'prospect');

-- 3. Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_artisans TO anon, authenticated;
