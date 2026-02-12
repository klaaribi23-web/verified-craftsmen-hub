-- Revoke authenticated access to sensitive columns on artisans table
-- Keep phone/email accessible (needed for client-artisan contact feature)
-- Remove access to internal/financial columns that should never be exposed

REVOKE SELECT (stripe_customer_id, insurance_number, google_id, activation_token, activation_sent_at) 
ON public.artisans FROM authenticated;

-- Re-grant SELECT on all safe columns for authenticated role
GRANT SELECT (
  id, business_name, category_id, city, description, display_priority, 
  experience_years, google_maps_url, google_rating, google_review_count, 
  hourly_rate, intervention_radius, is_audited, is_verified, latitude, longitude,
  missions_completed, photo_url, portfolio_images, portfolio_videos, postal_code,
  profile_id, qualifications, rating, region, review_count, slug, status,
  subscription_tier, updated_at, website_url, working_hours, address, department,
  created_at, facebook_url, instagram_url, linkedin_url, 
  phone, email, siret, user_id, is_permanent, source,
  subscription_end, missions_applied_this_month, last_mission_reset,
  reminder_sent_at, reminder_count, approval_requested_at
) ON public.artisans TO authenticated;