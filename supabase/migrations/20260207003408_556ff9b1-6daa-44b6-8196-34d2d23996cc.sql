
-- Table for partner candidacies from "Devenir Partenaire" form
CREATE TABLE public.partner_candidacies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT NOT NULL,
  siret TEXT NOT NULL,
  metier TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  insurance_file_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_candidacies ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a candidacy (public form)
CREATE POLICY "Anyone can submit a candidacy"
ON public.partner_candidacies
FOR INSERT
WITH CHECK (true);

-- Only admins can view all candidacies
CREATE POLICY "Admins can manage all candidacies"
ON public.partner_candidacies
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_partner_candidacies_updated_at
BEFORE UPDATE ON public.partner_candidacies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
