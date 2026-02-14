-- Revoke direct access to sensitive artisan columns for authenticated role
-- These columns should only be accessible via admin or service_role
REVOKE ALL ON TABLE public.artisans FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.artisans TO authenticated;

-- Revoke sensitive column access from authenticated users
-- activation_token and stripe_customer_id should not be readable by non-admin
REVOKE SELECT (activation_token, stripe_customer_id, activation_sent_at) ON TABLE public.artisans FROM authenticated;
REVOKE SELECT (activation_token, stripe_customer_id, activation_sent_at) ON TABLE public.artisans FROM anon;

-- Grant only safe columns to authenticated (RLS still applies on top)
-- The public_artisans view already handles public-facing data without these columns
GRANT SELECT (
  id, business_name, city, department, region, address, postal_code,
  description, phone, email, slug, photo_url, portfolio_images, portfolio_videos,
  website_url, linkedin_url, instagram_url, facebook_url,
  qualifications, insurance_number, siret, hourly_rate, experience_years,
  status, is_verified, rating, review_count, missions_completed,
  created_at, updated_at, working_hours, google_maps_url, google_id,
  google_rating, google_review_count, latitude, longitude,
  intervention_radius, subscription_tier, subscription_end,
  display_priority, missions_applied_this_month, last_mission_reset,
  reminder_sent_at, reminder_count, approval_requested_at, is_audited,
  is_permanent, source, user_id, profile_id, category_id
) ON TABLE public.artisans TO authenticated;
