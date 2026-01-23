-- Fonction helper pour compter les documents obligatoires d'un artisan
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
    AND name IN ('rc_pro', 'decennale', 'kbis', 'identite')
$$;

-- Supprimer l'ancienne policy UPDATE des artisans
DROP POLICY IF EXISTS "Artisans can update their own profile" ON public.artisans;

-- Recréer avec WITH CHECK pour bloquer pending sans 4 documents
CREATE POLICY "Artisans can update their own profile"
ON public.artisans
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  -- Si le nouveau status est 'pending', vérifier les 4 documents
  CASE 
    WHEN status = 'pending' THEN 
      public.count_mandatory_documents(id) >= 4
    ELSE 
      true
  END
);