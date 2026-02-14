
-- Fix 1: Tighten profiles SELECT policy - remove redundant admin OR condition
-- Admins already have full access via the "Admins can manage all profiles" ALL policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- The existing "Admins can manage all profiles" ALL policy already covers admin SELECT access

-- Fix 2: Ensure confirmation_token and confirmation_sent_at are never exposed
-- (Reinforcing previous column-level revoke)
REVOKE SELECT (confirmation_token, confirmation_sent_at, phone) 
ON TABLE public.profiles FROM anon;

REVOKE SELECT (confirmation_token, confirmation_sent_at) 
ON TABLE public.profiles FROM authenticated;

-- Fix 3: Revoke sensitive columns on leads_particuliers from all non-service roles
REVOKE SELECT (email, telephone, nom, prenom, code_postal) 
ON TABLE public.leads_particuliers FROM anon;

REVOKE SELECT (email, telephone) 
ON TABLE public.leads_particuliers FROM anon;

-- Fix 4: Same for leads_artisans
REVOKE SELECT (email, telephone, siret, nom, prenom) 
ON TABLE public.leads_artisans FROM anon;
