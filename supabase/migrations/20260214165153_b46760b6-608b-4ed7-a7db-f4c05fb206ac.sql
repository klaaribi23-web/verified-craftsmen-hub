-- Drop and recreate view with correct column order
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans 
WITH (security_invoker = false, security_barrier = true)
AS
SELECT 
  id, slug, business_name, description, city, department, region,
  category_id, photo_url, portfolio_images, portfolio_videos,
  rating, review_count, missions_completed, experience_years,
  hourly_rate, is_verified, is_audited, status, working_hours,
  created_at, updated_at, google_rating, google_review_count,
  latitude, longitude, display_priority, intervention_radius,
  qualifications, facebook_url, instagram_url, linkedin_url,
  website_url, google_maps_url, profile_id, subscription_tier
FROM public.artisans
WHERE status IN ('active', 'pending', 'prospect', 'disponible');

GRANT SELECT ON public.public_artisans TO anon, authenticated;
