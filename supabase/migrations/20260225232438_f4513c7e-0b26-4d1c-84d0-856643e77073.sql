
-- Drop and recreate the view with the exact same column order plus intervention_zone
DROP VIEW IF EXISTS public.public_artisans;
CREATE VIEW public.public_artisans AS
SELECT 
  id, slug, business_name, description, city, department, region,
  category_id, hourly_rate, experience_years, rating, review_count,
  missions_completed, photo_url, portfolio_images, portfolio_videos,
  is_verified, status, facebook_url, instagram_url, linkedin_url,
  website_url, qualifications, working_hours, created_at, updated_at,
  google_maps_url, google_rating, google_review_count, subscription_tier,
  display_priority, intervention_radius, latitude, longitude,
  is_audited, profile_id, available_urgent, available_urgent_at, is_rge
FROM public.artisans;
