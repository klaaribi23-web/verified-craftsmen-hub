
-- 1. FIX: missions table - restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Missions are viewable by everyone" ON public.missions;
CREATE POLICY "Missions are viewable by authenticated users"
ON public.missions
FOR SELECT
TO authenticated
USING (true);

-- 2. FIX: partner_candidacies rate limit bug (pc.siret = pc.siret is always true)
DROP POLICY IF EXISTS "Anyone can submit a candidacy" ON public.partner_candidacies;
CREATE POLICY "Anyone can submit a candidacy with rate limit"
ON public.partner_candidacies
FOR INSERT
WITH CHECK (
  (SELECT count(*) FROM partner_candidacies pc
   WHERE pc.siret = partner_candidacies.siret
   AND pc.created_at > (now() - interval '24 hours')) < 3
);
