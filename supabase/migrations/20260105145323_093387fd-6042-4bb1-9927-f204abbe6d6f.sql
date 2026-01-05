-- Fix security definer view by setting security_invoker
ALTER VIEW public_artisans SET (security_invoker = on);