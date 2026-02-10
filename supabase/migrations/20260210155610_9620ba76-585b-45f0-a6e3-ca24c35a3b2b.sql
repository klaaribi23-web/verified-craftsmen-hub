-- Force PostgREST schema cache reload after recent column addition
NOTIFY pgrst, 'reload schema';

-- Also ensure authenticated role has proper grants on artisans table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.artisans TO authenticated;
GRANT SELECT ON public.categories TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;
