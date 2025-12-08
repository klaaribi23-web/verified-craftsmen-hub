-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Créer une nouvelle politique : les utilisateurs ne voient que leur propre profil
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role)
);
