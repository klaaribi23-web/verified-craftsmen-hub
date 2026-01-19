-- Create table to track contact form submissions for rate limiting
CREATE TABLE public.contact_rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient IP lookups
CREATE INDEX idx_contact_rate_limits_ip_created ON public.contact_rate_limits (ip_address, created_at DESC);

-- Enable RLS (but allow service role to manage)
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;

-- No public policies - only service role can access this table
-- This keeps the rate limit data private

-- Function to clean up old rate limit entries (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.contact_rate_limits
  WHERE created_at < now() - interval '24 hours';
END;
$$;