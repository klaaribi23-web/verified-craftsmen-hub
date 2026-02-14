
-- Step 1: Drop direct anon/authenticated SELECT policies on artisans
-- Public access will ONLY go through the secure view
DROP POLICY IF EXISTS "Anon can view active artisans" ON public.artisans;
DROP POLICY IF EXISTS "Authenticated can view active artisans" ON public.artisans;

-- Step 2: Recreate the view WITHOUT security_invoker
-- Default behavior = security definer = runs as view owner (bypasses RLS)
-- This means we don't need anon policies on the base table at all
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans AS
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

-- Step 3: Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_artisans TO anon;
GRANT SELECT ON public.public_artisans TO authenticated;

-- Step 4: Ensure artisans table only allows owner/admin SELECT
-- (existing policies: "Admins can view all artisans" and "Artisans can view own record" remain)

-- Step 5: Fix project_requests - ensure only target artisan + admin can SELECT
-- Already has correct policies, but let's verify no public SELECT exists
-- The existing policies are: admin ALL, artisan view own, anyone INSERT with rate limit
-- This is correct - no anonymous SELECT.

-- Step 6: Fix partner_candidacies - already admin-only SELECT (via ALL policy)
-- The INSERT policy for public is correct with rate limiting
-- No additional changes needed.
