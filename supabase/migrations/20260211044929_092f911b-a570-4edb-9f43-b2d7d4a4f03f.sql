
-- Grant anon SELECT on only safe artisans columns (needed for public_artisans view with security_invoker=on)
-- This ensures sensitive columns (email, phone, siret, insurance_number, stripe_customer_id, etc.) are NOT accessible to anonymous users
GRANT SELECT (
  id, business_name, category_id, city, description, display_priority,
  experience_years, google_maps_url, google_rating, google_review_count,
  hourly_rate, intervention_radius, is_audited, is_verified, latitude, longitude,
  missions_completed, photo_url, portfolio_images, portfolio_videos, postal_code,
  profile_id, qualifications, rating, region, review_count, slug, status,
  subscription_tier, updated_at, website_url, working_hours, address, department,
  created_at, facebook_url, instagram_url, linkedin_url, is_permanent
) ON public.artisans TO anon;

-- Drop the overly broad anon SELECT policy that would expose all columns
DROP POLICY IF EXISTS "Anon can read active artisans" ON public.artisans;

-- Recreate anon policy scoped to active/prospect artisans (now only safe columns visible due to column grants)
CREATE POLICY "Anon can read active artisans"
ON public.artisans FOR SELECT TO anon
USING (status = ANY (ARRAY['active'::artisan_status, 'prospect'::artisan_status]));

-- Also add authenticated SELECT for active artisans (for client users viewing artisan listings)
-- They need access to contact info (phone, email) for artisan public profiles
CREATE POLICY "Authenticated users can view active artisans"
ON public.artisans FOR SELECT TO authenticated
USING (status = ANY (ARRAY['active'::artisan_status, 'prospect'::artisan_status]));
