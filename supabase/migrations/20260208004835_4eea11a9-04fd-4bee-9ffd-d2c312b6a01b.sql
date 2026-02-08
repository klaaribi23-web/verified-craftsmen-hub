
-- Table pour tracker les demandes de projet reçues par les artisans
CREATE TABLE public.project_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id uuid NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_city text NOT NULL,
  project_description text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;

-- Admins can see all requests (for tracking dashboard)
CREATE POLICY "Admins can manage all project requests"
ON public.project_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Artisans can view their own requests
CREATE POLICY "Artisans can view their own project requests"
ON public.project_requests FOR SELECT
USING (EXISTS (
  SELECT 1 FROM artisans WHERE artisans.id = project_requests.artisan_id AND artisans.user_id = auth.uid()
));

-- Anyone can submit a project request (public form)
CREATE POLICY "Anyone can submit a project request"
ON public.project_requests FOR INSERT
WITH CHECK (true);
