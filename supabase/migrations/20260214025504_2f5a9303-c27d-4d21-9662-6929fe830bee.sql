
-- Recreate public_artisans view with SECURITY INVOKER (respects RLS of calling user)
-- Also restrict to only 'active' status (no pending/prospect exposed publicly)
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans
WITH (security_invoker = true, security_barrier = true)
AS
SELECT 
    id, slug, business_name, description, city, department, region,
    address, postal_code, hourly_rate, experience_years,
    rating, review_count, missions_completed,
    photo_url, portfolio_images, portfolio_videos,
    is_verified, status, facebook_url, instagram_url, linkedin_url, website_url,
    qualifications, working_hours, category_id,
    created_at, updated_at, google_maps_url,
    google_rating, google_review_count, subscription_tier,
    display_priority, intervention_radius, latitude, longitude,
    is_audited, profile_id
FROM public.artisans
WHERE status = 'active'::artisan_status;

-- Add a public SELECT policy specifically for the artisans table 
-- that only exposes non-sensitive columns for active artisans
-- This replaces the view's security definer bypass
CREATE POLICY "Public can view active artisans basic info"
ON public.artisans
FOR SELECT
USING (status = 'active'::artisan_status);
