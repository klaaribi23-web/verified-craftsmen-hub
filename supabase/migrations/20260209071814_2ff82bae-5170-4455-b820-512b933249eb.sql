
-- Table for partner offers managed by admin
CREATE TABLE public.partner_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  discount_label TEXT NOT NULL,
  promo_code TEXT,
  logo_url TEXT,
  link_url TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_offers ENABLE ROW LEVEL SECURITY;

-- Everyone can view active offers
CREATE POLICY "Active partner offers are viewable by authenticated users"
ON public.partner_offers
FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Admins can manage all offers
CREATE POLICY "Admins can manage all partner offers"
ON public.partner_offers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_partner_offers_updated_at
BEFORE UPDATE ON public.partner_offers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
