-- Add DELETE policy for clients on their own missions
CREATE POLICY "Clients can delete their own missions" 
ON public.missions 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = missions.client_id 
  AND profiles.user_id = auth.uid()
));

-- Add DELETE policy for mission_applications when mission is deleted
-- Clients who own the mission should be able to delete applications on it
CREATE POLICY "Clients can delete applications on their missions" 
ON public.mission_applications 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM missions m
  JOIN profiles p ON m.client_id = p.id
  WHERE m.id = mission_applications.mission_id 
  AND p.user_id = auth.uid()
));