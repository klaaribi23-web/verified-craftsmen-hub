-- Allow public to view active artisans (non-sensitive data is filtered via the view)
CREATE POLICY "Public can view active artisans"
ON public.artisans
FOR SELECT
USING (status = 'active'::artisan_status);