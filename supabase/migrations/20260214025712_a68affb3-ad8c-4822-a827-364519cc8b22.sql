
-- Revoke SELECT on sensitive artisan columns from public roles
-- These columns should never be accessible via the public policy
REVOKE SELECT (email, phone, siret, insurance_number, address, postal_code) 
ON TABLE public.artisans FROM anon;

REVOKE SELECT (email, phone, siret, insurance_number, address, postal_code) 
ON TABLE public.artisans FROM authenticated;

-- Also revoke sensitive profile columns from non-owner access
REVOKE SELECT (confirmation_token, confirmation_sent_at) 
ON TABLE public.profiles FROM anon;

REVOKE SELECT (confirmation_token, confirmation_sent_at) 
ON TABLE public.profiles FROM authenticated;
