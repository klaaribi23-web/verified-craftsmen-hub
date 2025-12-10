-- Create quotes table
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  price_ht NUMERIC NOT NULL,
  tva_rate NUMERIC NOT NULL DEFAULT 20,
  price_ttc NUMERIC GENERATED ALWAYS AS (price_ht * (1 + tva_rate / 100)) STORED,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'refused')),
  message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Artisans can view their own quotes"
ON public.quotes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM artisans WHERE artisans.id = quotes.artisan_id AND artisans.user_id = auth.uid()
));

CREATE POLICY "Clients can view their own quotes"
ON public.quotes FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = quotes.client_id AND profiles.user_id = auth.uid()
));

CREATE POLICY "Artisans can create quotes"
ON public.quotes FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM artisans WHERE artisans.id = quotes.artisan_id AND artisans.user_id = auth.uid()
));

CREATE POLICY "Clients can update quote status"
ON public.quotes FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = quotes.client_id AND profiles.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = quotes.client_id AND profiles.user_id = auth.uid()
));

CREATE POLICY "Admins can manage all quotes"
ON public.quotes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_quotes_updated_at
BEFORE UPDATE ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.quotes;