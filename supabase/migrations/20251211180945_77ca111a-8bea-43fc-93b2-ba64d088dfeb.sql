-- Create junction table for artisan multiple categories
CREATE TABLE IF NOT EXISTS public.artisan_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artisan_id, category_id)
);

-- Enable RLS
ALTER TABLE public.artisan_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Artisan categories are viewable by everyone" ON public.artisan_categories
FOR SELECT USING (true);

CREATE POLICY "Admins can manage artisan categories" ON public.artisan_categories
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Artisans can manage their own categories" ON public.artisan_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM artisans
    WHERE artisans.id = artisan_categories.artisan_id
    AND artisans.user_id = auth.uid()
  )
);

-- Migrate existing category_id data to the junction table
INSERT INTO public.artisan_categories (artisan_id, category_id)
SELECT id, category_id FROM public.artisans 
WHERE category_id IS NOT NULL
ON CONFLICT (artisan_id, category_id) DO NOTHING;

-- Fix slugs that look like UUIDs (36 characters with hyphens in specific positions)
UPDATE public.artisans
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL 
   OR slug = '' 
   OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Handle duplicate slugs by adding a unique suffix
WITH duplicates AS (
  SELECT id, slug, 
         ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) as rn
  FROM public.artisans
  WHERE slug IS NOT NULL
)
UPDATE public.artisans a
SET slug = a.slug || '-' || SUBSTRING(a.id::text, 1, 8)
FROM duplicates d
WHERE a.id = d.id AND d.rn > 1;

-- Update the generate_artisan_slug function to handle missing business_name
CREATE OR REPLACE FUNCTION public.generate_artisan_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate slug from business_name if available, otherwise use temporary slug
  IF NEW.business_name IS NOT NULL AND NEW.business_name != '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.business_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  ELSE
    NEW.slug := 'artisan-a-completer-' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  
  -- Add unique suffix if slug already exists
  IF EXISTS (SELECT 1 FROM public.artisans WHERE slug = NEW.slug AND id != NEW.id) THEN
    NEW.slug := NEW.slug || '-' || SUBSTRING(NEW.id::text, 1, 8);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Make sure trigger exists
DROP TRIGGER IF EXISTS generate_artisan_slug_trigger ON public.artisans;
CREATE TRIGGER generate_artisan_slug_trigger
BEFORE INSERT OR UPDATE OF business_name ON public.artisans
FOR EACH ROW
EXECUTE FUNCTION public.generate_artisan_slug();