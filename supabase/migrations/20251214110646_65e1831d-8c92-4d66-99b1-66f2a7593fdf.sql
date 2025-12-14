-- Add phone column to artisans table
ALTER TABLE public.artisans 
ADD COLUMN phone text;

COMMENT ON COLUMN public.artisans.phone IS 'Numéro de téléphone professionnel de l''artisan';