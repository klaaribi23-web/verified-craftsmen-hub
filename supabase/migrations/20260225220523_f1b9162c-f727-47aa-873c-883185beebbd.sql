
-- Table category_keywords for semantic search
CREATE TABLE public.category_keywords (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  keywords text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_keywords ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Category keywords are viewable by everyone"
  ON public.category_keywords
  FOR SELECT
  USING (true);

-- Admin manage policy
CREATE POLICY "Admins can manage category keywords"
  ON public.category_keywords
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
