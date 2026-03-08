
-- Profile views tracking table
CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  viewer_ip text,
  viewer_user_id uuid,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast counting
CREATE INDEX idx_profile_views_artisan_id ON public.profile_views(artisan_id);
CREATE INDEX idx_profile_views_viewed_at ON public.profile_views(viewed_at);

-- RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a view (public profiles)
CREATE POLICY "Anyone can insert profile views"
ON public.profile_views FOR INSERT
WITH CHECK (true);

-- Artisans can view their own profile views count
CREATE POLICY "Artisans can view their own profile views"
ON public.profile_views FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.artisans
    WHERE artisans.id = profile_views.artisan_id
    AND artisans.user_id = auth.uid()
  )
);

-- Admins can manage all
CREATE POLICY "Admins can manage profile views"
ON public.profile_views FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert
CREATE POLICY "Service role can insert profile views"
ON public.profile_views FOR INSERT
WITH CHECK (auth.role() = 'service_role'::text);
