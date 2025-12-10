-- Drop the public SELECT policy on demo_profiles to prevent PII exposure
-- This table contains email and phone data that should not be publicly accessible
DROP POLICY IF EXISTS "Demo profiles are viewable by everyone" ON public.demo_profiles;