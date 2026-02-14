
-- Update public_artisans view to include ALL statuses
-- Status filtering is done at the query level, not the view level
-- This allows preview mode and admin features to work properly
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
WHERE status IN ('active'::artisan_status, 'prospect'::artisan_status, 'pending'::artisan_status);

-- Grant SELECT on the view to anon and authenticated
GRANT SELECT ON public.public_artisans TO anon;
GRANT SELECT ON public.public_artisans TO authenticated;
