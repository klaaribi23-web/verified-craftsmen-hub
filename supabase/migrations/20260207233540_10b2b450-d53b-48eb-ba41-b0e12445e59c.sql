DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans AS
SELECT 
  id, slug, business_name, description, city, department, region, address, postal_code,
  hourly_rate, experience_years, rating, review_count, missions_completed,
  photo_url, portfolio_images, portfolio_videos, is_verified, status,
  facebook_url, instagram_url, linkedin_url, website_url, qualifications,
  working_hours, category_id, created_at, updated_at,
  google_id, google_maps_url, google_rating, google_review_count,
  subscription_tier, display_priority, intervention_radius,
  latitude, longitude, phone, email, siret,
  user_id, profile_id, is_audited
FROM artisans
WHERE status IN ('active', 'prospect');