-- Add subscription columns to artisans table
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS display_priority INTEGER DEFAULT 100;
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS missions_applied_this_month INTEGER DEFAULT 0;
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS last_mission_reset TIMESTAMPTZ;

-- Create index for better sorting performance
CREATE INDEX IF NOT EXISTS idx_artisans_display_priority ON public.artisans(display_priority ASC, rating DESC NULLS LAST);

-- Create index for subscription tier
CREATE INDEX IF NOT EXISTS idx_artisans_subscription_tier ON public.artisans(subscription_tier);