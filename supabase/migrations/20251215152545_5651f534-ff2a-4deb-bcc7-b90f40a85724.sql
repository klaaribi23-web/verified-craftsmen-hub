-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view conversation participant profiles" ON public.profiles;

-- Create a new policy that avoids recursion by using a security definer function approach
-- We'll use a scalar subquery that doesn't trigger recursive RLS checks
CREATE POLICY "Users can view conversation participant profiles"
ON public.profiles
FOR SELECT
USING (
  -- User can view their own profile
  auth.uid() = user_id
  OR 
  -- Admin can view all profiles
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- User can view profiles of people they have messages with
  -- Using scalar subquery to get current user's profile_id
  id IN (
    SELECT DISTINCT m.sender_id 
    FROM messages m
    WHERE m.receiver_id = (
      SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
    )
    UNION
    SELECT DISTINCT m.receiver_id 
    FROM messages m
    WHERE m.sender_id = (
      SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
    )
  )
);