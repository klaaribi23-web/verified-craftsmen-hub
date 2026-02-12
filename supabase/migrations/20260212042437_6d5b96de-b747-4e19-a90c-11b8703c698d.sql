
-- Fix: All SELECT policies on artisans are RESTRICTIVE, which means NO rows are returned
-- because PostgreSQL requires at least one PERMISSIVE policy to pass.
-- We need to recreate them as PERMISSIVE (default).

-- Drop the broken RESTRICTIVE SELECT policies
DROP POLICY IF EXISTS "Admins can view all artisans" ON public.artisans;
DROP POLICY IF EXISTS "Anon can read active artisans" ON public.artisans;
DROP POLICY IF EXISTS "Authenticated users can view active artisans" ON public.artisans;
DROP POLICY IF EXISTS "Artisans can view own record" ON public.artisans;

-- Recreate as PERMISSIVE (default) so any matching policy grants access
CREATE POLICY "Admins can view all artisans"
  ON public.artisans FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can read active artisans"
  ON public.artisans FOR SELECT
  TO anon
  USING (status IN ('active'::artisan_status, 'prospect'::artisan_status));

CREATE POLICY "Authenticated users can view active artisans"
  ON public.artisans FOR SELECT
  TO authenticated
  USING (status IN ('active'::artisan_status, 'prospect'::artisan_status));

CREATE POLICY "Artisans can view own record"
  ON public.artisans FOR SELECT
  USING (user_id = auth.uid());
