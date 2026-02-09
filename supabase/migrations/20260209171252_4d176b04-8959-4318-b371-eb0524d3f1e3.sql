
-- 1. Remove the overly permissive public SELECT on artisans table
DROP POLICY IF EXISTS "Public can read active artisans via view" ON public.artisans;

-- 2. Recreate the view as SECURITY DEFINER (not invoker) so it doesn't need
-- the caller to have direct table access. The view itself limits columns.
DROP VIEW IF EXISTS public.public_artisans;

-- Create a security definer function that returns public artisan data
-- This bypasses RLS on artisans table but only returns safe columns
CREATE OR REPLACE FUNCTION public.get_public_artisans()
RETURNS TABLE (
  id uuid,
  business_name text,
  category_id uuid,
  city text,
  description text,
  display_priority integer,
  experience_years integer,
  google_maps_url text,
  google_rating numeric,
  google_review_count integer,
  hourly_rate numeric,
  intervention_radius integer,
  is_audited boolean,
  is_verified boolean,
  latitude numeric,
  longitude numeric,
  missions_completed integer,
  photo_url text,
  portfolio_images text[],
  portfolio_videos text[],
  postal_code text,
  profile_id uuid,
  qualifications text[],
  rating numeric,
  region text,
  review_count integer,
  slug text,
  status artisan_status,
  subscription_tier text,
  updated_at timestamptz,
  website_url text,
  working_hours jsonb,
  address text,
  department text,
  created_at timestamptz,
  facebook_url text,
  instagram_url text,
  linkedin_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id, a.business_name, a.category_id, a.city, a.description,
    a.display_priority, a.experience_years, a.google_maps_url,
    a.google_rating, a.google_review_count, a.hourly_rate,
    a.intervention_radius, a.is_audited, a.is_verified,
    a.latitude, a.longitude, a.missions_completed, a.photo_url,
    a.portfolio_images, a.portfolio_videos, a.postal_code,
    a.profile_id, a.qualifications, a.rating, a.region,
    a.review_count, a.slug, a.status, a.subscription_tier,
    a.updated_at, a.website_url, a.working_hours, a.address,
    a.department, a.created_at, a.facebook_url, a.instagram_url,
    a.linkedin_url
  FROM artisans a
  WHERE a.status IN ('active', 'prospect');
$$;

-- Recreate the view using the function (no security_invoker needed)
CREATE VIEW public.public_artisans AS
SELECT * FROM public.get_public_artisans();

-- 3. Fix user_devices broken service_role policy
DROP POLICY IF EXISTS "Service role access" ON public.user_devices;
CREATE POLICY "Service role can manage devices"
ON public.user_devices
FOR ALL
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);
