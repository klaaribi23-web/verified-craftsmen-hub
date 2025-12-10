-- Fix: Recreate public_artisans view with security_invoker = false
-- This allows anonymous users to see active artisans while sensitive fields remain hidden

DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans
WITH (security_invoker = false)
AS SELECT 
  id, business_name, description, photo_url, address, postal_code,
  city, department, region, category_id, rating, review_count,
  qualifications, experience_years, hourly_rate, missions_completed,
  availability, is_verified, status, portfolio_images, portfolio_videos,
  facebook_url, instagram_url, linkedin_url, website_url, created_at, updated_at
FROM artisans
WHERE status = 'active';

-- Grant SELECT to both anonymous and authenticated users
GRANT SELECT ON public.public_artisans TO anon, authenticated;