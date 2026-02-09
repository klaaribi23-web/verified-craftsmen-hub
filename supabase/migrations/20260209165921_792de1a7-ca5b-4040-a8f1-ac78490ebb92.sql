
-- 1. ARTISANS TABLE: Remove any overly permissive public SELECT policies
-- First, drop all existing SELECT policies on artisans to start clean
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'artisans' AND schemaname = 'public' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.artisans', pol.policyname);
  END LOOP;
END $$;

-- Artisans can view their own record
CREATE POLICY "Artisans can view own record"
ON public.artisans
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins can view all artisans
CREATE POLICY "Admins can view all artisans"
ON public.artisans
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. DEMO_MISSIONS TABLE: Restrict public access
ALTER TABLE public.demo_missions ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'demo_missions' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.demo_missions', pol.policyname);
  END LOOP;
END $$;

-- Only admins can read demo_missions
CREATE POLICY "Only admins can read demo missions"
ON public.demo_missions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can manage demo_missions
CREATE POLICY "Only admins can manage demo missions"
ON public.demo_missions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. DEMO_PROFILES TABLE: Same treatment
ALTER TABLE public.demo_profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'demo_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.demo_profiles', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Only admins can access demo profiles"
ON public.demo_profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
