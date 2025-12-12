-- Add RLS UPDATE policy on messages table to allow users to mark messages as read
CREATE POLICY "Users can update messages they received" 
ON public.messages
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = messages.receiver_id 
    AND profiles.user_id = auth.uid()
  )
);