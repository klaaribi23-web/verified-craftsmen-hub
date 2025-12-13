-- Create function to record story view (prevents duplicates)
CREATE OR REPLACE FUNCTION public.record_story_view(
  p_story_id UUID,
  p_viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_viewed BOOLEAN;
BEGIN
  -- Check if this viewer already viewed this story
  SELECT EXISTS(
    SELECT 1 FROM story_views 
    WHERE story_id = p_story_id 
    AND (
      (p_viewer_id IS NOT NULL AND viewer_id = p_viewer_id)
      OR (p_viewer_id IS NULL AND viewer_id IS NULL AND viewed_at > now() - interval '24 hours')
    )
  ) INTO v_already_viewed;
  
  -- If already viewed, return false
  IF v_already_viewed THEN
    RETURN FALSE;
  END IF;
  
  -- Insert the view record
  INSERT INTO story_views (story_id, viewer_id)
  VALUES (p_story_id, p_viewer_id);
  
  -- Increment the view count
  UPDATE artisan_stories 
  SET views_count = COALESCE(views_count, 0) + 1 
  WHERE id = p_story_id AND expires_at > now();
  
  RETURN TRUE;
END;
$$;