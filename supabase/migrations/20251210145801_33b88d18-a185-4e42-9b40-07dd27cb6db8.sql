-- Ajouter une colonne slug pour les URL lisibles
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Créer un index pour les recherches par slug
CREATE INDEX IF NOT EXISTS idx_artisans_slug ON public.artisans(slug);

-- Mettre à jour les slugs pour les artisans existants
UPDATE public.artisans SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(business_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;

-- Créer une fonction pour générer automatiquement le slug à l'insertion
CREATE OR REPLACE FUNCTION public.generate_artisan_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(REGEXP_REPLACE(REGEXP_REPLACE(NEW.business_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
    -- Ajouter un suffix unique si le slug existe déjà
    IF EXISTS (SELECT 1 FROM public.artisans WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug := NEW.slug || '-' || SUBSTRING(NEW.id::text, 1, 8);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Créer le trigger pour auto-générer le slug
DROP TRIGGER IF EXISTS generate_artisan_slug_trigger ON public.artisans;
CREATE TRIGGER generate_artisan_slug_trigger
  BEFORE INSERT OR UPDATE ON public.artisans
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_artisan_slug();

-- Mettre à jour la vue public_artisans pour inclure le slug
DROP VIEW IF EXISTS public_artisans;
CREATE VIEW public_artisans WITH (security_invoker = true) AS
SELECT 
  id,
  business_name,
  slug,
  description,
  city,
  department,
  region,
  address,
  postal_code,
  photo_url,
  portfolio_images,
  portfolio_videos,
  qualifications,
  website_url,
  facebook_url,
  instagram_url,
  linkedin_url,
  hourly_rate,
  experience_years,
  missions_completed,
  is_verified,
  status,
  availability,
  rating,
  review_count,
  created_at,
  updated_at,
  category_id
FROM public.artisans
WHERE status = 'active';