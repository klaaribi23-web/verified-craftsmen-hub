
-- ============================================================
-- FIX: Verrouiller la table artisans - accès direct réservé
-- aux propriétaires et admins uniquement.
-- Tout accès public passe par la vue public_artisans.
-- ============================================================

-- 1. Supprimer les politiques SELECT trop permissives
DROP POLICY IF EXISTS "Anon can read active artisans" ON public.artisans;
DROP POLICY IF EXISTS "Authenticated users can view active artisans" ON public.artisans;

-- 2. Révoquer l'accès direct anon à la table artisans
REVOKE ALL ON public.artisans FROM anon;

-- 3. Recréer la vue public_artisans en mode DEFINER (sans security_invoker)
--    pour qu'elle fonctionne malgré les restrictions RLS sur la table de base.
--    security_barrier empêche les attaques par predicate pushdown.
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans
WITH (security_barrier = true) AS
SELECT 
  id, slug, business_name, description, city, department, region, 
  address, postal_code, hourly_rate, experience_years, rating, 
  review_count, missions_completed, photo_url, portfolio_images, 
  portfolio_videos, is_verified, status, facebook_url, instagram_url, 
  linkedin_url, website_url, qualifications, working_hours, 
  category_id, created_at, updated_at, google_maps_url, google_rating, 
  google_review_count, subscription_tier, display_priority, 
  intervention_radius, latitude, longitude, is_audited, profile_id
FROM public.artisans
WHERE status IN ('active'::artisan_status, 'prospect'::artisan_status);

-- 4. Accorder SELECT sur la vue aux rôles anon et authenticated
GRANT SELECT ON public.public_artisans TO anon, authenticated;

-- 5. Recharger le cache PostgREST
NOTIFY pgrst, 'reload schema';
