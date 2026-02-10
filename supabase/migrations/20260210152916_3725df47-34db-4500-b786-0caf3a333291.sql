
-- Add is_permanent column to protect critical artisan records from bulk cleanup
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS is_permanent boolean NOT NULL DEFAULT false;

-- Add a comment for documentation
COMMENT ON COLUMN public.artisans.is_permanent IS 'Protected artisans that must NEVER be deleted by cleanup scripts';
