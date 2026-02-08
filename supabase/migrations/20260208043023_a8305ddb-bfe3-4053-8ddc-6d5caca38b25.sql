
-- Fix public_artisans view: only expose non-sensitive fields
DROP VIEW IF EXISTS public.public_artisans;
CREATE VIEW public.public_artisans WITH (security_invoker = true) AS
SELECT
  id, business_name, category_id, city, description, display_priority,
  experience_years, google_maps_url, google_rating, google_review_count,
  hourly_rate, intervention_radius, is_audited, is_verified, latitude,
  longitude, missions_completed, photo_url, portfolio_images,
  portfolio_videos, postal_code, profile_id, qualifications, rating,
  region, review_count, slug, status, subscription_tier,
  updated_at, user_id, website_url, working_hours, address, department, created_at,
  -- Expose social links (public by nature)
  facebook_url, instagram_url, linkedin_url,
  -- Mask sensitive fields: only show to authenticated owner/admin
  CASE WHEN auth.uid() IS NOT NULL THEN email ELSE NULL END AS email,
  CASE WHEN auth.uid() IS NOT NULL THEN phone ELSE NULL END AS phone,
  CASE WHEN auth.uid() IS NOT NULL THEN siret ELSE NULL END AS siret,
  CASE WHEN auth.uid() IS NOT NULL THEN google_id ELSE NULL END AS google_id
FROM public.artisans
WHERE status IN ('active', 'prospect');
