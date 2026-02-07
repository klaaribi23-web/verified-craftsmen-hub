
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS is_audited boolean NOT NULL DEFAULT false;
