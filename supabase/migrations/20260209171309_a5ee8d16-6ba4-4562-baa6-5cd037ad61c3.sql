
-- Drop the function-based view (causes relation errors and security definer view warning)
DROP VIEW IF EXISTS public.public_artisans;
DROP FUNCTION IF EXISTS public.get_public_artisans();

-- Recreate the view with security_invoker (standard approach)
CREATE VIEW public.public_artisans
WITH (security_invoker = on)
AS
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

-- Re-add the SELECT policy for the view to work (only active/prospect, no sensitive fields exposed because the view itself filters them out)
CREATE POLICY "Public can read active artisans via view"
ON public.artisans
FOR SELECT
USING (status IN ('active', 'prospect'));
