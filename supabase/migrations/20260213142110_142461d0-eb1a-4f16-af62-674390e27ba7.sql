
-- Fix leads_particuliers: restrict INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert leads_particuliers" ON public.leads_particuliers;
CREATE POLICY "Service role can insert leads_particuliers"
ON public.leads_particuliers
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Fix leads_artisans: restrict INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert leads_artisans" ON public.leads_artisans;
CREATE POLICY "Service role can insert leads_artisans"
ON public.leads_artisans
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Fix expert_calls: restrict INSERT to service_role only
DROP POLICY IF EXISTS "Service role can insert expert_calls" ON public.expert_calls;
CREATE POLICY "Service role can insert expert_calls"
ON public.expert_calls
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Fix login_attempts: remove the overly permissive INSERT policy
DROP POLICY IF EXISTS "Only service role can insert login attempts" ON public.login_attempts;
