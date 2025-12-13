-- Add activation_token column to artisans table for tracking prospect activation
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS activation_token uuid DEFAULT NULL;
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS activation_sent_at timestamp with time zone DEFAULT NULL;

-- Add RLS policy to allow public access to prospect artisans (read-only, limited fields)
CREATE POLICY "Public can view prospect artisans" 
ON public.artisans 
FOR SELECT 
USING (status = 'prospect'::artisan_status);

-- Create index for activation token lookups
CREATE INDEX IF NOT EXISTS idx_artisans_activation_token ON public.artisans(activation_token) WHERE activation_token IS NOT NULL;