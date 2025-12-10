-- Allow authenticated users to insert notifications for themselves
-- This enables the quote notification system to work for regular users
CREATE POLICY "Users can receive notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);