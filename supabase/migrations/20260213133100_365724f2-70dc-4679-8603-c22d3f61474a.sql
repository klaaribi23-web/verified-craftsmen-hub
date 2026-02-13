
-- Fix leads_particuliers: drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage all leads_particuliers" ON public.leads_particuliers;
DROP POLICY IF EXISTS "Service role can insert leads_particuliers" ON public.leads_particuliers;

CREATE POLICY "Admins can manage all leads_particuliers"
ON public.leads_particuliers FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert leads_particuliers"
ON public.leads_particuliers FOR INSERT
WITH CHECK (true);

-- Fix leads_artisans: drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage all leads_artisans" ON public.leads_artisans;
DROP POLICY IF EXISTS "Service role can insert leads_artisans" ON public.leads_artisans;

CREATE POLICY "Admins can manage all leads_artisans"
ON public.leads_artisans FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert leads_artisans"
ON public.leads_artisans FOR INSERT
WITH CHECK (true);

-- Fix expert_calls: drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage all expert_calls" ON public.expert_calls;
DROP POLICY IF EXISTS "Service role can insert expert_calls" ON public.expert_calls;

CREATE POLICY "Admins can manage all expert_calls"
ON public.expert_calls FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert expert_calls"
ON public.expert_calls FOR INSERT
WITH CHECK (true);

-- Fix partner_candidacies: drop RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage all candidacies" ON public.partner_candidacies;
DROP POLICY IF EXISTS "Anyone can submit a candidacy with rate limit" ON public.partner_candidacies;

CREATE POLICY "Admins can manage all candidacies"
ON public.partner_candidacies FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can submit a candidacy with rate limit"
ON public.partner_candidacies FOR INSERT
WITH CHECK (
  (SELECT count(*) FROM partner_candidacies pc
   WHERE pc.siret = partner_candidacies.siret
   AND pc.created_at > now() - interval '24 hours') < 3
);

-- Reload PostgREST cache
NOTIFY pgrst, 'reload schema';
