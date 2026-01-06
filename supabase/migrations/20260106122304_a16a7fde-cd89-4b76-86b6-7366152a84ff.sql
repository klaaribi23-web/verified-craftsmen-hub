-- Update RLS policies to allow admins to upload/update/delete portfolio images

-- POLICY: INSERT (Upload)
DROP POLICY IF EXISTS "Artisans can upload to their portfolio folder" ON storage.objects;

CREATE POLICY "Artisans and Admins can upload portfolio files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'artisan-portfolios' 
  AND (
    auth.role() = 'service_role' 
    OR
    -- Check if user owns the artisan
    (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM public.artisans 
      WHERE user_id = auth.uid()
    )
    OR
    -- Check if user is admin
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- POLICY: UPDATE
DROP POLICY IF EXISTS "Artisans can update their portfolio files" ON storage.objects;

CREATE POLICY "Artisans and Admins can update portfolio files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'artisan-portfolios' 
  AND (
    auth.role() = 'service_role' 
    OR
    (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM public.artisans 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- POLICY: DELETE
DROP POLICY IF EXISTS "Artisans can delete their portfolio files" ON storage.objects;

CREATE POLICY "Artisans and Admins can delete portfolio files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'artisan-portfolios' 
  AND (
    auth.role() = 'service_role' 
    OR
    (storage.foldername(name))[1] IN (
      SELECT id::text 
      FROM public.artisans 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
);