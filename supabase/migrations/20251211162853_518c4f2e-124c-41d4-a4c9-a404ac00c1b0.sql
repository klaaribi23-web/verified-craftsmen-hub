-- Allow authenticated users (admins) to upload files to artisan-portfolios bucket
CREATE POLICY "Authenticated users can upload files to artisan-portfolios"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'artisan-portfolios'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploaded files
CREATE POLICY "Authenticated users can update files in artisan-portfolios"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'artisan-portfolios'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files in artisan-portfolios
CREATE POLICY "Authenticated users can delete files in artisan-portfolios"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'artisan-portfolios'
  AND auth.role() = 'authenticated'
);