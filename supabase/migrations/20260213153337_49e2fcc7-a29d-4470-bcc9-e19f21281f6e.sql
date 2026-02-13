-- Update public_artisans view to include pending artisans (for preview links)
-- Public search queries already filter by status='active', so pending won't appear in search
CREATE OR REPLACE VIEW public.public_artisans
WITH (security_barrier = true, security_invoker = false)
AS
SELECT id, slug, business_name, description, city, department, region, address, postal_code,
  hourly_rate, experience_years, rating, review_count, missions_completed,
  photo_url, portfolio_images, portfolio_videos, is_verified, status,
  facebook_url, instagram_url, linkedin_url, website_url, qualifications,
  working_hours, category_id, created_at, updated_at, google_maps_url,
  google_rating, google_review_count, subscription_tier, display_priority,
  intervention_radius, latitude, longitude, is_audited, profile_id
FROM artisans
WHERE status = ANY (ARRAY['active'::artisan_status, 'prospect'::artisan_status, 'pending'::artisan_status]);