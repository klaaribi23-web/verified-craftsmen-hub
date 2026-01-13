-- Politique pour permettre la mise à jour de l'artisan lors de l'activation
-- Condition: le token existe, user_id est NULL, et status est pending
CREATE POLICY "Allow linking artisan during activation" 
ON public.artisans
FOR UPDATE
USING (
  activation_token IS NOT NULL 
  AND user_id IS NULL
  AND status = 'pending'::artisan_status
)
WITH CHECK (
  activation_token IS NULL
  AND user_id IS NOT NULL
);

-- Politique pour permettre à un utilisateur de s'assigner le rôle artisan
-- Seulement si un artisan avec son user_id existe déjà
CREATE POLICY "Allow artisan role assignment during activation" 
ON public.user_roles
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND role = 'artisan'::app_role
  AND EXISTS (
    SELECT 1 FROM public.artisans WHERE artisans.user_id = auth.uid()
  )
);

-- Politique pour permettre à un utilisateur de supprimer son propre rôle
CREATE POLICY "Allow role deletion for self during activation"
ON public.user_roles
FOR DELETE
USING (
  user_id = auth.uid()
);