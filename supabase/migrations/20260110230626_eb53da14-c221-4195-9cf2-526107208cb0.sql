-- Add columns to track reminder emails for vitrines en attente
ALTER TABLE public.artisans 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.artisans.reminder_sent_at IS 'Timestamp of last reminder email sent to vitrine en attente';
COMMENT ON COLUMN public.artisans.reminder_count IS 'Number of reminder emails sent to this artisan';