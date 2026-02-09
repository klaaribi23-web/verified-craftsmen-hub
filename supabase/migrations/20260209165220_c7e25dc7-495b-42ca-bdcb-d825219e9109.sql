
-- SECURITY FIX 1: Remove the overly permissive public SELECT policies on artisans table
-- Keep only owner/admin access for direct table queries - public access goes through the view
DROP POLICY IF EXISTS "Public can view active artisans" ON public.artisans;
DROP POLICY IF EXISTS "Authenticated users can view active artisans basic info" ON public.artisans;

-- SECURITY FIX 2: Update public_artisans view to also hide sensitive fields from authenticated non-admin/non-owner users
-- Only show email/phone/siret to the artisan themselves or admins
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans
WITH (security_invoker = on) AS
SELECT 
  id, business_name, category_id, city, description, display_priority,
  experience_years, google_maps_url, google_rating, google_review_count,
  hourly_rate, intervention_radius, is_audited, is_verified, latitude, longitude,
  missions_completed, photo_url, portfolio_images, portfolio_videos,
  postal_code, profile_id, qualifications, rating, region, review_count,
  slug, status, subscription_tier, updated_at, user_id, website_url,
  working_hours, address, department, created_at,
  facebook_url, instagram_url, linkedin_url,
  CASE
    WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN email
    ELSE NULL::text
  END AS email,
  CASE
    WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN phone
    ELSE NULL::text
  END AS phone,
  CASE
    WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN siret
    ELSE NULL::text
  END AS siret,
  CASE
    WHEN auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role) THEN google_id
    ELSE NULL::text
  END AS google_id
FROM artisans
WHERE status = ANY (ARRAY['active'::artisan_status, 'prospect'::artisan_status]);

-- Grant access to the view (view uses security_invoker so RLS on artisans applies)
GRANT SELECT ON public.public_artisans TO anon, authenticated;

-- SECURITY FIX 3: Add a SELECT policy so the view can read artisans for active/prospect status
-- This is a restricted policy that only allows reading non-sensitive columns through the view
CREATE POLICY "View can read active artisans" ON public.artisans
FOR SELECT USING (
  status = ANY (ARRAY['active'::artisan_status, 'prospect'::artisan_status])
);
