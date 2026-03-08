
-- Add heat_score column to artisans table for prospect prioritization
ALTER TABLE public.artisans ADD COLUMN IF NOT EXISTS heat_score integer DEFAULT 0;

-- Create a function to calculate heat score based on engagement signals
CREATE OR REPLACE FUNCTION public.calculate_heat_score(p_artisan_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_score integer := 0;
  v_artisan record;
  v_click_count integer;
  v_profile_views integer;
  v_google_rating numeric;
  v_google_reviews integer;
BEGIN
  -- Get artisan data
  SELECT * INTO v_artisan FROM public.artisans WHERE id = p_artisan_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- 1. Link clicks (max 30 points: 10 per click)
  SELECT COUNT(*) INTO v_click_count FROM public.link_clicks WHERE artisan_id = p_artisan_id;
  v_score := v_score + LEAST(v_click_count * 10, 30);

  -- 2. Profile views last 30 days (max 20 points: 2 per view)
  SELECT COUNT(*) INTO v_profile_views FROM public.profile_views 
  WHERE artisan_id = p_artisan_id AND viewed_at > now() - interval '30 days';
  v_score := v_score + LEAST(v_profile_views * 2, 20);

  -- 3. Google reputation (max 25 points)
  v_google_rating := COALESCE(v_artisan.google_rating, 0);
  v_google_reviews := COALESCE(v_artisan.google_review_count, 0);
  IF v_google_rating >= 4.5 AND v_google_reviews >= 20 THEN v_score := v_score + 25;
  ELSIF v_google_rating >= 4.0 AND v_google_reviews >= 10 THEN v_score := v_score + 20;
  ELSIF v_google_rating >= 3.5 AND v_google_reviews >= 5 THEN v_score := v_score + 10;
  ELSIF v_google_reviews > 0 THEN v_score := v_score + 5;
  END IF;

  -- 4. Status progression bonus (max 15 points)
  IF v_artisan.status = 'suspended' THEN v_score := v_score + 15; -- Already clicked
  ELSIF v_artisan.status = 'pending' THEN v_score := v_score + 10; -- Contacted
  ELSIF v_artisan.status = 'disponible' THEN v_score := v_score + 0; -- Cold
  END IF;

  -- 5. Completeness bonus (max 10 points)
  IF v_artisan.photo_url IS NOT NULL THEN v_score := v_score + 3; END IF;
  IF v_artisan.description IS NOT NULL THEN v_score := v_score + 3; END IF;
  IF v_artisan.siret IS NOT NULL THEN v_score := v_score + 2; END IF;
  IF v_artisan.phone IS NOT NULL THEN v_score := v_score + 2; END IF;

  RETURN LEAST(v_score, 100);
END;
$$;

-- Create a function to batch-update heat scores (called by cron or admin)
CREATE OR REPLACE FUNCTION public.refresh_all_heat_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer := 0;
  v_artisan record;
BEGIN
  FOR v_artisan IN 
    SELECT id FROM public.artisans 
    WHERE status IN ('disponible', 'pending', 'suspended')
    AND user_id IS NULL
  LOOP
    UPDATE public.artisans 
    SET heat_score = public.calculate_heat_score(v_artisan.id)
    WHERE id = v_artisan.id;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
