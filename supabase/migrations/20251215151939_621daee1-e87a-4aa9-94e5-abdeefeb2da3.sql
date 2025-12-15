-- Politique: Les utilisateurs peuvent voir les profils des participants à leurs conversations
CREATE POLICY "Users can view conversation participant profiles"
ON public.profiles
FOR SELECT
USING (
  -- L'utilisateur voit son propre profil
  auth.uid() = user_id
  OR 
  -- Admin voit tout
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- L'utilisateur voit les profils des personnes avec qui il a des messages
  id IN (
    SELECT DISTINCT m.sender_id FROM messages m
    JOIN profiles p ON p.id = m.receiver_id
    WHERE p.user_id = auth.uid()
    UNION
    SELECT DISTINCT m.receiver_id FROM messages m
    JOIN profiles p ON p.id = m.sender_id
    WHERE p.user_id = auth.uid()
  )
);