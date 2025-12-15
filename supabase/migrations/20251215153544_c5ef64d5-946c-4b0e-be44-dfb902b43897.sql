-- Fix: Remove the conversation participant check from profiles RLS entirely
-- This prevents infinite recursion since Postgres evaluates all OR conditions

-- Drop ALL problematic SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view conversation participant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a single, simple SELECT policy that doesn't cause recursion
CREATE POLICY "Users can view profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Create a SECURITY DEFINER function to get conversation participant profiles
-- This will be used by the messaging hooks to bypass RLS for fetching participant names
CREATE OR REPLACE FUNCTION public.get_conversation_participants(p_profile_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT p.id, p.first_name, p.last_name, p.avatar_url, p.email
  FROM profiles p
  WHERE p.id IN (
    SELECT DISTINCT m.sender_id FROM messages m WHERE m.receiver_id = p_profile_id
    UNION
    SELECT DISTINCT m.receiver_id FROM messages m WHERE m.sender_id = p_profile_id
  )
$$;