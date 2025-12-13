-- Add photos column to missions table (max 3 photos)
ALTER TABLE public.missions ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.missions.photos IS 'Array of photo URLs for the mission (max 3 photos)';