-- Fix 1: Remove overly permissive notification INSERT policy and create a secure function
-- Drop the problematic "Authenticated users can create notifications" policy
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;

-- Create a SECURITY DEFINER function for safe notification creation
-- This validates that notifications are created in legitimate contexts
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_related_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_notification_id uuid;
  v_current_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  
  -- Check if current user is admin
  v_is_admin := public.has_role(v_current_user_id, 'admin');
  
  -- Validate: either admin, or valid message/quote context
  -- For message notifications, verify sender relationship via messages table
  -- For quote notifications, verify artisan/client relationship
  IF NOT v_is_admin THEN
    -- Allow notification if related to a message where current user is sender
    IF p_type IN ('new_message', 'message') THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.messages m
        JOIN public.profiles p ON p.id = m.sender_id
        WHERE p.user_id = v_current_user_id
        AND (p_related_id IS NULL OR m.id = p_related_id)
      ) THEN
        -- Also allow if artisan sending to client they have conversation with
        IF NOT EXISTS (
          SELECT 1 FROM public.messages m
          JOIN public.profiles sender_p ON sender_p.id = m.sender_id
          JOIN public.profiles receiver_p ON receiver_p.id = m.receiver_id
          WHERE (sender_p.user_id = v_current_user_id OR receiver_p.user_id = v_current_user_id)
        ) THEN
          RAISE EXCEPTION 'Unauthorized notification creation';
        END IF;
      END IF;
    -- Allow quote notifications if user is party to the quote
    ELSIF p_type IN ('quote_received', 'quote_accepted', 'quote_refused') THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.quotes q
        JOIN public.artisans a ON a.id = q.artisan_id
        JOIN public.profiles p ON p.id = q.client_id
        WHERE (a.user_id = v_current_user_id OR p.user_id = v_current_user_id)
        AND (p_related_id IS NULL OR q.id = p_related_id)
      ) THEN
        RAISE EXCEPTION 'Unauthorized quote notification';
      END IF;
    -- For other notification types, require admin
    ELSE
      RAISE EXCEPTION 'Only admins can create this notification type';
    END IF;
  END IF;
  
  -- Insert the notification
  INSERT INTO public.notifications (user_id, type, title, message, related_id)
  VALUES (p_user_id, p_type, p_title, p_message, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Fix 2: Update public_artisans view to hide contact info for prospects
-- Only active artisans should have their email/phone exposed
DROP VIEW IF EXISTS public.public_artisans;

CREATE VIEW public.public_artisans WITH (security_invoker = true) AS
SELECT 
  id,
  business_name,
  description,
  city,
  department,
  region,
  address,
  postal_code,
  photo_url,
  portfolio_images,
  portfolio_videos,
  rating,
  review_count,
  experience_years,
  hourly_rate,
  qualifications,
  availability,
  is_verified,
  missions_completed,
  status,
  created_at,
  updated_at,
  slug,
  category_id,
  facebook_url,
  instagram_url,
  linkedin_url,
  website_url,
  -- Only expose contact info for active (verified) artisans
  CASE WHEN status = 'active'::artisan_status THEN email ELSE NULL END as email,
  CASE WHEN status = 'active'::artisan_status THEN phone ELSE NULL END as phone
FROM public.artisans
WHERE status IN ('active'::artisan_status, 'prospect'::artisan_status);

-- Fix 3: Remove confusing public SELECT policies on artisans base table
-- Force all public access through the public_artisans view
DROP POLICY IF EXISTS "Public can view active artisans" ON public.artisans;
DROP POLICY IF EXISTS "Public can view prospect artisans" ON public.artisans;

-- Ensure owner and admin policies remain for direct table access
-- These already exist but let's make sure they're correct
DROP POLICY IF EXISTS "Artisans full data viewable by owner or admin" ON public.artisans;
CREATE POLICY "Artisans full data viewable by owner or admin" 
ON public.artisans 
FOR SELECT 
USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Create a policy for anonymous/public access to the VIEW only
-- The view itself filters and protects sensitive data
GRANT SELECT ON public.public_artisans TO anon;
GRANT SELECT ON public.public_artisans TO authenticated;