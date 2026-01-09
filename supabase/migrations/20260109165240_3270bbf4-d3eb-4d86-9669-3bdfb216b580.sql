-- Add moderation status to recommendations
ALTER TABLE public.recommendations 
ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Add rejection reason (optional)
ALTER TABLE public.recommendations 
ADD COLUMN rejection_reason TEXT;

-- Update SELECT policy to only show approved recommendations publicly (or own recommendations)
DROP POLICY IF EXISTS "Recommendations are viewable by everyone" ON public.recommendations;

CREATE POLICY "Public can view approved recommendations"
ON public.recommendations FOR SELECT
USING (
  status = 'approved' 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = recommendations.client_id
    AND profiles.user_id = auth.uid()
  )
);

-- Index for faster queries on status
CREATE INDEX idx_recommendations_status ON public.recommendations(status);