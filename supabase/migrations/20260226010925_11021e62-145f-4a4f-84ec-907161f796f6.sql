
-- Table des villes SEO
CREATE TABLE public.seo_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  department text,
  region text,
  latitude float8,
  longitude float8,
  population integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table des métiers SEO
CREATE TABLE public.seo_metiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category_name text,
  is_rge_eligible boolean NOT NULL DEFAULT false,
  meta_description_template text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS: lecture publique pour les deux tables
ALTER TABLE public.seo_cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_metiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SEO cities are viewable by everyone" ON public.seo_cities FOR SELECT USING (true);
CREATE POLICY "Admins can manage seo_cities" ON public.seo_cities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "SEO metiers are viewable by everyone" ON public.seo_metiers FOR SELECT USING (true);
CREATE POLICY "Admins can manage seo_metiers" ON public.seo_metiers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
