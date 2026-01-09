-- Update the INSERT policy to only allow clients to create recommendations
DROP POLICY IF EXISTS "Clients can create recommendations" ON recommendations;

CREATE POLICY "Only clients can create recommendations" 
ON recommendations 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND client_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  AND public.has_role(auth.uid(), 'client')
  AND NOT public.has_role(auth.uid(), 'admin')
  AND NOT public.has_role(auth.uid(), 'artisan')
);