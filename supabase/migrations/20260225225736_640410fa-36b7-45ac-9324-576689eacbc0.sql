DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans AS
SELECT 
  id, slug, business_name, description, city, department, region, category_id,
  photo_url, portfolio_images, portfolio_videos,
  rating, review_count, missions_completed, experience_years, hourly_rate,
  is_verified, is_audited, status, working_hours, created_at, updated_at,
  google_rating, google_review_count, latitude, longitude,
  display_priority, intervention_radius, qualifications,
  facebook_url, instagram_url, linkedin_url, website_url, google_maps_url,
  profile_id, subscription_tier, available_urgent, available_urgent_at
FROM public.artisans
WHERE status = ANY (ARRAY['active'::artisan_status, 'pending'::artisan_status, 'prospect'::artisan_status, 'disponible'::artisan_status, 'suspended'::artisan_status]);