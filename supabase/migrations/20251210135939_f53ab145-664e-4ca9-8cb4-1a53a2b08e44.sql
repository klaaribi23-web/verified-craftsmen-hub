-- Drop the policy that allows public access to raw artisans table
-- This prevents exposure of sensitive data (siret, insurance_number) via direct API queries
-- All public access should go through the secure public_artisans view
DROP POLICY IF EXISTS "Public can view active artisans basic info" ON public.artisans;