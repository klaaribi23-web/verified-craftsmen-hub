
-- Restore base table permissions for artisans
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artisans TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artisans TO authenticated;

-- Also verify other critical tables have grants
GRANT SELECT ON public.categories TO anon;
GRANT SELECT ON public.categories TO authenticated;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
