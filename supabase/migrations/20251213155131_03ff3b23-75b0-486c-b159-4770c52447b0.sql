-- Create table to track user devices/sessions
CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_trusted BOOLEAN DEFAULT false,
  UNIQUE(user_id, device_fingerprint)
);

-- Index for fast lookups
CREATE INDEX idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX idx_user_devices_fingerprint ON public.user_devices(device_fingerprint);

-- Enable RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own devices
CREATE POLICY "Users can view their own devices"
ON public.user_devices
FOR SELECT
USING (auth.uid() = user_id);

-- Users can delete their own devices
CREATE POLICY "Users can delete their own devices"
ON public.user_devices
FOR DELETE
USING (auth.uid() = user_id);

-- Service role can manage all (for edge functions)
CREATE POLICY "Service role access"
ON public.user_devices
FOR ALL
USING (false);