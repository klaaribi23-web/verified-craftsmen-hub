-- Fix RLS policy for notifications to allow users to send notifications to others
DROP POLICY IF EXISTS "Users can receive notifications" ON public.notifications;

-- Allow authenticated users to create notifications for any user (needed for message notifications)
CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications 
FOR INSERT 
TO authenticated
WITH CHECK (true);