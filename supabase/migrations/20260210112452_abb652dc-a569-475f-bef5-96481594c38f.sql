
-- Step 1: Revoke default SELECT on ALL columns for anon
REVOKE SELECT ON public.artisans FROM anon;

-- Step 2: Grant SELECT only on non-sensitive columns for anon
GRANT SELECT (
  id, business_name, city, department, region, postal_code, address,
  description, category_id, experience_years, hourly_rate,
  is_verified, is_audited, rating, review_count, missions_completed,
  photo_url, portfolio_images, portfolio_videos,
  qualifications, intervention_radius, working_hours,
  latitude, longitude, slug, status, display_priority,
  subscription_tier, created_at, updated_at,
  website_url, facebook_url, instagram_url, linkedin_url,
  google_maps_url, google_rating, google_review_count, profile_id
) ON public.artisans TO anon;

-- Step 3: Ensure authenticated users who are NOT admin/owner also get restricted view
-- (Admins and owners already have full access via their own policies)
-- Revoke and re-grant for authenticated too
REVOKE SELECT ON public.artisans FROM authenticated;

GRANT SELECT (
  id, business_name, city, department, region, postal_code, address,
  description, category_id, experience_years, hourly_rate,
  is_verified, is_audited, rating, review_count, missions_completed,
  photo_url, portfolio_images, portfolio_videos,
  qualifications, intervention_radius, working_hours,
  latitude, longitude, slug, status, display_priority,
  subscription_tier, created_at, updated_at,
  website_url, facebook_url, instagram_url, linkedin_url,
  google_maps_url, google_rating, google_review_count, profile_id,
  user_id, email, phone, siret, insurance_number, stripe_customer_id,
  source, activation_token, activation_sent_at, reminder_sent_at, reminder_count,
  approval_requested_at, subscription_end, missions_applied_this_month,
  last_mission_reset, google_id
) ON public.artisans TO authenticated;
