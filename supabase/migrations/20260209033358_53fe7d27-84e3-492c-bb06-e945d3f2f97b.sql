
-- Table for individual/homeowner leads collected by Andrea
CREATE TABLE public.leads_particuliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT,
  prenom TEXT,
  telephone TEXT,
  email TEXT,
  ville TEXT,
  code_postal TEXT,
  type_projet TEXT,
  description_projet TEXT,
  budget_estime TEXT,
  delai TEXT,
  source_page TEXT,
  conversation_id TEXT,
  status TEXT NOT NULL DEFAULT 'nouveau',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for artisan leads collected by Andrea
CREATE TABLE public.leads_artisans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT,
  prenom TEXT,
  societe TEXT,
  telephone TEXT,
  email TEXT,
  ville TEXT,
  code_postal TEXT,
  departement TEXT,
  metier TEXT,
  specialites TEXT,
  annees_existence INTEGER,
  nombre_salaries TEXT,
  siret TEXT,
  a_assurance BOOLEAN,
  chiffre_affaires TEXT,
  source_page TEXT,
  conversation_id TEXT,
  status TEXT NOT NULL DEFAULT 'nouveau',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads_particuliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads_artisans ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage all leads_particuliers"
ON public.leads_particuliers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all leads_artisans"
ON public.leads_artisans FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Edge functions (service role) can insert
CREATE POLICY "Service role can insert leads_particuliers"
ON public.leads_particuliers FOR INSERT
WITH CHECK (auth.role() = 'service_role'::text);

CREATE POLICY "Service role can insert leads_artisans"
ON public.leads_artisans FOR INSERT
WITH CHECK (auth.role() = 'service_role'::text);

-- Timestamps trigger
CREATE TRIGGER update_leads_particuliers_updated_at
BEFORE UPDATE ON public.leads_particuliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_artisans_updated_at
BEFORE UPDATE ON public.leads_artisans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
