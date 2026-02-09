
-- =============================================================
-- FIX 1: Security Definer View → Security Invoker + column grants
-- =============================================================

-- Drop the current security definer view
DROP VIEW IF EXISTS public.public_artisans;

-- Revoke any broad SELECT from anon on artisans table
REVOKE SELECT ON public.artisans FROM anon;

-- Grant SELECT only on SAFE columns to anon (no email, phone, siret, etc.)
GRANT SELECT (
  id, business_name, category_id, city, description,
  display_priority, experience_years, google_maps_url,
  google_rating, google_review_count, hourly_rate,
  intervention_radius, is_audited, is_verified,
  latitude, longitude, missions_completed, photo_url,
  portfolio_images, portfolio_videos, postal_code,
  profile_id, qualifications, rating, region,
  review_count, slug, status, subscription_tier,
  updated_at, website_url, working_hours, address,
  department, created_at, facebook_url, instagram_url,
  linkedin_url
) ON public.artisans TO anon;

-- Grant SELECT only on SAFE columns to authenticated too
GRANT SELECT (
  id, business_name, category_id, city, description,
  display_priority, experience_years, google_maps_url,
  google_rating, google_review_count, hourly_rate,
  intervention_radius, is_audited, is_verified,
  latitude, longitude, missions_completed, photo_url,
  portfolio_images, portfolio_videos, postal_code,
  profile_id, qualifications, rating, region,
  review_count, slug, status, subscription_tier,
  updated_at, website_url, working_hours, address,
  department, created_at, facebook_url, instagram_url,
  linkedin_url
) ON public.artisans TO authenticated;

-- Add RLS policy for anon to read active/prospect artisans (row-level)
DROP POLICY IF EXISTS "Anon can read active artisans" ON public.artisans;
CREATE POLICY "Anon can read active artisans"
  ON public.artisans FOR SELECT TO anon
  USING (status IN ('active', 'prospect'));

-- Recreate view WITH security_invoker = on (no longer security definer)
CREATE VIEW public.public_artisans
WITH (security_invoker = on) AS
SELECT 
  id, business_name, category_id, city, description,
  display_priority, experience_years, google_maps_url,
  google_rating, google_review_count, hourly_rate,
  intervention_radius, is_audited, is_verified,
  latitude, longitude, missions_completed, photo_url,
  portfolio_images, portfolio_videos, postal_code,
  profile_id, qualifications, rating, region,
  review_count, slug, status, subscription_tier,
  updated_at, website_url, working_hours, address,
  department, created_at, facebook_url, instagram_url,
  linkedin_url
FROM artisans
WHERE status IN ('active', 'prospect');

-- Grant SELECT on the view
GRANT SELECT ON public.public_artisans TO anon, authenticated;

-- =============================================================
-- FIX 2: login_attempts - restrict INSERT to service_role only
-- =============================================================
DROP POLICY IF EXISTS "Allow insert for login tracking" ON public.login_attempts;
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
DROP POLICY IF EXISTS "Allow unauthenticated inserts" ON public.login_attempts;

-- Only service_role (edge functions) can insert login attempts
-- No direct client-side inserts allowed
CREATE POLICY "Only service role can insert login attempts"
  ON public.login_attempts FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =============================================================
-- FIX 3: expert_calls - add auto-cleanup for old data (GDPR)
-- =============================================================
CREATE OR REPLACE FUNCTION public.cleanup_old_expert_calls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Anonymize personal data after 12 months (GDPR compliance)
  UPDATE public.expert_calls
  SET 
    nom = 'ANONYMISÉ',
    prenom = 'ANONYMISÉ', 
    email = NULL,
    telephone = NULL,
    code_postal = NULL,
    ville = NULL
  WHERE created_at < now() - interval '12 months'
    AND nom != 'ANONYMISÉ';
    
  -- Also anonymize leads_particuliers
  UPDATE public.leads_particuliers
  SET
    nom = 'ANONYMISÉ',
    prenom = 'ANONYMISÉ',
    email = NULL,
    telephone = NULL,
    code_postal = NULL,
    ville = NULL
  WHERE created_at < now() - interval '12 months'
    AND nom != 'ANONYMISÉ';
    
  -- Also anonymize leads_artisans
  UPDATE public.leads_artisans
  SET
    nom = 'ANONYMISÉ',
    prenom = 'ANONYMISÉ',
    email = NULL,
    telephone = NULL,
    code_postal = NULL,
    ville = NULL,
    siret = NULL
  WHERE created_at < now() - interval '12 months'
    AND nom != 'ANONYMISÉ';
END;
$$;
