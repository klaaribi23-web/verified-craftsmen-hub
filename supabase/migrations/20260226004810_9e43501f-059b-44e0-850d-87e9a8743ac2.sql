
-- Add subscription_status to artisans table
ALTER TABLE public.artisans 
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'inactive';

-- Create subscription_events table
CREATE TABLE IF NOT EXISTS public.subscription_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artisan_id uuid REFERENCES public.artisans(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  stripe_event_id text UNIQUE NOT NULL,
  amount integer,
  status text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on subscription_events
ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Admin-only read access
CREATE POLICY "Admins can manage subscription events"
  ON public.subscription_events
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Service role can insert (for webhooks)
CREATE POLICY "Service role can insert subscription events"
  ON public.subscription_events
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role'::text);

-- Update public_artisans view to include subscription_status
DROP VIEW IF EXISTS public.public_artisans;
CREATE VIEW public.public_artisans AS
SELECT 
  id, slug, business_name, description, city, department, region,
  category_id, hourly_rate, experience_years, rating, review_count,
  missions_completed, photo_url, portfolio_images, portfolio_videos,
  is_verified, status, facebook_url, instagram_url, linkedin_url,
  website_url, qualifications, working_hours, created_at, updated_at,
  google_maps_url, google_rating, google_review_count, subscription_tier,
  display_priority, intervention_radius, latitude, longitude,
  is_audited, profile_id, available_urgent, available_urgent_at, is_rge,
  subscription_status
FROM public.artisans;
