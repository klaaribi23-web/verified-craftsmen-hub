-- 1. Policy SELECT : Permettre la lecture d'un profile par confirmation_token pour anonymous
-- Conditions strictes : token existe, email non confirmé
CREATE POLICY "Allow token validation for email confirmation"
ON public.profiles
FOR SELECT
TO public
USING (
  confirmation_token IS NOT NULL 
  AND email_confirmed = false
);

-- 2. Policy UPDATE : Permettre la mise à jour pour confirmer l'email
-- Conditions strictes sur USING et WITH CHECK
CREATE POLICY "Allow email confirmation via token"
ON public.profiles
FOR UPDATE
TO public
USING (
  confirmation_token IS NOT NULL 
  AND email_confirmed = false
)
WITH CHECK (
  confirmation_token IS NULL 
  AND email_confirmed = true
);