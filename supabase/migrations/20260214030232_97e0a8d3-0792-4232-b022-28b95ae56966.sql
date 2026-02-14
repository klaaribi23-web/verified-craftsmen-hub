
-- Fix 1: Recreate public_artisans view WITHOUT sensitive columns
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans
WITH (security_invoker = true, security_barrier = true)
AS
SELECT 
    id, slug, business_name, description, city, department, region,
    hourly_rate, experience_years,
    rating, review_count, missions_completed,
    photo_url, portfolio_images, portfolio_videos,
    is_verified, status,
    facebook_url, instagram_url, linkedin_url, website_url,
    qualifications, working_hours, category_id,
    created_at, updated_at, google_maps_url,
    google_rating, google_review_count, subscription_tier,
    display_priority, intervention_radius, latitude, longitude,
    is_audited, profile_id
FROM public.artisans
WHERE status = 'active'::artisan_status;

-- Fix 2: Drop the overly permissive public SELECT policy on artisans
DROP POLICY IF EXISTS "Public can view active artisans basic info" ON public.artisans;

-- Recreate with explicit denial note: public access goes through the view only
-- Authenticated non-admin, non-owner users can view active artisans (needed for search)
CREATE POLICY "Authenticated can view active artisans"
ON public.artisans
FOR SELECT
TO authenticated
USING (status = 'active'::artisan_status);

-- Anon users can also view active artisans (for public search page)
CREATE POLICY "Anon can view active artisans"
ON public.artisans
FOR SELECT
TO anon
USING (status = 'active'::artisan_status);
