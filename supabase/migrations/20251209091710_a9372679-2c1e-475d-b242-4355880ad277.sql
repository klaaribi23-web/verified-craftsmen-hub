-- Fix: Restrict notifications INSERT policy to admins only
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Only admins can create notifications
CREATE POLICY "Admins can create notifications" ON public.notifications
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));