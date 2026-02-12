
-- The "Admins can manage all artisans" ALL policy is RESTRICTIVE which conflicts
-- Drop and recreate it as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage all artisans" ON public.artisans;

CREATE POLICY "Admins can manage all artisans"
  ON public.artisans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix other potentially RESTRICTIVE policies
DROP POLICY IF EXISTS "Artisans can insert their own profile" ON public.artisans;
CREATE POLICY "Artisans can insert their own profile"
  ON public.artisans FOR INSERT
  WITH CHECK ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Artisans can update their own profile" ON public.artisans;
CREATE POLICY "Artisans can update their own profile"
  ON public.artisans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    CASE
      WHEN (status = 'pending'::artisan_status) THEN (count_mandatory_documents(id) >= 3)
      ELSE true
    END
  );

DROP POLICY IF EXISTS "Allow linking artisan during activation" ON public.artisans;
CREATE POLICY "Allow linking artisan during activation"
  ON public.artisans FOR UPDATE
  USING ((activation_token IS NOT NULL) AND (user_id IS NULL) AND (status = 'pending'::artisan_status))
  WITH CHECK ((activation_token IS NULL) AND (user_id IS NOT NULL));

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
