-- Mettre à jour la fonction pour ne compter que 3 documents (sans 'identite')
CREATE OR REPLACE FUNCTION public.count_mandatory_documents(p_artisan_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(DISTINCT name)::integer
  FROM public.artisan_documents
  WHERE artisan_id = p_artisan_id
    AND name IN ('rc_pro', 'decennale', 'kbis')
$$;

-- Recréer la politique RLS pour vérifier >= 3 documents
DROP POLICY IF EXISTS "Artisans can update their own profile" ON public.artisans;

CREATE POLICY "Artisans can update their own profile"
ON public.artisans
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  CASE 
    WHEN status = 'pending' THEN 
      public.count_mandatory_documents(id) >= 3
    ELSE 
      true
  END
);