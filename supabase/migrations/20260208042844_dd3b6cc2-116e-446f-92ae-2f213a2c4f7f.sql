
-- 1. Fix Security Definer View: recreate public_artisans with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_artisans;
CREATE VIEW public.public_artisans WITH (security_invoker = true) AS
SELECT
  id, business_name, category_id, city, description, display_priority,
  email, experience_years, facebook_url, google_id, google_maps_url,
  google_rating, google_review_count, hourly_rate, instagram_url,
  intervention_radius, is_audited, is_verified, latitude, linkedin_url,
  longitude, missions_completed, phone, photo_url, portfolio_images,
  portfolio_videos, postal_code, profile_id, qualifications, rating,
  region, review_count, siret, slug, status, subscription_tier,
  updated_at, user_id, website_url, working_hours, address, department, created_at
FROM public.artisans
WHERE status IN ('active', 'prospect');

-- 2. Fix Extension in Public: move pg_trgm to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm' AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;
END $$;

-- 3. Fix RLS Always True on partner_candidacies INSERT
DROP POLICY IF EXISTS "Anyone can submit a candidacy" ON public.partner_candidacies;
CREATE POLICY "Anyone can submit a candidacy"
  ON public.partner_candidacies
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM public.partner_candidacies pc WHERE pc.siret = siret AND pc.created_at > now() - interval '24 hours') < 3
  );

-- 4. Fix RLS Always True on project_requests INSERT
DROP POLICY IF EXISTS "Anyone can submit a project request" ON public.project_requests;
CREATE POLICY "Anyone can submit a project request"
  ON public.project_requests
  FOR INSERT
  WITH CHECK (
    (SELECT COUNT(*) FROM public.project_requests pr WHERE pr.artisan_id = artisan_id AND pr.client_phone = client_phone AND pr.created_at > now() - interval '24 hours') < 5
  );
