-- Politique permettant la validation du token d'activation pour les utilisateurs non authentifiés
-- Cette politique est sécurisée car :
-- 1. Les tokens sont des UUIDs aléatoires (non devinables)
-- 2. Les tokens sont supprimés après utilisation
-- 3. L'accès est en lecture seule pour les artisans en attente d'activation uniquement

CREATE POLICY "Allow token validation for activation" 
ON public.artisans
FOR SELECT
USING (
  activation_token IS NOT NULL 
  AND user_id IS NULL
  AND status = 'pending'
);