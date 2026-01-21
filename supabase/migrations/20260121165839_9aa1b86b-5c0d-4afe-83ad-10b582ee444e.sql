-- Add missing column for approval request tracking
ALTER TABLE public.artisans 
ADD COLUMN IF NOT EXISTS approval_requested_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.artisans.approval_requested_at IS 'Date de la demande d''approbation par l''artisan';