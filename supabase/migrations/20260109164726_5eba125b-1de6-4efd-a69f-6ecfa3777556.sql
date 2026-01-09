-- Create recommendations table for external recommendations (distinct from reviews linked to missions)
CREATE TABLE public.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES public.artisans(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Rating criteria (1-5)
  punctuality_rating INTEGER NOT NULL CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  presentation_rating INTEGER NOT NULL CHECK (presentation_rating >= 1 AND presentation_rating <= 5),
  work_quality_rating INTEGER NOT NULL CHECK (work_quality_rating >= 1 AND work_quality_rating <= 5),
  communication_rating INTEGER NOT NULL CHECK (communication_rating >= 1 AND communication_rating <= 5),
  
  -- Optional comment
  comment TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- A client can only recommend an artisan once
  UNIQUE(artisan_id, client_id)
);

-- Enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Public read access (everyone can see recommendations)
CREATE POLICY "Recommendations are viewable by everyone"
ON public.recommendations FOR SELECT USING (true);

-- Authenticated clients can create their own recommendations
CREATE POLICY "Clients can create their own recommendations"
ON public.recommendations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = recommendations.client_id
    AND profiles.user_id = auth.uid()
  )
);

-- Clients can update their own recommendations
CREATE POLICY "Clients can update their own recommendations"
ON public.recommendations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = recommendations.client_id
    AND profiles.user_id = auth.uid()
  )
);

-- Clients can delete their own recommendations
CREATE POLICY "Clients can delete their own recommendations"
ON public.recommendations FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = recommendations.client_id
    AND profiles.user_id = auth.uid()
  )
);

-- Admins can manage all recommendations
CREATE POLICY "Admins can manage all recommendations"
ON public.recommendations FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_recommendations_updated_at
BEFORE UPDATE ON public.recommendations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();