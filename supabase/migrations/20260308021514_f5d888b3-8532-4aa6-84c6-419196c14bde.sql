
CREATE TABLE public.link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid REFERENCES public.artisans(id) ON DELETE CASCADE,
  email text,
  source text DEFAULT 'direct',
  clicked_at timestamp with time zone NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);

ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (prospects are not authenticated)
CREATE POLICY "Anyone can insert link clicks"
  ON public.link_clicks FOR INSERT
  WITH CHECK (true);

-- Admins can read all
CREATE POLICY "Admins can manage link clicks"
  ON public.link_clicks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Artisans can see their own clicks
CREATE POLICY "Artisans can view their own link clicks"
  ON public.link_clicks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM artisans WHERE artisans.id = link_clicks.artisan_id AND artisans.user_id = auth.uid()
  ));

-- Index for fast lookups
CREATE INDEX idx_link_clicks_artisan_id ON public.link_clicks(artisan_id);
CREATE INDEX idx_link_clicks_email ON public.link_clicks(email);
