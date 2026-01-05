-- Drop old restrictive policies based on auth.uid()
DROP POLICY IF EXISTS "Artisans can upload their own portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Artisans can update their own portfolio files" ON storage.objects;
DROP POLICY IF EXISTS "Artisans can delete their own portfolio files" ON storage.objects;

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can upload files to artisan-portfolios" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files in artisan-portfolios" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files in artisan-portfolios" ON storage.objects;

-- New secure policies based on artisan_id folder structure
-- INSERT: Folder must match an artisan_id where user is owner OR user is admin
CREATE POLICY "Portfolio upload for artisan owner or admin" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'artisan-portfolios' AND (
    EXISTS (
      SELECT 1 FROM public.artisans 
      WHERE id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- UPDATE: Same logic
CREATE POLICY "Portfolio update for artisan owner or admin" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'artisan-portfolios' AND (
    EXISTS (
      SELECT 1 FROM public.artisans 
      WHERE id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);

-- DELETE: Same logic
CREATE POLICY "Portfolio delete for artisan owner or admin" ON storage.objects
FOR DELETE USING (
  bucket_id = 'artisan-portfolios' AND (
    EXISTS (
      SELECT 1 FROM public.artisans 
      WHERE id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
);