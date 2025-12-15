-- Fix infinite recursion on profiles RLS by using a SECURITY DEFINER helper

-- 1) Helper to get current user's profile id without triggering profiles RLS recursion
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.profiles
  WHERE user_id = auth.uid()
  LIMIT 1
$$;

-- 2) Replace the recursive policy
DROP POLICY IF EXISTS "Users can view conversation participant profiles" ON public.profiles;

CREATE POLICY "Users can view conversation participant profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR id IN (
    SELECT DISTINCT m.sender_id
    FROM public.messages m
    WHERE m.receiver_id = public.get_my_profile_id()

    UNION

    SELECT DISTINCT m.receiver_id
    FROM public.messages m
    WHERE m.sender_id = public.get_my_profile_id()
  )
);
